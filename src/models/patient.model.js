const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true, trim: true },
    name: { type: String, required: true, trim: true }, // Unified field
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true }, // Flattened for simplicity
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    allergies: [String],
    medicalHistory: [{ condition: String, diagnosedOn: Date, status: String }],
  },
  { timestamps: true },
);

// Only keep patientId generation logic
patientSchema.pre("save", async function () {
  if (!this.patientId) {
    const count = await this.constructor.countDocuments();
    this.patientId = `PAT${String(count + 1).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("Patient", patientSchema);
