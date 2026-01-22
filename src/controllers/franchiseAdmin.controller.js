const bcrypt = require("bcryptjs");
const FranchiseAdmin = require("../models/franchiseAdmin.model");
const Franchise = require("../models/franchise.model");
/* ======================
   CREATE FRANCHISE ADMIN
====================== */


exports.create = async (req, res) => {
  try {
    const { email, password, franchiseId } = req.body;

    // ✅ Normalize email
    const normalizedEmail = email.toLowerCase();

    // ❌ Check franchise existence
    const franchiseExists = await Franchise.findById(franchiseId);
    if (!franchiseExists) {
      return res.status(400).json({
        message: "Invalid franchiseId. Franchise does not exist."
      });
    }

    // ❌ Check duplicate email (case-insensitive)
    const emailExists = await FranchiseAdmin.findOne({
      email: normalizedEmail
    });

    if (emailExists) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create admin
    const admin = await FranchiseAdmin.create({
      ...req.body,
      email: normalizedEmail,
      password: hashedPassword
    });

    return res.status(201).json({
      message: "Franchise Admin created successfully",
      data: {
        ...admin.toObject(),
        password: undefined
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to create Franchise Admin",
      error: error.message
    });
  }
};


/* ======================
   GET ALL FRANCHISE ADMINS
====================== */
exports.getAll = async (req, res) => {
  try {
    const admins = await FranchiseAdmin.find().select("-password");

    return res.status(200).json({
      total: admins.length,
      data: admins
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch Franchise Admins",
      error: error.message
    });
  }
};

/* ======================
   GET FRANCHISE ADMIN BY ID
====================== */
exports.getById = async (req, res) => {
  try {
    const admin = await FranchiseAdmin.findById(req.params.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        message: "Franchise Admin not found"
      });
    }

    return res.status(200).json({
      data: admin
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid Franchise Admin ID",
      error: error.message
    });
  }
};

/* ======================
   UPDATE FRANCHISE ADMIN
====================== */
exports.update = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Update data cannot be empty"
      });
    }

    // Hash password if updating
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const admin = await FranchiseAdmin.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true // ⭐ critical
      }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        message: "Franchise Admin not found"
      });
    }

    return res.status(200).json({
      message: "Franchise Admin updated successfully",
      data: admin
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update Franchise Admin",
      error: error.message
    });
  }
};

/* ======================
   DELETE FRANCHISE ADMIN
====================== */
exports.remove = async (req, res) => {
  try {
    const admin = await FranchiseAdmin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({
        message: "Franchise Admin not found"
      });
    }

    return res.status(200).json({
      message: "Franchise Admin deleted successfully"
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to delete Franchise Admin",
      error: error.message
    });
  }
};
