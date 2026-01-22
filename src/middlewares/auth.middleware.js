const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/superAdmin.model");
const FranchiseAdmin = require("../models/franchiseAdmin.model");
const FrontOffice = require("../models/frontOffice.model");
const LabTechnician = require("../models/labTechnician.model");

/* 🔐 AUTHENTICATE USER */
// exports.authenticateUser = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     const token = authHeader && authHeader.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({ message: "Token is required" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = {
//       id: decoded.id,
//       role: decoded.role,
//       franchiseId: decoded.franchiseId || null,
//     };

//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// exports.authenticateUser = (req, res, next) => {
//   try {
//     const { token } = req.body;

//     if (!token) {
//       return res.status(401).json({
//         message: "Token is required in request body"
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = {
//       id: decoded.id,
//       role: decoded.role,
//       franchiseId: decoded.franchiseId || null
//     };

//     next();
//   } catch (error) {
//     console.error("JWT verify error:", error.message);
//     return res.status(401).json({
//       message: "Invalid or expired token"
//     });
//   }
// };

exports.authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      franchiseId: decoded.franchiseId || null,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshtoken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
        franchiseId: decoded.franchiseId || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

/* ✅ VERIFY TOKEN */
exports.verifyToken = async (req, res) => {
  try {
    const { id, role } = req.user;

    const models = {
      SuperAdmin,
      FranchiseAdmin,
      FrontOffice,
      LabTechnician,
    };

    const UserModel = models[role];
    if (!UserModel) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await UserModel.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Token is valid",
      role,
      userId: user._id,
      franchiseId: user.franchiseId || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Token verification failed" });
  }
};
