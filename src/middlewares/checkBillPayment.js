const Billing = require("../models/billing.model");
const Report = require("../models/report.model");

exports.checkBillPayment = async (req, res, next) => {
  try {

    const reportId = req.params.id;

    // 1️⃣ Find report
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // 2️⃣ Find bill using appointmentId
    const bill = await Billing.findOne({
      appointmentId: report.appointmentId
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found for this report"
      });
    }

    // 3️⃣ Check payment status
    if (bill.paymentStatus !== "Paid" || bill.balanceDue > 0) {
      return res.status(402).json({
        success: false,
        message: "Payment required before accessing report",
        billId: bill._id,
        totalAmount: bill.totalAmount,
        amountPaid: bill.amountPaid,
        balanceDue: bill.balanceDue
      });
    }

    // attach for controller if needed
    req.bill = bill;
    req.report = report;

    next();

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};