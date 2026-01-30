// New file
const Billing = require("../models/billing.model");
const Patient = require("../models/patient.model");
const Test = require("../models/test.model");
const Package = require("../models/package.model");
const mongoose = require("mongoose");


exports.createBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { patientId, appointmentId, items, doctorName, referredBy, notes } = req.body;

    // 1️⃣ Fetch patient info
    const patient = await Patient.findOne({ _id: patientId, franchiseId: req.user.franchiseId }).session(session);
    if (!patient) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Patient not found" });
    }

    // 2️⃣ Process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = item.quantity || 1;
      let itemData, itemType;

      // Check Test
      itemData = await Test.findOne({ _id: item.itemId, franchiseId: req.user.franchiseId, isActive: true }).session(session);
      if (itemData) itemType = "Test";

      // Check Package
      if (!itemData) {
        itemData = await Package.findOne({ _id: item.itemId, franchiseId: req.user.franchiseId, isActive: true })
          .populate("includesTests.test", "name code price")
          .session(session);
        if (itemData) itemType = "Package";
      }

      if (!itemData) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Invalid itemId: ${item.itemId}` });
      }

      if (itemType === "Test") {
        const finalPrice = itemData.price * quantity;
        subtotal += finalPrice;

        processedItems.push({
          itemType,
          itemId: itemData._id,
          itemName: itemData.name,
          itemCode: itemData.code,
          quantity,
          unitPrice: itemData.price,
          finalPrice,
          discountType: "None",
          discountValue: 0,
          discountAmount: 0,
          isPackage: false,
        });
      } else if (itemType === "Package") {
        const unitPrice = itemData.specialPrice;
        const finalPrice = unitPrice * quantity;
        subtotal += finalPrice;

        const packageTests = itemData.includesTests.map((t) => ({
          testId: t.test?._id,
          testName: t.test?.name,
          testCode: t.test?.code,
          price: t.test?.price,
        }));

        processedItems.push({
          itemType,
          itemId: itemData._id,
          itemName: itemData.name,
          itemCode: itemData.code,
          quantity,
          unitPrice,
          finalPrice,
          discountType: "Fixed",
          discountValue: itemData.regularPrice - itemData.specialPrice,
          discountAmount: itemData.regularPrice - itemData.specialPrice,
          isPackage: true,
          packageTests,
        });
      }
    }

    // 3️⃣ Set defaults for payment
    const amountPaid = 0;
    const balanceDue = subtotal;
    const paymentStatus = "Pending";
    const paymentMode = "Cash";

    // 4️⃣ Create bill
    const bill = await Billing.create(
      [{
        patientId: patient._id,
        patientName: patient.name,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientPhone: patient.phone,

        appointmentId: appointmentId || null,
        doctorName: doctorName || patient.doctorName,
        referredBy: referredBy || patient.referredBy,

        items: processedItems,
        subtotal,
        discount: 0,
        tax: 0,
        taxPercentage: 0,
        taxAmount: 0,
        roundOff: 0,
        totalAmount: subtotal,

        amountPaid,
        balanceDue,
        paymentStatus,
        paymentMode,

        notes,
        franchiseId: req.user.franchiseId,
        createdBy: req.user._id,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Bill created successfully",
      data: bill[0],
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Failed to create bill", error: error.message });
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
        .populate("patientId", "patientId name phone")
         .select(
          "billingDate totalAmount amountPaid balanceDue paymentStatus doctorName referredBy"
        )
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
    }).populate("patientId", "patientId name age gender phone email address");

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
    const { amountPaid, paymentMode, paymentDetails } = req.body;

    const bill = await Billing.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // 1️⃣ Update amountPaid and balanceDue
    if (amountPaid !== undefined) {
      bill.amountPaid = amountPaid;
      bill.balanceDue = bill.totalAmount - amountPaid;

      // 2️⃣ Automatically determine paymentStatus
      if (bill.amountPaid >= bill.totalAmount) {
        bill.paymentStatus = "Paid";
        bill.balanceDue = 0; // ensure balanceDue doesn't go negative
      } else if (bill.amountPaid > 0) {
        bill.paymentStatus = "Partial";
      } else {
        bill.paymentStatus = "Pending";
      }
    }

    // 3️⃣ Update optional fields
    if (paymentMode) bill.paymentMode = paymentMode;
    if (paymentDetails) bill.paymentDetails = { ...bill.paymentDetails, ...paymentDetails };

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
      .populate("patientId", "patientId name age gender phone email address")
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
