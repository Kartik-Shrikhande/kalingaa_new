const bcrypt = require("bcryptjs");
const SuperAdmin = require("../models/superAdmin.model");

// CREATE
exports.create = async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const admin = await SuperAdmin.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword
  });

  res.status(201).json(admin);
};

// READ ALL
exports.getAll = async (req, res) => {
  const admins = await SuperAdmin.find().select("-password");
  res.json(admins);
};

// READ BY ID
exports.getById = async (req, res) => {
  const admin = await SuperAdmin.findById(req.params.id).select("-password");
  if (!admin) return res.status(404).json({ message: "Not found" });
  res.json(admin);
};

// UPDATE
exports.update = async (req, res) => {
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  const admin = await SuperAdmin.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  ).select("-password");

  res.json(admin);
};

// DELETE
exports.remove = async (req, res) => {
  await SuperAdmin.findByIdAndDelete(req.params.id);
  res.json({ message: "Super Admin deleted successfully" });
};




