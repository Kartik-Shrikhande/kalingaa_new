// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema(
//   {
//     patientId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Patient",
//     },
//     billId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Billing",
//     },
//     razorpayOrderId: String,
//     razorpayPaymentId: String,
//     razorpaySignature: String,
//     amount: Number,
//     status: {
//       type: String,
//       enum: ["created", "paid", "failed"],
//       default: "created",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Payment", paymentSchema);
