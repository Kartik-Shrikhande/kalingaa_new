const router = require("express").Router();
const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const controller = require("../controllers/report.controller");
const validator = require("../validators/report.validator");


router.use(authenticateUser);

router.post(
  "/",
  authorizeRoles(["LabTechnician"]),
  validator.createReport,
  controller.createReport
);

router.put(
  "/:id",
  authorizeRoles(["LabTechnician"]),
  validator.updateReport,
  controller.updateReport
);

router.patch(
  "/:id/complete",
  authorizeRoles(["LabTechnician"]),
  controller.completeReport
);

router.patch(
  "/:id/verify",
  authorizeRoles(["Doctor", "Admin"]),
  controller.verifyReport
);

router.get("/:id", controller.getReportById);
router.get("/", controller.getReports);

router.delete(
  "/:id",
  authorizeRoles(["LabTechnician"]),
  controller.deleteReport
);

module.exports = router;
