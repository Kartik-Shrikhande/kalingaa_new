// New file
const Billing = require("../models/billing.model");
const Patient = require("../models/patient.model");
const Test = require("../models/test.model");
const Package = require("../models/package.model");
const mongoose = require("mongoose");

exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      patientId,
      items,
      discount,
      taxPercentage,
      paymentMode,
      paymentDetails,
      amountPaid,
      doctorName,
      referredBy,
      notes,
    } = req.body;

    // Validate patient exists
    const patient = await Patient.findOne({
      _id: patientId,
      franchiseId: req.user.franchiseId,
    }).session(session);

    if (!patient) {
      await session.abortTransaction();
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (item.itemType === "Test") {
        const test = await Test.findOne({
          _id: item.itemId,
          franchiseId: req.user.franchiseId,
          isActive: true,
        }).session(session);

        if (!test) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Test ${item.itemId} not found or inactive`,
          });
        }

        const finalPrice = item.finalPrice || test.price;
        const discountAmount = item.discountAmount || 0;

        processedItems.push({
          itemType: "Test",
          itemId: test._id,
          itemName: test.name,
          itemCode: test.code,
          quantity: item.quantity || 1,
          unitPrice: test.price,
          discountType: item.discountType || "None",
          discountValue: item.discountValue || 0,
          discountAmount: discountAmount,
          finalPrice: finalPrice,
          isPackage: false,
        });

        subtotal += finalPrice * (item.quantity || 1);
      } else if (item.itemType === "Package") {
        const package = await Package.findOne({
          _id: item.itemId,
          franchiseId: req.user.franchiseId,
          isActive: true,
        })
          .populate("includesTests.test", "name code price")
          .session(session);

        if (!package) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Package ${item.itemId} not found or inactive`,
          });
        }

        // Get package tests for reporting
        const packageTests = [];
        for (const pkgItem of package.includesTests) {
          if (pkgItem.test) {
            packageTests.push({
              testId: pkgItem.test._id,
              testName: pkgItem.test.name,
              testCode: pkgItem.test.code,
              price: pkgItem.test.price,
            });
          }
        }

        const finalPrice = item.finalPrice || package.specialPrice;
        const discountAmount =
          item.discountAmount || package.regularPrice - package.specialPrice;

        processedItems.push({
          itemType: "Package",
          itemId: package._id,
          itemName: package.name,
          itemCode: package.code,
          quantity: item.quantity || 1,
          unitPrice: package.regularPrice,
          discountType: "Fixed",
          discountValue: discountAmount,
          discountAmount: discountAmount,
          finalPrice: finalPrice,
          isPackage: true,
          packageTests: packageTests,
        });

        subtotal += finalPrice * (item.quantity || 1);
      }
    }

    // Create billing record
    const billingData = {
      patientId: patient._id,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      doctorName: doctorName || patient.doctorName,
      referredBy: referredBy || patient.referredBy,
      items: processedItems,
      discount: discount || 0,
      taxPercentage: taxPercentage || 18,
      paymentMode: paymentMode || "Cash",
      paymentDetails: paymentDetails || {},
      amountPaid: amountPaid || 0,
      franchiseId: req.user.franchiseId,
      createdBy: req.user._id,
      notes: notes,
    };

    const billing = await Billing.create([billingData], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Bill created successfully",
      data: billing[0],
      billNumber: billing[0].billNumber,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: "Failed to create bill",
      error: error.message,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      paymentStatus,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      franchiseId: req.user.franchiseId,
    };

    // Date range filter
    if (startDate || endDate) {
      filter.billingDate = {};
      if (startDate) {
        filter.billingDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.billingDate.$lte = end;
      }
    }

    if (paymentStatus && paymentStatus !== "All") {
      filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { patientName: { $regex: search, $options: "i" } },
        { patientPhone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      Billing.find(filter)
        .populate("patientId", "patientId fullName phone")
        .sort({ billingDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Billing.countDocuments(filter),
    ]);

    return res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bills,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch bills",
      error: error.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const bill = await Billing.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    }).populate(
      "patientId",
      "patientId fullName age gender phone email address",
    );

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    return res.status(200).json(bill);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch bill",
      error: error.message,
    });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { amountPaid, paymentMode, paymentDetails, paymentStatus } = req.body;

    const bill = await Billing.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    if (amountPaid !== undefined) {
      bill.amountPaid = amountPaid;
      bill.balanceDue = bill.totalAmount - amountPaid;
    }

    if (paymentMode) {
      bill.paymentMode = paymentMode;
    }

    if (paymentDetails) {
      bill.paymentDetails = { ...bill.paymentDetails, ...paymentDetails };
    }

    if (paymentStatus) {
      bill.paymentStatus = paymentStatus;
    } else if (bill.balanceDue <= 0) {
      bill.paymentStatus = "Paid";
    } else if (bill.amountPaid > 0) {
      bill.paymentStatus = "Partial";
    }

    await bill.save();

    return res.status(200).json({
      message: "Payment updated successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update payment",
      error: error.message,
    });
  }
};

