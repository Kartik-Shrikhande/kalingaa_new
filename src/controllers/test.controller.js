const Test = require("../models/test.model");

exports.create = async (req, res) => {
  try {
    // Check if Test model is properly imported
    if (!Test || typeof Test.create !== "function") {
      throw new Error("Test model not properly imported");
    }

    const testData = {
      ...req.body,
      franchiseId: req.user.franchiseId,
    };

    const test = await Test.create(testData);

    return res.status(201).json({
      message: "Test created successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error in create function:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      message: "Failed to create test",
      error: error.message,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { category, testType, search, isActive } = req.query;

    const filter = {
      franchiseId: req.user.franchiseId,
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (testType && testType !== "All") {
      filter.testType = testType;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const tests = await Test.find(filter).sort({ name: 1 });

    return res.status(200).json({
      total: tests.length,
      data: tests,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tests",
      error: error.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    return res.status(200).json(test);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch test",
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const test = await Test.findOneAndUpdate(
      {
        _id: req.params.id,
        franchiseId: req.user.franchiseId,
      },
      req.body,
      { new: true },
    );

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    return res.status(200).json({
      message: "Test updated successfully",
      data: test,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update test",
      error: error.message,
    });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    test.isActive = !test.isActive;
    await test.save();

    return res.status(200).json({
      message: `Test ${test.isActive ? "activated" : "deactivated"} successfully`,
      data: test,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to toggle test status",
      error: error.message,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const test = await Test.findOneAndDelete({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    return res.status(200).json({
      message: "Test deleted permanently",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete test",
      error: error.message,
    });
  }
};

// New method to get tests for package selection
exports.getTestsForSelection = async (req, res) => {
  try {
    const tests = await Test.find({
      franchiseId: req.user.franchiseId,
      isActive: true,
    })
      .select("_id name code price category testType sampleType description")
      .sort({ name: 1 });

    return res.status(200).json({
      total: tests.length,
      data: tests,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tests for selection",
      error: error.message,
    });
  }
};

// Get test categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Test.distinct("category", {
      franchiseId: req.user.franchiseId,
      isActive: true,
    });

    return res.status(200).json({
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// Get test types
exports.getTestTypes = async (req, res) => {
  try {
    const testTypes = await Test.distinct("testType", {
      franchiseId: req.user.franchiseId,
      isActive: true,
    });

    return res.status(200).json({
      data: testTypes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch test types",
      error: error.message,
    });
  }
};
