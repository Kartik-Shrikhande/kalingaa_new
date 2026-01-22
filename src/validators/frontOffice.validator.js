const { body } = require("express-validator");

exports.createFrontOfficeValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .customSanitizer(value => value.toLowerCase()),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("phone")
    .isMobilePhone("en-IN")
    .withMessage("Valid Indian phone number required")
];

exports.updateFrontOfficeValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty"),

  body("phone")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Invalid phone number"),

//   // ❌ DISALLOW UPDATE
//   body("email").not().exists().withMessage("Email cannot be updated"),
//   body("password").not().exists().withMessage("Password cannot be updated")
];
