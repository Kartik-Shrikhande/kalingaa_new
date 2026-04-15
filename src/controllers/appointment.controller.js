// appointment.controller.js
const Appointment = require("../models/appointment.model");
const Patient = require("../models/patient.model");
const Package = require("../models/package.model");
const Test = require("../models/test.model");
const mongoose = require("mongoose");




//APPOINTMENT ADMIN APIS
// Helper function to flatten appointment data for the Frontend
const formatAppointment = (apt) => {
  // Logic to get a display name for the services
  const itemNames = apt.items?.map((i) => i.name).join(", ") || "No services";

  return {
    _id: apt._id,
    patientId: apt.patientId?._id,
    patientName: apt.patientId?.name || "Unknown",
    patientPhone: apt.patientId?.phone || "N/A",
    // These are now derived from the items array
    testName: apt.items
      ?.filter((i) => i.itemType === "Test")
      .map((i) => i.name)
      .join(", "),
    packageName: apt.items
      ?.filter((i) => i.itemType === "Package")
      .map((i) => i.name)
      .join(", "),
    displayServices: itemNames,
    date: apt.appointmentDate,
    time: apt.appointmentTime,
    status: apt.status.toLowerCase(),
    notes: apt.notes || "",
    estimatedAmount: apt.totalAmount || 0,
    createdAt: apt.createdAt,
  };
};

exports.create = async (req, res) => {
  try {
    const {
      patientId,
      date, // Coming from frontend
      time, // Coming from frontend
      items,
      notes,
    } = req.body;

    // 1. Validate Patient
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // 2. Validate Franchise
    if (
      req.user.role !== "SuperAdmin" &&
      patient.franchiseId.toString() !== req.user.franchiseId.toString()
    ) {
      return res.status(403).json({ message: "Access denied to this patient" });
    }

    // 3. Process Items & Calculate Total
    let calculatedTotal = 0;
    const processedItems = items.map((item) => {
      calculatedTotal += item.price;
      return item;
    });

    // 4. CREATE with correct schema field names
    const appointment = await Appointment.create({
      patientId,
      franchiseId: patient.franchiseId,
      appointmentDate: date, // Map 'date' -> 'appointmentDate'
      appointmentTime: time, // Map 'time' -> 'appointmentTime'
      items: processedItems,
      totalAmount: calculatedTotal,
      notes,
    });

    // 5. Populate for response (Prevents "Unknown" name issues)
    const populatedApt = await Appointment.findById(appointment._id).populate(
      "patientId",
      "name phone",
    );

    return res.status(201).json({
      message: "Appointment created successfully",
      data: formatAppointment(populatedApt),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create appointment", error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const filter =
      req.user.role === "SuperAdmin"
        ? {}
        : { franchiseId: req.user.franchiseId };

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name phone")
      .sort({ createdAt: -1 });

    const formattedData = appointments.map((apt) => formatAppointment(apt));

    return res.status(200).json({
      total: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch appointments", error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "patientId",
      "name phone age gender email address",
    );
    // REMOVED testId and packageId population

    if (!appointment) return res.status(404).json({ message: "Not found" });
    // ... security check ...
    return res.status(200).json(formatAppointment(appointment));
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: "Not found" });

    appointment.status = status;
    await appointment.save();

    return res.status(200).json({
      message: `Status updated to ${status}`,
      data: formatAppointment(appointment),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Update failed", error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    // 1. Fetch AND Populate immediately
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name phone")
      .populate("testId", "name price")
      .populate("packageId", "name specialPrice");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 2. Update status
    appointment.status = "Cancelled";
    await appointment.save();

    // 3. Now formatAppointment will have the correct data
    return res.status(200).json({
      message: "Appointment cancelled successfully",
      data: formatAppointment(appointment),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to cancel", error: error.message });
  }
};


//APPOINTMENT -  PATIENT ROLE APIS


exports.createAppointment = async (req, res) => {
  try {
    const {
      appointmentDate,
      appointmentTime,
      items,
      notes,
      patientDetails,
      sampleCollection
    } = req.body;

    /* =================================
       1️⃣ REQUIRED FIELD VALIDATION
    ================================= */
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "appointmentDate and appointmentTime are required"
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one test or package must be selected"
      });
    }

    /* =================================
       2️⃣ DATE VALIDATION
    ================================= */
    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        message: "Appointment date cannot be in the past"
      });
    }

    /* =================================
       3️⃣ DUPLICATE ITEM VALIDATION
    ================================= */
    const itemIds = items.map(i => i.itemId);
    const uniqueIds = new Set(itemIds);

    if (uniqueIds.size !== itemIds.length) {
      return res.status(400).json({
        message: "Duplicate test/package IDs are not allowed"
      });
    }

    /* =================================
       4️⃣ OPTIONAL PATIENT DETAILS VALIDATION
    ================================= */
    if (patientDetails) {
      if (patientDetails.age && patientDetails.age < 0) {
        return res.status(400).json({
          message: "Invalid patient age"
        });
      }

      if (
        patientDetails.phone &&
        !/^[0-9]{10}$/.test(patientDetails.phone)
      ) {
        return res.status(400).json({
          message: "Invalid phone number format"
        });
      }
    }

    /* =================================
       5️⃣ SAMPLE COLLECTION VALIDATION
    ================================= */
    if (sampleCollection) {
      const allowedTypes = ["Home", "Hospital"];

      if (
        sampleCollection.collectionType &&
        !allowedTypes.includes(sampleCollection.collectionType)
      ) {
        return res.status(400).json({
          message: "Invalid sample collection type"
        });
      }

      if (
        sampleCollection.collectionType === "Home" &&
        !sampleCollection.collectionAddress
      ) {
        return res.status(400).json({
          message: "Collection address required for Home sample"
        });
      }
    }

    /* =================================
       6️⃣ PROCESS ITEMS SAFELY
    ================================= */
    let processedItems = [];
    let totalAmount = 0;

    for (const item of items) {

      if (!mongoose.Types.ObjectId.isValid(item.itemId)) {
        return res.status(400).json({
          message: `Invalid itemId format: ${item.itemId}`
        });
      }

      let itemData = null;
      let itemType = null;

      // 🔹 Check Test
      const test = await Test.findOne({
        _id: item.itemId,
        franchiseId: req.user.franchiseId
      }).select("name code price isActive");

      if (test) {
        if (!test.isActive) {
          return res.status(400).json({
            message: `Test '${test.name}' is inactive`
          });
        }
        itemData = test;
        itemType = "Test";
      }

      // 🔹 Check Package
      if (!itemData) {
        const pkg = await Package.findOne({
          _id: item.itemId,
          franchiseId: req.user.franchiseId
        }).select("name code specialPrice isActive");

        if (pkg) {
          if (!pkg.isActive) {
            return res.status(400).json({
              message: `Package '${pkg.name}' is inactive`
            });
          }
          itemData = pkg;
          itemType = "Package";
        }
      }

      if (!itemData) {
        return res.status(404).json({
          message: `Test/Package not found for ID: ${item.itemId}`
        });
      }

      let price =
        itemType === "Test"
          ? itemData.price
          : itemData.specialPrice;

      totalAmount += price;

      processedItems.push({
        itemType,
        itemId: itemData._id,
        name: itemData.name,
        price
      });
    }

    /* =================================
       7️⃣ CREATE APPOINTMENT
    ================================= */
    const appointment = await Appointment.create({
      patientId: req.user.id,
      franchiseId: req.user.franchiseId,
      appointmentDate,
      appointmentTime,
      patientDetails,
      sampleCollection,
      items: processedItems,
      notes,
      totalAmount,
      status: "Scheduled"
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      data: {
        appointmentId: appointment._id,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        status: appointment.status,
        totalAmount: appointment.totalAmount,
        items: processedItems
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to create appointment",
      error: error.message
    });
  }
};




