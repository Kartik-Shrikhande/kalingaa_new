const { body } = require("express-validator");

exports.createBillingValidator = () => [
  body("patientId").isMongoId().withMessage("Valid patient ID required"),
  body("items").isArray({ min: 1 }).withMessage("At least one item required"),
  body("items.*.itemType")
    .isIn(["Test", "Package"])
    .withMessage("Invalid item type"),
  body("items.*.itemId").isMongoId().withMessage("Valid item ID required"),
  body("items.*.quantity").optional().isInt({ min: 1 }),
  body("items.*.finalPrice").optional().isNumeric(),
  body("discount")
    .optional()
    .isNumeric()
    .withMessage("Discount must be a number"),
  body("taxPercentage")
    .optional()
    .isNumeric()
    .withMessage("Tax percentage must be a number"),
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
  body("amountPaid")
    .optional()
    .isNumeric()
    .withMessage("Amount paid must be a number"),
  body("doctorName").optional().isString(),
  body("referredBy").optional().isString(),
  body("notes").optional().isString(),
];

exports.updatePaymentValidator = () => [
  body("amountPaid")
    .optional()
    .isNumeric()
    .withMessage("Amount paid must be a number"),
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
