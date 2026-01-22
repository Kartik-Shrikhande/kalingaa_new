const bcrypt = require("bcryptjs");
const LabTechnician = require("../models/labTechnician.model");

exports.create = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await LabTechnician.findOne({
      email: email.toLowerCase()
    });
    if (existing) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const technician = await LabTechnician.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      franchiseId: req.user.franchiseId
    });

    return res.status(201).json({
      message: "Lab Technician created successfully",
      data: {
        ...technician.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create Lab Technician",
      error: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  const technicians = await LabTechnician.find({
    franchiseId: req.user.franchiseId
  }).select("-password");

  return res.status(200).json({
    total: technicians.length,
    data: technicians
  });
};

exports.getById = async (req, res) => {
  const technician = await LabTechnician.findOne({
    _id: req.params.id,
    franchiseId: req.user.franchiseId
  }).select("-password");

  if (!technician) {
    return res.status(404).json({
      message: "Lab Technician not found"
    });
  }

  return res.status(200).json(technician);
};

exports.update = async (req, res) => {
  const technician = await LabTechnician.findOneAndUpdate(
    {
      _id: req.params.id,
      franchiseId: req.user.franchiseId
    },
    req.body,
    { new: true }
  ).select("-password");

  if (!technician) {
    return res.status(404).json({
      message: "Lab Technician not found"
    });
  }

  return res.status(200).json({
    message: "Lab Technician updated successfully",
    data: technician
  });
};

exports.remove = async (req, res) => {
  const technician = await LabTechnician.findOneAndDelete({
    _id: req.params.id,
    franchiseId: req.user.franchiseId
  });

  if (!technician) {
    return res.status(404).json({
      message: "Lab Technician not found"
    });
  }

  return res.status(200).json({
    message: "Lab Technician deleted successfully"
  });
};
