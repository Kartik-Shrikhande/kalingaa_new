const { body } = require("express-validator");

exports.createLabTechnicianValidator = () => [
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
];

exports.updateLabTechnicianValidator = () => [
  body("email").not().exists().withMessage("Email cannot be updated"),
  body("password").not().exists().withMessage("Password cannot be updated")
];
