const { body } = require("express-validator");
const mongoose = require("mongoose");

exports.createAppointmentValidator = [
  body("patientId")
    .notEmpty().withMessage("Patient ID is required")
    .custom(id => mongoose.Types.ObjectId.isValid(id))
    .withMessage("Invalid Patient ID"),

  body("testId")
    .notEmpty().withMessage("Test ID is required")
    .custom(id => mongoose.Types.ObjectId.isValid(id))
    .withMessage("Invalid Test ID"),

  body("appointmentDate")
    .notEmpty().withMessage("Appointment date is required")
    .isISO8601().withMessage("Invalid date format (YYYY-MM-DD)"),

  body("appointmentTime")
    .notEmpty().withMessage("Appointment time is required"),

  body("notes")
    .optional()
    .isString().withMessage("Notes must be a string")
];
