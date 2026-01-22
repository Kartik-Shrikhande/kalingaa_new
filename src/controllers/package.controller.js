// New File
const Package = require("../models/package.model");
const Test = require("../models/test.model");

exports.create = async (req, res) => {
  try {
    // Validate tests exist
    if (req.body.includesTests && req.body.includesTests.length > 0) {
      const testIds = req.body.includesTests.map((item) => item.test);
      const tests = await Test.find({
        _id: { $in: testIds },
        franchiseId: req.user.franchiseId,
      });

      if (tests.length !== testIds.length) {
        return res.status(400).json({
          message: "Some tests not found or don't belong to your franchise",
        });
      }
    }

    const package = await Package.create({
      ...req.body,
      franchiseId: req.user.franchiseId,
    });

    return res.status(201).json({
      message: "Package created successfully",
      data: package,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create package",
      error: error.message,
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { category, packageType, search, isActive, isPopular } = req.query;

    const filter = {
      franchiseId: req.user.franchiseId,
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (packageType && packageType !== "All") {
      filter.packageType = packageType;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (isPopular !== undefined) {
      filter.isPopular = isPopular === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const packages = await Package.find(filter)
      .populate("includesTests.test", "name code price category testType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: packages.length,
      data: packages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch packages",
      error: error.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const package = await Package.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    }).populate(
      "includesTests.test",
      "name code price category testType sampleType description",
    );

    if (!package) {
      return res.status(404).json({
        message: "Package not found",
      });
    }

    return res.status(200).json(package);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch package",
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    // Validate tests exist if updating includesTests
    if (req.body.includesTests && req.body.includesTests.length > 0) {
      const testIds = req.body.includesTests.map((item) => item.test);
      const tests = await Test.find({
        _id: { $in: testIds },
        franchiseId: req.user.franchiseId,
      });

      if (tests.length !== testIds.length) {
        return res.status(400).json({
          message: "Some tests not found or don't belong to your franchise",
        });
      }
    }

    const package = await Package.findOneAndUpdate(
      {
        _id: req.params.id,
        franchiseId: req.user.franchiseId,
      },
      req.body,
      { new: true },
    ).populate("includesTests.test", "name code price category testType");

    if (!package) {
      return res.status(404).json({
        message: "Package not found",
      });
    }

    return res.status(200).json({
      message: "Package updated successfully",
      data: package,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update package",
      error: error.message,
    });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const package = await Package.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!package) {
      return res.status(404).json({
        message: "Package not found",
      });
    }

    package.isActive = !package.isActive;
    await package.save();

    return res.status(200).json({
      message: `Package ${package.isActive ? "activated" : "deactivated"} successfully`,
      data: package,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to toggle package status",
      error: error.message,
    });
  }
};

exports.togglePopular = async (req, res) => {
  try {
    const package = await Package.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!package) {
      return res.status(404).json({
        message: "Package not found",
      });
    }

    package.isPopular = !package.isPopular;
    await package.save();

    return res.status(200).json({
      message: `Package ${package.isPopular ? "marked as popular" : "removed from popular"} successfully`,
      data: package,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to toggle package popularity",
      error: error.message,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const package = await Package.findOneAndDelete({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
    });

    if (!package) {
      return res.status(404).json({
        message: "Package not found",
      });
    }

    return res.status(200).json({
      message: "Package deleted permanently",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete package",
      error: error.message,
    });
  }
};

// Get active packages for billing
exports.getActivePackages = async (req, res) => {
  try {
    const packages = await Package.find({
      franchiseId: req.user.franchiseId,
      isActive: true,
    })
      .select(
        "_id name code regularPrice specialPrice discountPercentage category description",
      )
      .sort({ category: 1, name: 1 });

    return res.status(200).json({
      total: packages.length,
      data: packages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch active packages",
      error: error.message,
    });
  }
};

// Get package categories
exports.getPackageCategories = async (req, res) => {
  try {
    const categories = await Package.distinct("category", {
      franchiseId: req.user.franchiseId,
      isActive: true,
    });

    return res.status(200).json({
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch package categories",
      error: error.message,
    });
  }
};

// Get package types
exports.getPackageTypes = async (req, res) => {
  try {
    const packageTypes = await Package.distinct("packageType", {
      franchiseId: req.user.franchiseId,
      isActive: true,
    });

    return res.status(200).json({
      data: packageTypes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch package types",
      error: error.message,
    });
  }
};

// Calculate package savings
exports.calculatePackageSavings = async (req, res) => {
  try {
    const { packageId } = req.params;

    const package = await Package.findOne({
      _id: packageId,
      franchiseId: req.user.franchiseId,
    }).populate("includesTests.test", "price");

    if (!package) {
      return res.status(404).json({
        message: "Package not found",
      });
    }

    // Calculate total price if tests were taken individually
    let individualTotal = 0;
    for (const item of package.includesTests) {
      if (item.test && item.test.price) {
        individualTotal += item.test.price * item.quantity;
      }
    }

    const savings = individualTotal - package.specialPrice;
    const savingsPercentage =
      individualTotal > 0 ? ((savings / individualTotal) * 100).toFixed(2) : 0;

    return res.status(200).json({
      packageName: package.name,
      packagePrice: package.specialPrice,
      individualTotal: individualTotal,
      savings: savings,
      savingsPercentage: savingsPercentage,
      testsIncluded: package.includesTests.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to calculate savings",
      error: error.message,
    });
  }
};
