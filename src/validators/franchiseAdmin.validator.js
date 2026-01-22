const { body } = require("express-validator");

exports.createFranchiseAdminValidator = () => [
  body("name").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("franchiseId").notEmpty()
];

exports.updateFranchiseAdminValidator = () => [
  body("name").optional(),
  body("email").optional().isEmail(),
  body("password").optional().isLength({ min: 6 })
];
