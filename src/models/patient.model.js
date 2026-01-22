const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: "India",
      },
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    medicalHistory: [
      {
        condition: String,
        diagnosedOn: Date,
        status: String,
      },
    ],
    allergies: [String],
    doctorName: {
      type: String,
    },
    referredBy: {
      type: String,
    },
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Generate patient ID and full name before saving
patientSchema.pre("save", async function (next) {
  // Generate patient ID
  if (!this.patientId) {
    const count = await mongoose.model("Patient").countDocuments();
    this.patientId = `PAT${String(count + 1).padStart(5, "0")}`;
  }

  // Set full name
  if (!this.fullName) {
    this.fullName = `${this.firstName} ${this.lastName || ""}`.trim();
  }

  next();
});

// Add this index for better search performance
patientSchema.index(
  { fullName: 1, phone: 1, email: 1, franchiseId: 1 },
  { name: "search_index" },
);

// Also update the pre-save hook to always ensure fullName exists
patientSchema.pre("save", async function (next) {
  // Generate patient ID
  if (!this.patientId) {
    const count = await mongoose.model("Patient").countDocuments();
    this.patientId = `PAT${String(count + 1).padStart(5, "0")}`;
  }

  // Set full name if not provided
  if (!this.fullName) {
    this.fullName = `${this.firstName} ${this.lastName || ""}`.trim();
  }

  // Also update name field for backward compatibility
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  }

  next();
});

module.exports = mongoose.model("Patient", patientSchema);
