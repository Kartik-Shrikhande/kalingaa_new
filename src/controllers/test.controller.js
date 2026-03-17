const Test = require("../models/test.model");

/* ---------------- CREATE TEST ---------------- */

exports.create = async (req, res) => {
  try {
    const franchiseId = req.user.franchiseId;

    // ✅ CLEAN TEST LEVEL
    if (req.body.resultType !== "qualitative") {
      req.body.qualitativeOptions = [];
    }

    // ✅ CLEAN PARAMETERS
    if (req.body.parameters?.length) {
      req.body.parameters = req.body.parameters.map((param) => {
        if (param.resultType !== "qualitative") {
          param.qualitativeOptions = [];
        }

        return {
          ...param,
          group: param.group || "General",
        };
      });
    }

    const test = await Test.create({
      ...req.body,
      franchiseId,
    });

    res.status(201).json({
      message: "Test created successfully",
      data: test,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating test",
      error: error.message,
    });
  }
};

/* ---------------- GET ALL TESTS ---------------- */

exports.getAll = async (req, res) => {
  try {
    const { category, testType, search, isActive } = req.query;

    const filter = {
      franchiseId: req.user.franchiseId,
    };

    if (category && category !== "All") filter.category = category;
    if (testType && testType !== "All") filter.testType = testType;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const tests = await Test.find(filter)
      .sort({ name: 1 })
      .lean();

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

/* ---------------- GET TEST BY ID ---------------- */

exports.getById = async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    }).lean();

    if (!test) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    // return only active parameters sorted
    if (test.parameters) {
      test.parameters = test.parameters
        .filter((p) => p.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    }

    return res.status(200).json(test);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch test",
      error: error.message,
    });
  }
};

/* ---------------- UPDATE TEST ---------------- */

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const franchiseId = req.user.franchiseId;

    // ✅ CLEAN TEST LEVEL
    if (req.body.resultType && req.body.resultType !== "qualitative") {
      req.body.qualitativeOptions = [];
    }

    // ✅ CLEAN PARAMETERS
    if (req.body.parameters) {
      req.body.parameters = req.body.parameters.map((param) => ({
        ...param,
        group: param.group || "General",
        qualitativeOptions:
          param.resultType === "qualitative"
            ? param.qualitativeOptions || []
            : [],
      }));
    }

    const updatedTest = await Test.findOneAndUpdate(
      { _id: id, franchiseId },
      req.body,
      { new: true }
    );

    if (!updatedTest) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    res.status(200).json({
      message: "Test updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating test",
      error: error.message,
    });
  }
};

/* ---------------- TOGGLE STATUS ---------------- */

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

/* ---------------- DELETE TEST ---------------- */

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

/* ---------------- TESTS FOR PACKAGE ---------------- */

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

/* ---------------- GET CATEGORIES ---------------- */

exports.getCategories = async (req, res) => {
  try {
    const categories = await Test.distinct("category", {
      franchiseId: req.user.franchiseId,
      isActive: true,
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

/* ---------------- GET TEST TYPES ---------------- */

exports.getTestTypes = async (req, res) => {
  try {
    const testTypes = await Test.distinct("testType", {
      franchiseId: req.user.franchiseId,
      isActive: true,
    });

    return res.status(200).json({ data: testTypes });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch test types",
      error: error.message,
    });
  }
};