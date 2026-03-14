const { body, validationResult } = require("express-validator");

/* ---------------- CREATE TEST VALIDATOR ---------------- */

exports.createTestValidator = () => [
  body("name").trim().notEmpty().withMessage("Test name is required"),

  body("price")
    .isNumeric()
    .withMessage("Valid price required")
    .custom((value) => value >= 0)
    .withMessage("Price must be positive"),

  body("sampleType").notEmpty().withMessage("Sample type is required"),
body("department")
  .optional()
  .isIn([
    "Hematology",
    "Biochemistry",
    "Microbiology",
    "Serology",
    "Immunology",
    "Radiology",
    "Pathology",
    "General",
  ])
  .withMessage("Invalid department"),
body("category")
  .optional()
  .isString()
  .withMessage("Category must be string"),

  body("testType")
    .optional()
    .isIn(["Blood", "Urine", "Imaging", "ECG", "Ultrasound", "X-Ray", "Other"])
    .withMessage("Invalid test type"),

  body("fastingRequired").optional().isBoolean(),

  body("reportTime").optional().isString(),

  body("specimenVolume").optional().isString(),

  body("container").optional().isString(),

  body("storageInstructions").optional().isString(),

  body("methodology").optional().isString(),

  body("referenceRange").optional().isObject(),

  /* -------- PARAMETERS VALIDATION -------- */

  body("parameters").optional().isArray().withMessage("Parameters must be array"),
body("parameters")
  .optional()
  .isArray()
  .withMessage("Parameters must be an array")
  .custom((params) => {
    const names = params.map((p) => p.name?.toLowerCase()?.trim());
    const unique = new Set(names);

    if (unique.size !== names.length) {
      throw new Error("Duplicate parameter names not allowed");
    }

    return true;
  }),
  body("parameters.*.name")
    .optional()
    .notEmpty()
    .withMessage("Parameter name required"),

  body("parameters.*.unit").optional().isString(),

  body("parameters.*.method").optional().isString(),

  body("parameters.*.analyzer").optional().isString(),

  body("parameters.*.sortOrder")
    .optional()
    .isNumeric()
    .withMessage("sortOrder must be number"),

  body("parameters.*.referenceRanges")
    .optional()
    .isArray()
    .withMessage("referenceRanges must be array"),

  body("parameters.*.referenceRanges.*.gender")
    .optional()
    .isIn(["Any", "Male", "Female", "Other"])
    .withMessage("Invalid gender"),

  body("parameters.*.referenceRanges.*.minAge")
    .optional()
    .isNumeric()
    .withMessage("minAge must be number"),

  body("parameters.*.referenceRanges.*.maxAge")
    .optional()
    .isNumeric()
    .withMessage("maxAge must be number"),

  body("parameters.*.referenceRanges.*.rangeText").optional().isString(),

  body("parameters.*.referenceRanges.*.low")
    .optional()
    .isNumeric()
    .withMessage("low must be number"),

  body("parameters.*.referenceRanges.*.high")
    .optional()
    .isNumeric()
    .withMessage("high must be number"),

  /* -------- VALIDATION RESULT -------- */

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

/* ---------------- UPDATE TEST VALIDATOR ---------------- */

exports.updateTestValidator = () => [
  body("name").optional().trim().notEmpty(),

  body("price").optional().isNumeric(),

  body("sampleType").optional().notEmpty(),

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
    ]),

  body("testType")
    .optional()
    .isIn(["Blood", "Urine", "Imaging", "ECG", "Ultrasound", "X-Ray", "Other"]),

  body("fastingRequired").optional().isBoolean(),

  body("reportTime").optional().isString(),

  body("specimenVolume").optional().isString(),

  body("container").optional().isString(),

  body("storageInstructions").optional().isString(),

  body("methodology").optional().isString(),

  body("referenceRange").optional().isObject(),

  /* -------- PARAMETERS VALIDATION -------- */

  body("parameters").optional().isArray(),

  body("parameters.*.name").optional().notEmpty(),

  body("parameters.*.unit").optional().isString(),

  body("parameters.*.method").optional().isString(),

  body("parameters.*.analyzer").optional().isString(),

  body("parameters.*.sortOrder").optional().isNumeric(),

  body("parameters.*.referenceRanges").optional().isArray(),

  body("parameters.*.referenceRanges.*.gender")
    .optional()
    .isIn(["Any", "Male", "Female", "Other"]),

  body("parameters.*.referenceRanges.*.minAge").optional().isNumeric(),

  body("parameters.*.referenceRanges.*.maxAge").optional().isNumeric(),

  body("parameters.*.referenceRanges.*.rangeText").optional().isString(),

  body("parameters.*.referenceRanges.*.low").optional().isNumeric(),

  body("parameters.*.referenceRanges.*.high").optional().isNumeric(),

  /* -------- VALIDATION RESULT -------- */

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];