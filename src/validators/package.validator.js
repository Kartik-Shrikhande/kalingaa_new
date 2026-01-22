const { body } = require("express-validator");

exports.createPackageValidator = () => [
  body("name").notEmpty().withMessage("Package name is required"),
  body("regularPrice").isNumeric().withMessage("Valid regular price required"),
  body("specialPrice").isNumeric().withMessage("Valid special price required"),
  body("category")
    .optional()
    .isIn([
      "Master",
      "Executive",
      "Whole Body",
      "Cardiac",
      "Diabetic",
      "Women",
      "Senior Citizen",
      "Corporate",
      "Other",
    ]),
  body("packageType")
    .optional()
    .isIn(["Health Checkup", "Specialized", "Custom"]),
  body("description").optional().isString(),
  body("includesTests").optional().isArray(),
  body("includesTests.*.test").optional().isMongoId(),
  body("includesTests.*.quantity").optional().isInt({ min: 1 }),
  body("features").optional().isArray(),
  body("reportTime").optional().isString(),
  body("fastingRequired").optional().isBoolean(),
  body("isPopular").optional().isBoolean(),
];

exports.updatePackageValidator = () => [
  body("name").optional().notEmpty(),
  body("regularPrice").optional().isNumeric(),
  body("specialPrice").optional().isNumeric(),
  body("category")
    .optional()
    .isIn([
      "Master",
      "Executive",
      "Whole Body",
      "Cardiac",
      "Diabetic",
      "Women",
      "Senior Citizen",
      "Corporate",
      "Other",
    ]),
  body("packageType")
    .optional()
    .isIn(["Health Checkup", "Specialized", "Custom"]),
  body("description").optional().isString(),
  body("includesTests").optional().isArray(),
  body("includesTests.*.test").optional().isMongoId(),
  body("includesTests.*.quantity").optional().isInt({ min: 1 }),
  body("features").optional().isArray(),
  body("reportTime").optional().isString(),
  body("fastingRequired").optional().isBoolean(),
  body("isPopular").optional().isBoolean(),
];
