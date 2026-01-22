const { body, validationResult } = require("express-validator");

exports.createTestValidator = () => [
  body("name").notEmpty().withMessage("Test name is required"),
  body("price").isNumeric().withMessage("Valid price required"),
  body("sampleType").notEmpty().withMessage("Sample type is required"),
  body("category")
    .optional()
    .isIn([
      "Basic",
      "Cardiac",
      "Diabetic",
      "Hormonal",
      "Vitamin",
      "Liver",
      "Kidney",
      "Lipid",
      "Other",
    ])
    .withMessage("Invalid category"),
  body("testType")
    .optional()
    .isIn(["Blood", "Urine", "Imaging", "ECG", "Ultrasound", "X-Ray", "Other"])
    .withMessage("Invalid test type"),
  body("fastingRequired").optional().isBoolean().withMessage("Must be boolean"),
  body("reportTime").optional().isString().withMessage("Must be string"),

  // Add validation for the new fields you're sending
  body("specimenVolume").optional().isString().withMessage("Must be string"),
  body("container").optional().isString().withMessage("Must be string"),
  body("storageInstructions")
    .optional()
    .isString()
    .withMessage("Must be string"),
  body("methodology").optional().isString().withMessage("Must be string"),
  body("referenceRange").optional().isObject().withMessage("Must be object"),

  // Add middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

exports.updateTestValidator = () => [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("price").optional().isNumeric().withMessage("Valid price required"),
  body("sampleType")
    .optional()
    .notEmpty()
    .withMessage("Sample type is required"),
  body("category")
    .optional()
    .isIn([
      "Basic",
      "Cardiac",
      "Diabetic",
      "Hormonal",
      "Vitamin",
      "Liver",
      "Kidney",
      "Lipid",
      "Other",
    ])
    .withMessage("Invalid category"),
  body("testType")
    .optional()
    .isIn(["Blood", "Urine", "Imaging", "ECG", "Ultrasound", "X-Ray", "Other"])
    .withMessage("Invalid test type"),
  body("fastingRequired").optional().isBoolean().withMessage("Must be boolean"),
  body("reportTime").optional().isString().withMessage("Must be string"),
  // Add validation for the new fields you're sending
  body("specimenVolume").optional().isString().withMessage("Must be string"),
  body("container").optional().isString().withMessage("Must be string"),
  body("storageInstructions")
    .optional()
    .isString()
    .withMessage("Must be string"),
  body("methodology").optional().isString().withMessage("Must be string"),
  body("referenceRange").optional().isObject().withMessage("Must be object"),
  // Add middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
