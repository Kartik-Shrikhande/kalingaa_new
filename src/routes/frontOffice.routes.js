const router = require("express").Router();
const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { validationResult } = require("express-validator");

const controller = require("../controllers/frontOffice.controller");
const validator = require("../validators/frontOffice.validator");

// 🔐 Only FranchiseAdmin
router.use(authenticateUser, authorizeRoles(["FranchiseAdmin"]));

// CREATE
router.post(
  "/create",
  validator.createFrontOfficeValidator,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  controller.create
);

// GET ALL (own franchise)
router.get("/all", controller.getAll);

// GET BY ID
router.get("/get/:id", controller.getById);

// UPDATE
router.put(
  "/update/:id",
  validator.updateFrontOfficeValidator,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
  controller.update
);

// DELETE
router.delete("/delete/:id", controller.remove);

module.exports = router;
