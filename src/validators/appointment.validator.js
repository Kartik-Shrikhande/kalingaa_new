const { body } = require("express-validator");
const mongoose = require("mongoose");

exports.createAppointmentValidator = [
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required")
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage("Invalid Patient ID"),

  body("testId")
    .optional({ checkFalsy: true }) // Allow empty if packageId is present
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage("Invalid Test ID"),

  body("packageId")
    .optional({ checkFalsy: true })
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage("Invalid Package ID"),

  body("date") // Changed from appointmentDate
    .notEmpty()
    .withMessage("Appointment date is required")
    .isISO8601()
    .withMessage("Invalid date format (YYYY-MM-DD)"),

  body("time") // Changed from appointmentTime
    .notEmpty()
    .withMessage("Appointment time is required"),

  body("notes").optional().isString().withMessage("Notes must be a string"),
];
