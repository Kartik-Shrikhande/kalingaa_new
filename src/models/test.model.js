const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: [
        "Basic",
        "Cardiac",
        "Diabetic",
        "Hormonal",
        "Vitamin",
        "Liver",
        "Kidney",
        "Lipid",
        "Other",
      ],
      default: "Basic",
    },
    testType: {
      type: String,
      enum: [
        "Blood",
        "Urine",
        "Imaging",
        "ECG",
        "Ultrasound",
        "X-Ray",
        "Other",
      ],
      default: "Blood",
    },
    sampleType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    reportTime: {
      type: String,
      default: "24 hours",
    },
    fastingRequired: {
      type: Boolean,
      default: false,
    },
    specimenVolume: {
      type: String,
      default: "",
    },
    container: {
      type: String,
      default: "",
    },
    storageInstructions: {
      type: String,
      default: "",
    },
    methodology: {
      type: String,
      default: "",
    },
    referenceRange: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    includesTests: [String],
    parameters: [String],
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Generate test code if not provided
testSchema.pre("save", async function () {
  try {
    if (!this.code) {
      // Use this.constructor to access the model to avoid circular dependency
      const count = await this.constructor.countDocuments();
      this.code = `TEST${String(count + 1).padStart(4, "0")}`;
    }
    // No next() call needed here for async functions
  } catch (error) {
    // If you need to stop the save due to an error, throw it
    throw error;
  }
});

module.exports = mongoose.model("Test", testSchema);
