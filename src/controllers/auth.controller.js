const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SuperAdmin = require("../models/superAdmin.model");
const FranchiseAdmin = require("../models/franchiseAdmin.model");
const FrontOffice = require("../models/frontOffice.model");
const LabTechnician = require("../models/labTechnician.model");
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user = await SuperAdmin.findOne({ email });
    let role = "SuperAdmin";

    if (!user) { user = await FranchiseAdmin.findOne({ email }); role = "FranchiseAdmin"; }
    if (!user) { user = await FrontOffice.findOne({ email }); role = "FrontOffice"; }
    if (!user) { user = await LabTechnician.findOne({ email }); role = "LabTechnician"; }

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign(
      { id: user._id, role, franchiseId: user.franchiseId || null },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id, role, franchiseId: user.franchiseId || null },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    return res.status(200).json({
      message: "Login successful",
      role,
      accessToken
    });

  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
};

