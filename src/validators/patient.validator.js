const { body } = require("express-validator");

exports.createPatientValidator = () => [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("age").isInt({ min: 0 }).withMessage("Valid age required"),
  body("gender")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Invalid gender")
];

exports.updatePatientValidator = () => [
  body("email").optional().isEmail().withMessage("Invalid email")
];
