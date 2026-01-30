const { body } = require("express-validator");

exports.createBillingValidator = () => [
  body("patientId")
    .isMongoId()
    .withMessage("Valid patient ID required"),

  body("appointmentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid appointment ID"),

  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),

  body("items.*.itemId")
    .isMongoId()
    .withMessage("Valid item ID required"),

  body("items.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("paymentMode")
    .optional()
    .isIn([
      "Cash",
      "Card",
      "UPI",
      "Net Banking",
      "Cheque",
      "Insurance",
      "Multiple",
    ])
    .withMessage("Invalid payment mode"),

  body("amountPaid")
    .optional()
    .isNumeric()
    .withMessage("Amount paid must be a number"),

  body("doctorName")
    .optional()
    .isString()
    .trim(),

  body("referredBy")
    .optional()
    .isString()
    .trim(),

  body("notes")
    .optional()
    .isString()
    .trim(),
];


exports.updatePaymentValidator = () => [
  body("amountPaid")
    .optional()
    .isNumeric()
    .custom((v) => v >= 0)
    .withMessage("Amount paid cannot be negative"),

  body("paymentMode")
    .optional()
    .isIn([
      "Cash",
      "Card",
      "UPI",
      "Net Banking",
      "Cheque",
      "Insurance",
      "Multiple",
    ]),

  body("paymentStatus")
    .optional()
    .isIn(["Pending", "Partial", "Paid", "Cancelled"]),

  body("paymentDetails.transactionId").optional().isString(),
  body("paymentDetails.chequeNumber").optional().isString(),
  body("paymentDetails.bankName").optional().isString(),
  body("paymentDetails.upiId").optional().isString(),
];
