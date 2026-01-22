const express = require("express");
const app = express();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");

const cookieParser = require("cookie-parser");

// Importing Routes
const superAdminRoute = require("../src/routes/superAdmin.routes");
const franchiseRoute = require("../src/routes/franchise.routes");
const franchiseAdminRoute = require("../src/routes/franchiseAdmin.routes");
const AuthRoute = require("../src/routes/auth.routes");
const frontOfficeRoute = require("./routes/frontOffice.routes");
const labTechnicianRoute = require("./routes/labTechnician.routes");
const patientRoute = require("./routes/patient.routes");
const testRoute = require("./routes/test.routes");
const appointmentRoute = require("./routes/appointment.routes");
const packagesRoute = require("./routes/package.routes");
const billingRoute = require("./routes/billing.routes");

// Middleware
app.use(
  cors({
    origin: true, // reflects request origin
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/superadmin", superAdminRoute);
app.use("/api/franchise", franchiseRoute);
app.use("/api/franchise/admin", franchiseAdminRoute);
app.use("/api/front-office", frontOfficeRoute);
app.use("/api/labtechnician", labTechnicianRoute);
app.use("/api/patient", patientRoute);
app.use("/api/test", testRoute);
app.use("/api/auth", AuthRoute);
app.use("/api/appointment", appointmentRoute);
app.use("/api/packages", packagesRoute);
app.use("/api/billing", billingRoute);
// Routes
// app.use("/api/auth", require("./routes/auth.routes"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    // Start the server after successful DB connection
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
