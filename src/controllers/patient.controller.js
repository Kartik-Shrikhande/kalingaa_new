const Patient = require("../models/patient.model");
const jwt = require("jsonwebtoken");

const { generateToken } = require("../utils/jwt");

exports.create = async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      name: req.body.name,
      email: req.body.email?.toLowerCase(),
      franchiseId: req.user.franchiseId,
      createdBy: req.user._id || req.user.id,
    };

    const patient = await Patient.create(patientData);

    return res.status(201).json({
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create patient",
      error: error.message,
    });
  }
};

exports.getAll = async (req, res) => {
  const patients = await Patient.find({
    franchiseId: req.user.franchiseId,
    isActive: true,
  });

  return res.status(200).json({
    total: patients.length,
    data: patients,
  });
};

exports.getById = async (req, res) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    franchiseId: req.user.franchiseId,
  });

  if (!patient) {
    return res.status(404).json({
      message: "Patient not found",
    });
  }

  return res.status(200).json(patient);
};

exports.search = async (req, res) => {
  try {
    const searchTerm = req.query.search || req.query.q;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const cleanSearchTerm = searchTerm.trim();

    const patients = await Patient.find({
      franchiseId: req.user.franchiseId,
      isActive: true,
      $or: [
        { name: { $regex: cleanSearchTerm, $options: "i" } },
        { phone: { $regex: cleanSearchTerm, $options: "i" } },
        { email: { $regex: cleanSearchTerm, $options: "i" } },
      ],
    });

    return res.status(200).json({
      data: patients,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Patient search failed",
      error: error.message,
    });
  }
};

exports.getPatientBills = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Bills feature not implemented yet",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch patient bills",
    });
  }
};

exports.update = async (req, res) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }

  const patient = await Patient.findOneAndUpdate(
    {
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    },
    req.body,
    { new: true },
  );

  if (!patient) {
    return res.status(404).json({
      message: "Patient not found",
    });
  }

  return res.status(200).json({
    message: "Patient updated successfully",
    data: patient,
  });
};

exports.remove = async (req, res) => {
  const patient = await Patient.findOneAndUpdate(
    {
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    },
    { isActive: false },
    { new: true },
  );

  if (!patient) {
    return res.status(404).json({
      message: "Patient not found",
    });
  }

  return res.status(200).json({
    message: "Patient deleted successfully",
  });
};

exports.patientLogin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const patient = await Patient.findOne({
      phone,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const token = generateToken({
      id: patient._id,
      role: "Patient",
      franchiseId: patient.franchiseId,
    });

    return res.status(200).json({
      message: "Patient login successful",
      role: "Patient",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Patient login failed",
    });
  }
};
