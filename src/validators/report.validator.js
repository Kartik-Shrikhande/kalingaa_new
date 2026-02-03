const { body } = require("express-validator");

exports.createReport = [
  body("patientId").notEmpty(),
  body("testId").notEmpty(),
  body("results").optional().isArray(),
];

exports.updateReport = [
  body("results").optional().isArray(),
  body("status").optional().isIn(["Draft", "Completed"]),
];
