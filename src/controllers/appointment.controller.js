// appointment.controller.js
const Appointment = require("../models/appointment.model");
const Patient = require("../models/patient.model");
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


//APPOINTMENT PATIENT APIS