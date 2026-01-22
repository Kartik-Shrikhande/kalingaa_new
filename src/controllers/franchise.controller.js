const Franchise = require("../models/franchise.model");

/* ======================
   CREATE FRANCHISE
====================== */
exports.create = async (req, res) => {
  try {
    const franchise = await Franchise.create(req.body);

    return res.status(201).json({
      message: "Franchise created successfully",
      data: franchise
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create franchise",
      error: error.message
    });
  }
};

/* ======================
   GET ALL FRANCHISES
====================== */
exports.getAll = async (req, res) => {
  try {
    const franchises = await Franchise.find();

    return res.status(200).json({
      total: franchises.length,
      data: franchises
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch franchises",
      error: error.message
    });
  }
};

/* ======================
   GET FRANCHISE BY ID
====================== */
exports.getById = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);

    if (!franchise) {
      return res.status(404).json({
        message: "Franchise not found"
      });
    }

    return res.status(200).json({
      data: franchise
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid franchise ID",
      error: error.message
    });
  }
};

/* ======================
   UPDATE FRANCHISE
====================== */
exports.update = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Update data cannot be empty"
      });
    }

    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true // ⭐ VERY IMPORTANT
      }
    );

    if (!franchise) {
      return res.status(404).json({
        message: "Franchise not found"
      });
    }

    return res.status(200).json({
      message: "Franchise updated successfully",
      data: franchise
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update franchise",
      error: error.message
    });
  }
};

/* ======================
   DELETE FRANCHISE
====================== */
exports.remove = async (req, res) => {
  try {
    const franchise = await Franchise.findByIdAndDelete(req.params.id);

    if (!franchise) {
      return res.status(404).json({
        message: "Franchise not found"
      });
    }

    return res.status(200).json({
      message: "Franchise deleted successfully"
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to delete franchise",
      error: error.message
    });
  }
};
