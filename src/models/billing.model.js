const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    // billNumber: {
    //   type: String,
    //   unique: true,
    //   required: true,
    // },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientAge: {
      type: Number,
      required: true,
    },
    patientGender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    patientPhone: {
      type: String,
      required: true,
    },
    doctorName: {
      type: String,
    },
    referredBy: {
      type: String,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    items: [
      {
        itemType: {
          type: String,
          enum: ["Test", "Package", "Service"],
          required: true,
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        itemCode: {
          type: String,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        discountType: {
          type: String,
          enum: ["Percentage", "Fixed", "None"],
          default: "None",
        },
        discountValue: {
          type: Number,
          default: 0,
          min: 0,
        },
        discountAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
        finalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        isPackage: {
          type: Boolean,
          default: false,
        },
        packageTests: [
          {
            testId: mongoose.Schema.Types.ObjectId,
            testName: String,
            testCode: String,
            price: Number,
          },
        ],
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercentage: {
      type: Number,
      default: 18,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Partial", "Paid", "Cancelled"],
      default: "Pending",
    },
    paymentMode: {
      type: String,
      enum: [
        "Cash",
        "Card",
        "UPI",
        "Net Banking",
        "Cheque",
        "Insurance",
        "Multiple",
      ],
      default: "Cash",
    },
    paymentDetails: {
      transactionId: String,
      chequeNumber: String,
      bankName: String,
      upiId: String,
    },
    billingDate: {
      type: Date,
      default: Date.now,
    },
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// billingSchema.pre("validate", async function () {
//   try {
//     // 1. Generate Bill Number
//     if (!this.billNumber || this.billNumber.startsWith("TEMP")) {
//       const today = new Date();
//       const year = today.getFullYear();
//       const month = String(today.getMonth() + 1).padStart(2, "0");

//       // Use this.constructor to avoid circular dependency errors
//       const count = await this.constructor.countDocuments({
//         billingDate: {
//           $gte: new Date(year, today.getMonth(), 1),
//           $lt: new Date(year, today.getMonth() + 1, 1),
//         },
//       });
//       this.billNumber = `BILL${year}${month}${String(count + 1).padStart(4, "0")}`;
//     }

//     // 2. Calculations
//     this.subtotal = this.items.reduce(
//       (sum, item) => sum + item.finalPrice * item.quantity,
//       0,
//     );
//     this.taxAmount = (this.subtotal * this.taxPercentage) / 100;

//     const totalBeforeRound = this.subtotal + this.taxAmount - this.discount;
//     this.roundOff = Math.round(totalBeforeRound) - totalBeforeRound;
//     this.totalAmount = Math.round(totalBeforeRound);

//     const due = this.totalAmount - this.amountPaid;
//     this.balanceDue = due < 0 ? 0 : due;
//   } catch (error) {
//     console.error("Error in Billing Pre-Validate:", error);
//     throw error;
//   }
// });

module.exports = mongoose.model("Billing", billingSchema);
