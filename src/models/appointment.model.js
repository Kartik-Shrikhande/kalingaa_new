const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    // Replaced single IDs with an items array
    items: [
      {
        itemType: { type: String, enum: ["Test", "Package"], required: true },
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: String,
        price: Number,
      },
    ],
    notes: { type: String },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    totalAmount: { type: Number, default: 0 },
    // billingStatus: {
    //   type: String,
    //   enum: ["Unpaid", "Billed"],
    //   default: "Unpaid",
    // },
    // billId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Billing",
    // },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
