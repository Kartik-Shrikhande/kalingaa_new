const { body } = require("express-validator");

exports.createFranchiseValidator = () => [
  body("name").notEmpty().withMessage("Franchise name required"),
  body("address").notEmpty().withMessage("address required"),
];

exports.updateFranchiseValidator = () => [
  body("name").optional().notEmpty(),
  body("address").optional().notEmpty(),
];
