const router = require("express").Router();
const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { validationResult } = require("express-validator");

const controller = require("../controllers/patient.controller");
const validator = require("../validators/patient.validator");

router.use(
  authenticateUser,
  authorizeRoles(["FranchiseAdmin", "FrontOffice", "LabTechnician"]),
);

// CREATE PATIENT (FrontOffice only)
router.post(
  "/create",
  authorizeRoles(["FranchiseAdmin", "FrontOffice"]),
  validator.createPatientValidator(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  controller.create,
);

// GET ALL PATIENTS
router.get("/all", controller.getAll);

// SEARCH PATIENTS
router.get("/search", controller.search);

// GET PATIENT BY ID
router.get("/get/:id", controller.getById);

// UPDATE PATIENT (FrontOffice only)
router.put(
  "/update/:id",
  authorizeRoles(["FranchiseAdmin", "FrontOffice"]),
  validator.updatePatientValidator(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  controller.update,
);

// GET PATIENT BILLS
router.get("/:id/bills", controller.getPatientBills);

module.exports = router;