/* ===============================
   CREATE APPOINTMENT
================================ */


/* ===============================
   GET ALL APPOINTMENTS (PATIENT)
================================ */
exports.getAppointments = async (req, res) => {
  try {
    const { status, billingStatus } = req.query;

    const filter = {
      patientId: req.user.id,
      franchiseId: req.user.franchiseId
    };

    if (status) filter.status = status;
    if (billingStatus) filter.billingStatus = billingStatus;

    const appointments = await Appointment.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: appointments.length,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch appointments",
      error: error.message
    });
  }
};

/* ===============================
   GET SINGLE APPOINTMENT
================================ */
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patientId: req.user.id,
      franchiseId: req.user.franchiseId
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ data: appointment });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch appointment",
      error: error.message
    });
  }
};

/* ===============================
   UPDATE APPOINTMENT
================================ */
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, items, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patientId: req.user.id,
      franchiseId: req.user.franchiseId
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "Scheduled") {
      return res.status(400).json({
        message: "Only scheduled appointments can be updated"
      });
    }

    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (notes) appointment.notes = notes;

    if (items && items.length) {
      appointment.items = items;
      appointment.totalAmount = items.reduce(
        (sum, item) => sum + (item.price || 0),
        0
      );
    }

    await appointment.save();

    return res.status(200).json({
      message: "Appointment updated successfully",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update appointment",
      error: error.message
    });
  }
};

/* ===============================
   CANCEL APPOINTMENT
================================ */
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patientId: req.user.id,
      franchiseId: req.user.franchiseId
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({ message: "Appointment already cancelled" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    return res.status(200).json({
      message: "Appointment cancelled successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel appointment",
      error: error.message
    });
  }
};




exports.getAppointmentsForFrontOffice = async (req, res) => {
  try {
    const {
      date,
      fromDate,
      toDate,
      status,
      collectionType
    } = req.query;

    let filter = {
      franchiseId: req.user.franchiseId
    };

    /* ===============================
       DATE FILTERING
    =============================== */

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.appointmentDate = { $gte: start, $lte: end };
    }

    if (fromDate && toDate) {
      filter.appointmentDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    /* ===============================
       STATUS FILTER
    =============================== */

    if (status) {
      filter.status = status;
    }

    /* ===============================
       SAMPLE COLLECTION FILTER
    =============================== */

    if (collectionType) {
      filter["sampleCollection.collectionType"] = collectionType;
    }

    /* ===============================
       FETCH DATA
    =============================== */

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name phone age gender")
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    return res.status(200).json({
      message: "Appointments fetched successfully",
      total: appointments.length,
      data: appointments.map(app => ({
        appointmentId: app._id,
        appointmentDate: app.appointmentDate,
        appointmentTime: app.appointmentTime,
        status: app.status,
        totalAmount: app.totalAmount,
        sampleCollection: app.sampleCollection?.collectionType || null,
          notes: app.notes || null,
  createdAt: app.createdAt,

        patient: {
          name: app.patientDetails?.fullName || app.patientId?.name,
          phone: app.patientDetails?.phone || app.patientId?.phone,
          age: app.patientDetails?.age || app.patientId?.age,
          gender: app.patientDetails?.gender || app.patientId?.gender
        },

        items: app.items.map(item => ({
          itemType: item.itemType,
          name: item.name,
          price: item.price
        }))
      }))
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch appointments",
      error: error.message
    });
  }
};

