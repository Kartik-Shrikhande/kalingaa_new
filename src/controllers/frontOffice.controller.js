const bcrypt = require("bcryptjs");
const FrontOffice = require("../models/frontOffice.model");
const Franchise = require("../models/franchise.model");

// CREATE
exports.create = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!req.user.franchiseId) {
      return res.status(403).json({
        message: "Franchise not assigned"
      });
    }

    const exists = await FrontOffice.findOne({
      email: email.toLowerCase()
    });

    if (exists) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const office = await FrontOffice.create({
      name,
      email: email.toLowerCase(), // 🔒 lowercase enforced
      password: hashedPassword,
      phone,
      franchiseId: req.user.franchiseId,
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: "Front Office created successfully",
      data: {
        ...office.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create Front Office",
      error: error.message
    });
  }
};


exports.getAll = async (req, res) => {
  const offices = await FrontOffice.find({
    franchiseId: req.user.franchiseId
  }).select("-password");

 return res.status(200).json({
    total: offices.length,
    data: offices
  });
};

// GET BY ID
exports.getById = async (req, res) => {
  const office = await FrontOffice.findById(req.params.id).select("-password");

  if (!office) {
    return res.status(404).json({ message: "Front Office not found" });
  }

  res.status(200).json({ data: office });
};

// UPDATE (NO email/password)
exports.update = async (req, res) => {
  try {
    const office = await FrontOffice.findOneAndUpdate(
      {
        _id: req.params.id,
        franchiseId: req.user.franchiseId
      },
      req.body,
      { new: true }
    ).select("-password");

    if (!office) {
      return res.status(404).json({
        message: "Front Office not found"
      });
    }

    return res.status(200).json({
      message: "Front Office updated successfully",
      data: office
    });
  } catch (error) {
    return res.status(500).json({
      message: "Update failed"
    });
  }
};


// DELETE (Soft delete)
exports.remove = async (req, res) => {
  const office = await FrontOffice.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!office) {
    return res.status(404).json({ message: "Front Office not found" });
  }

  res.status(200).json({
    message: "Front Office deactivated successfully"
  });
};
