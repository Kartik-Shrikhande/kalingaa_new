const router = require("express").Router();
const { validationResult } = require("express-validator");

const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const controller = require("../controllers/appointment.controller");
const validator = require("../validators/appointment.validator");

// CREATE
router.post(
  "/create",
  authenticateUser,
  authorizeRoles(["FrontOffice", "FranchiseAdmin"]),
  validator.createAppointmentValidator,
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
router.get(
  "/all",
  authenticateUser,
  authorizeRoles(["FrontOffice", "FranchiseAdmin", "SuperAdmin"]),
  controller.getAll,
);

// GET BY ID
router.get(
  "/get/:id",
  authenticateUser,
  authorizeRoles(["FrontOffice", "FranchiseAdmin", "SuperAdmin"]),
  controller.getById,
);

// UPDATE STATUS
router.put(
  "/status/:id",
  authenticateUser,
  authorizeRoles(["FrontOffice", "FranchiseAdmin"]),
  controller.updateStatus,
);

// CANCEL
router.patch(
  "/cancel/:id",
  authenticateUser,
  authorizeRoles(["FranchiseAdmin", "SuperAdmin"]),
  controller.remove,
);

module.exports = router;
