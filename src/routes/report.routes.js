const router = require("express").Router();
const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const controller = require("../controllers/report.controller");
const validator = require("../validators/report.validator");
const { checkBillPayment } = require("../middlewares/checkBillPayment");


router.use(authenticateUser);

router.post(
  "/create",
  authorizeRoles(["LabTechnician"]),
  validator.createReport,
  controller.createReport
);

router.put(
  "/update/:id",
  authorizeRoles(["LabTechnician"]),
  validator.updateReport,
  controller.updateReport
);

router.patch(
  "/:id/complete",
  authorizeRoles(["LabTechnician"]),
  controller.completeReport
);

router.get("/get/:id", checkBillPayment,controller.getReportById);

router.get("/all", controller.getReports);


router.delete(
  "/delete/:id",
  authorizeRoles(["LabTechnician"]),
  controller.deleteReport
);

router.patch(
  "/:id/verify",
  authorizeRoles(["FranchiseAdmin"]),
  controller.verifyReport
);

// GET PATIENT REPORTS




module.exports = router;
