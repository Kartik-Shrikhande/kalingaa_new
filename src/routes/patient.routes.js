const router = require("express").Router();
const { authenticateUser } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { validationResult } = require("express-validator");

const controller = require("../controllers/patient.controller");
const validator = require("../validators/patient.validator");
const appointmentController = require("../controllers/appointment.controller");
const testController = require("../controllers/test.controller")
const packageController = require("../controllers/package.controller")

router.post("/login", controller.patientLogin);

router.use(
  authenticateUser,
  authorizeRoles(["FranchiseAdmin", "FrontOffice", "LabTechnician","Patient"]),
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

// DELETE PATIENT (FranchiseAdmin only)
router.delete(
  "/delete/:id",
  authorizeRoles(["FranchiseAdmin"]),
  controller.remove,
);

// GET PATIENT BILLS by id 
router.get("/bills", controller.getPatientBills);
router.get("/bills/:id", controller.getPatientBillById)

//Appointments for patient




// router.use(authenticateUser, authorizeRoles(["Patient"]));

router.post("/appointments/book", appointmentController.createAppointment);
router.get("/appointments", appointmentController.getAppointments);
router.get("/appointments/:id", appointmentController.getAppointmentById);
router.put("/appointments/:id", appointmentController.updateAppointment);
router.patch("/appointments/cancel/:id", appointmentController.cancelAppointment);


// GET PATIENT REPORTS

router.get("/reports/all", controller.getMyReports);
router.get("/report/get/:id", controller.getMyReportById);


//TEST - PATIENT ROLE
// GET ALL
router.get("/test/all", testController.getAll);

// GET BY ID
router.get("/test/get/:id", testController.getById);




//Package - PATIENT ROLE
// GET ALL
router.get("/package/all", packageController.getAll);

// GET BY ID
router.get("/package/get/:id", packageController.getById);





/* Franchise Admin */
router.get(
  "/history",
  authenticateUser,
  authorizeRoles(["FranchiseAdmin","FrontOffice"]),
  controller.getPatientHistory
);

/* Patient */
router.get(
  "/my/history",
  authenticateUser,
  authorizeRoles(["Patient"]),
  controller.getMyHistory
);



//PATIENT HISTORY

module.exports = router;


