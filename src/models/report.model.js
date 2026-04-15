const mongoose = require("mongoose");

/* ---------- Sub Schema ---------- */
const testResultSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true },
    value: { type: String, default: "" },
    unit: { type: String, default: "" },
    referenceRange: { type: String, default: "" },
    flag: {
      type: String,
      enum: ["Normal", "High", "Low", "Critical"],
      default: "Normal",
    },
  },
  { _id: false }
);

/* ---------- Main Schema ---------- */
const reportSchema = new mongoose.Schema(
  {
    // reportId: { type: String, unique: true },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    results: [testResultSchema],

    impression: String,
    remarks: String,

    status: {
      type: String,
      enum: ["Draft", "Completed", "Verified"],
      default: "Draft",
    },

    reportedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTechnician",
      // required: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,

    pdfUrl: String,

    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      // required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ---------- Auto ID ---------- */
// const Counter = require("../models/counter.model");

// reportSchema.pre("save", async function () {
//   // ✅ SAFE UNIQUE ID GENERATION
//   if (!this.reportId) {
//     const counter = await Counter.findOneAndUpdate(
//       { name: "reportId" },
//       { $inc: { seq: 1 } },
//       { new: true, upsert: true }
//     );

//     this.reportId = `RPT${String(counter.seq).padStart(5, "0")}`;
//   }

//   // ✅ Existing logic
//   if (this.status === "Completed" && !this.reportedAt) {
//     this.reportedAt = new Date();
//   }
// });

module.exports = mongoose.model("Report", reportSchema);

