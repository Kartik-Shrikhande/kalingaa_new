const router = require("express").Router();
const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { validationResult } = require("express-validator");

const controller = require("../controllers/package.controller");
const validator = require("../validators/package.validator");

router.use(
  authenticateUser,
  authorizeRoles(["FranchiseAdmin", "FrontOffice", "LabTechnician"]),
);

// CREATE (FranchiseAdmin only)
router.post(
  "/create",
  authorizeRoles(["FranchiseAdmin"]),
  validator.createPackageValidator(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  controller.create,
);

// GET ALL
router.get("/all", controller.getAll);

// GET BY ID
router.get("/get/:id", controller.getById);

// UPDATE (FranchiseAdmin only)
router.put(
  "/update/:id",
  authorizeRoles(["FranchiseAdmin"]),
  validator.updatePackageValidator(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  controller.update,
);

// ACTIVATE / DEACTIVATE
router.patch(
  "/toggle-status/:id",
  authorizeRoles(["FranchiseAdmin"]),
  controller.toggleStatus,
);

// TOGGLE POPULAR
router.patch(
  "/toggle-popular/:id",
  authorizeRoles(["FranchiseAdmin"]),
  controller.togglePopular,
);

// PERMANENT DELETE (FranchiseAdmin only)
router.delete(
  "/delete/:id",
  authorizeRoles(["FranchiseAdmin"]),
  controller.remove,
);

// GET ACTIVE PACKAGES FOR BILLING
router.get("/active", controller.getActivePackages);

// GET PACKAGE CATEGORIES
router.get("/categories", controller.getPackageCategories);

// GET PACKAGE TYPES
router.get("/types", controller.getPackageTypes);

// CALCULATE SAVINGS
router.get("/savings/:packageId", controller.calculatePackageSavings);

module.exports = router;