exports.cancelBill = async (req, res) => {
  try {
    const bill = await Billing.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    if (bill.paymentStatus === "Cancelled") {
      return res.status(400).json({
        message: "Bill is already cancelled",
      });
    }

    bill.paymentStatus = "Cancelled";
    bill.isActive = false;
    await bill.save();

    return res.status(200).json({
      message: "Bill cancelled successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel bill",
      error: error.message,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalBills,
      todayBills,
      monthlyBills,
      yearlyBills,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      yearlyRevenue,
      pendingBills,
      partialBills,
      paidBills,
    ] = await Promise.all([
      // Counts
      Billing.countDocuments({
        franchiseId: req.user.franchiseId,
        isActive: true,
      }),
      Billing.countDocuments({
        franchiseId: req.user.franchiseId,
        billingDate: { $gte: today },
        isActive: true,
      }),
      Billing.countDocuments({
        franchiseId: req.user.franchiseId,
        billingDate: { $gte: startOfMonth },
        isActive: true,
      }),
      Billing.countDocuments({
        franchiseId: req.user.franchiseId,
        billingDate: { $gte: startOfYear },
        isActive: true,
      }),

      // Revenues
      Billing.aggregate([
        {
          $match: {
            franchiseId: new mongoose.Types.ObjectId(req.user.franchiseId),
            isActive: true,
            paymentStatus: { $ne: "Cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Billing.aggregate([
        {
          $match: {
            franchiseId: new mongoose.Types.ObjectId(req.user.franchiseId),
            billingDate: { $gte: today },
            isActive: true,
            paymentStatus: { $ne: "Cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Billing.aggregate([
        {
          $match: {
            franchiseId: new mongoose.Types.ObjectId(req.user.franchiseId),
            billingDate: { $gte: startOfMonth },
            isActive: true,
            paymentStatus: { $ne: "Cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Billing.aggregate([
        {
          $match: {
            franchiseId: new mongoose.Types.ObjectId(req.user.franchiseId),
            billingDate: { $gte: startOfYear },
            isActive: true,
            paymentStatus: { $ne: "Cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      // Payment status counts
      Billing.countDocuments({
        franchiseId: req.user.franchiseId,
        paymentStatus: "Pending",
        isActive: true,
      }),
      Billing.countDocuments({
        franchiseId: req.user.franchiseId,
        paymentStatus: "Partial",
        isActive: true,
      }),
      Billing.countDocuments({
        franchiseId: req.user.franchiseId,
        paymentStatus: "Paid",
        isActive: true,
      }),
    ]);

    return res.status(200).json({
      stats: {
        totalBills,
        todayBills,
        monthlyBills,
        yearlyBills,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        yearlyRevenue: yearlyRevenue[0]?.total || 0,
        pendingBills,
        partialBills,
        paidBills,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const monthlyRevenue = await Billing.aggregate([
      {
        $match: {
          franchiseId: new mongoose.Types.ObjectId(req.user.franchiseId),
          billingDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${parseInt(currentYear) + 1}-01-01`),
          },
          isActive: true,
          paymentStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: { $month: "$billingDate" },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id",
          revenue: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Fill missing months with zero
    const result = [];
    for (let month = 1; month <= 12; month++) {
      const found = monthlyRevenue.find((item) => item.month === month);
      result.push({
        month,
        monthName: new Date(2000, month - 1, 1).toLocaleString("default", {
          month: "short",
        }),
        revenue: found ? found.revenue : 0,
        count: found ? found.count : 0,
      });
    }

    return res.status(200).json({
      year: currentYear,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch monthly revenue",
      error: error.message,
    });
  }
};

exports.printBill = async (req, res) => {
  try {
    const bill = await Billing.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    })
      .populate(
        "patientId",
        "patientId fullName age gender phone email address",
      )
      .populate("createdBy", "name");

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    // Format bill for printing
    const printData = {
      billNumber: bill.billNumber,
      billingDate: bill.billingDate,
      patient: bill.patientId,
      patientName: bill.patientName,
      patientAge: bill.patientAge,
      patientGender: bill.patientGender,
      patientPhone: bill.patientPhone,
      doctorName: bill.doctorName,
      referredBy: bill.referredBy,
      items: bill.items,
      subtotal: bill.subtotal,
      discount: bill.discount,
      taxPercentage: bill.taxPercentage,
      taxAmount: bill.taxAmount,
      roundOff: bill.roundOff,
      totalAmount: bill.totalAmount,
      amountPaid: bill.amountPaid,
      balanceDue: bill.balanceDue,
      paymentStatus: bill.paymentStatus,
      paymentMode: bill.paymentMode,
      createdBy: bill.createdBy?.name || "System",
      notes: bill.notes,
    };

    return res.status(200).json(printData);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch bill for printing",
      error: error.message,
    });
  }
};
