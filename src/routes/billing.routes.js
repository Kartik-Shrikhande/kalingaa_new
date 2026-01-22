const router = require("express").Router();
const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { validationResult } = require("express-validator");

const controller = require("../controllers/billing.controller");
const validator = require("../validators/billing.validator");

router.use(authenticateUser, authorizeRoles(["FranchiseAdmin", "FrontOffice"]));

// CREATE BILL
router.post(
  "/create",
  validator.createBillingValidator(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  controller.create,
);

// GET ALL BILLS
router.get("/all", controller.getAll);

// GET BILL BY ID
router.get("/get/:id", controller.getById);

// UPDATE PAYMENT
router.patch(
  "/update-payment/:id",
  validator.updatePaymentValidator(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  controller.updatePayment,
);

// CANCEL BILL
router.patch("/cancel/:id", controller.cancelBill);

// PRINT BILL
router.get("/print/:id", controller.printBill);

// DASHBOARD STATS (FranchiseAdmin only)
router.get(
  "/dashboard-stats",
  authorizeRoles(["FranchiseAdmin"]),
  controller.getDashboardStats,
);

// MONTHLY REVENUE (FranchiseAdmin only)
router.get(
  "/monthly-revenue",
  authorizeRoles(["FranchiseAdmin"]),
  controller.getMonthlyRevenue,
);

module.exports = router;
