// New file

const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
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
      uppercase: true,
    },
    description: {
      type: String,
    },
    packageType: {
      type: String,
      enum: ["Health Checkup", "Specialized", "Custom"],
      default: "Health Checkup",
    },
    category: {
      type: String,
      enum: [
        "Master",
        "Executive",
        "Whole Body",
        "Cardiac",
        "Diabetic",
        "Women",
        "Senior Citizen",
        "Corporate",
        "Other",
      ],
      default: "Master",
    },
    regularPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    specialPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    includesTests: [
      {
        test: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Test",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        includedInPackage: {
          type: Boolean,
          default: true,
        },
      },
    ],
    additionalServices: [
      {
        serviceName: String,
        servicePrice: Number,
      },
    ],
    fastingRequired: {
      type: Boolean,
      default: false,
    },
    reportTime: {
      type: String,
      default: "24-48 hours",
    },
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    features: [String],
  },
  { timestamps: true },
);

// Calculate discount percentage
packageSchema.pre("save", function (next) {
  if (this.regularPrice > 0 && this.specialPrice > 0) {
    this.discountPercentage = Math.round(
      ((this.regularPrice - this.specialPrice) / this.regularPrice) * 100,
    );
  }
  next();
});

// Generate code before saving
packageSchema.pre("save", async function (next) {
  if (!this.code) {
    const count = await mongoose.model("Package").countDocuments();
    this.code = `PKG${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Package", packageSchema);
