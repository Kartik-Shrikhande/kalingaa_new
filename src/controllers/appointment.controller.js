const Appointment = require("../models/appointment.model");
const Patient = require("../models/patient.model");
const Test = require("../models/test.model");

exports.create = async (req, res) => {
  try {
    const {
      patientId,
      testId,
      appointmentDate,
      appointmentTime,
      notes
    } = req.body;

    // 🔍 Validate Patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // 🔐 Franchise restriction
    if (
      req.user.role !== "SuperAdmin" &&
      patient.franchiseId.toString() !== req.user.franchiseId.toString()
    ) {
      return res.status(403).json({
        message: "Patient does not belong to your franchise"
      });
    }

    // 🔍 Validate Test
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const appointment = await Appointment.create({
      patientId,
      testId,
      franchiseId: patient.franchiseId,
      appointmentDate,
      appointmentTime,
      notes
    });

    return res.status(201).json({
      message: "Appointment created successfully",
      data: appointment
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to create appointment",
      error: error.message
    });
  }
};

// GET ALL (with total)
exports.getAll = async (req, res) => {
  const filter =
    req.user.role === "SuperAdmin"
      ? {}
      : { franchiseId: req.user.franchiseId };

  const appointments = await Appointment.find(filter)
    .populate("patientId", "name mobile")
    .populate("testId", "name price")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    total: appointments.length,
    data: appointments
  });
};

// GET BY ID
exports.getById = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("patientId", "name mobile")
    .populate("testId", "name price");

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (
    req.user.role !== "SuperAdmin" &&
    appointment.franchiseId.toString() !== req.user.franchiseId.toString()
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  return res.status(200).json(appointment);
};

// UPDATE STATUS ONLY
exports.updateStatus = async (req, res) => {
  const { status } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  appointment.status = status;
  await appointment.save();

  return res.status(200).json({
    message: "Appointment status updated",
    data: appointment
  });
};

// DELETE (Permanent)
exports.remove = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  await appointment.deleteOne();

  return res.status(200).json({
    message: "Appointment deleted permanently"
  });
};
