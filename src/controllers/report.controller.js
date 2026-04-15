const Report = require("../models/report.model");
const Patient = require("../models/patient.model");
const Test = require("../models/test.model");
const Billing = require("../models/billing.model");
const { sendReportOnWhatsAppIfPaid } = require("../services/reportNotification.service");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { uploadFile } = require("../services/s3.service");
/* ---------- CREATE ---------- */


exports.createReport = async (req, res) => {
  try {
    const { patientId, testId, results, impression, remarks, status } = req.body;

    const patient = await Patient.findOne({
      _id: patientId,
      franchiseId: req.user.franchiseId,
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const test = await Test.findOne({
      _id: testId,
      franchiseId: req.user.franchiseId,
      isActive: true,
    });
    if (!test) return res.status(404).json({ message: "Test not found" });

    let finalResults = results;
    if (!results || results.length === 0) {
      finalResults = (test.parameters || []).map((p) => ({
        parameter: p,
        value: "",
        unit: "",
        referenceRange: "",
      }));
    }

    // ✅ CREATE REPORT FIRST
    const report = await Report.create({
      patient: patientId,
      test: testId,
      results: finalResults,
      impression,
      remarks,
      status: status || "Draft",
      createdBy: req.user._id,
      franchiseId: req.user.franchiseId,
    });

    // 🔥 PDF GENERATION + S3 UPLOAD

    const doc = new PDFDocument();
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);

        const fileName = `reports/report-${report._id}.pdf`;

        // ✅ Upload to S3
        const fileUrl = await uploadFile({
          buffer: pdfBuffer,
          fileName,
          contentType: "application/pdf",
        });

        console.log("✅ Uploaded to S3:", fileUrl);

        // ✅ Save URL in DB
        report.pdfUrl = fileUrl;
        await report.save();

        console.log("✅ PDF URL saved in DB");
      } catch (err) {
        console.error("❌ S3 Upload Error:", err.message);
      }
    });

    // 🧾 PDF CONTENT
    doc.fontSize(18).text("Medical Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Patient Name: ${patient.name}`);
    doc.text(`Age: ${patient.age || "-"}`);
    doc.text(`Gender: ${patient.gender || "-"}`);
    doc.text(`Test: ${test.name}`);
    doc.moveDown();

    doc.text("Results:");
    finalResults.forEach((r, index) => {
      doc.text(
        `${index + 1}. ${r.parameter} : ${r.value || "-"} ${r.unit || ""} (${r.referenceRange || "-"})`
      );
    });

    doc.moveDown();

    if (impression) {
      doc.text(`Impression: ${impression}`);
      doc.moveDown();
    }

    if (remarks) {
      doc.text(`Remarks: ${remarks}`);
    }

    doc.end();

    // ❗ wait for PDF generation + S3 upload
    await new Promise((resolve) => doc.on("end", resolve));

    // ✅ SEND RESPONSE AFTER EVERYTHING
    const updatedReport = await Report.findById(report._id);

    res.status(201).json({
      message: "Report created with PDF uploaded to S3",
      data: updatedReport,
    });

  } catch (err) {
    console.error("❌ createReport error:", err);
    res.status(500).json({ message: err.message });
  }
};
// exports.createReport = async (req, res) => {
//   try {
//     const { patientId, testId, results, impression, remarks, status } = req.body;

//     const patient = await Patient.findOne({
//       _id: patientId,
//       franchiseId: req.user.franchiseId,
//     });
//     if (!patient) return res.status(404).json({ message: "Patient not found" });

//     const test = await Test.findOne({
//       _id: testId,
//       franchiseId: req.user.franchiseId,
//       isActive: true,
//     });
//     if (!test) return res.status(404).json({ message: "Test not found" });

//     // 🔥 Auto-load parameters
//     let finalResults = results;
//     if (!results || results.length === 0) {
//       finalResults = (test.parameters || []).map(p => ({
//         parameter: p,
//         value: "",
//         unit: "",
//         referenceRange: "",
//       }));
//     }

//     const report = await Report.create({
//       patient: patientId,
//       test: testId,
//       results: finalResults,
//       impression,
//       remarks,
//       status: status || "Draft",
//       createdBy: req.user._id,
//       franchiseId: req.user.franchiseId,
//     });

//     res.status(201).json({ message: "Report created", data: report });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

/* ---------- UPDATE ---------- */
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      franchiseId: req.user.franchiseId,
      isActive: true,
    });

    if (!report) return res.status(404).json({ message: "Report not found" });
    if (report.status === "Verified")
      return res.status(403).json({ message: "Verified report locked" });

    Object.assign(report, req.body);
    await report.save();

    res.json({ message: "Report updated", data: report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- COMPLETE ---------- */
exports.completeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = "Completed";
    report.reportedAt = new Date();
    await report.save();

    res.json({ message: "Report completed", data: report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- VERIFY ---------- */

exports.verifyReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("patient")
      .populate("test");

    if (!report) return res.status(404).json({ message: "Report not found" });

    if (report.status !== "Completed")
      return res.status(400).json({ message: "Only completed reports allowed" });

    report.status = "Verified";
    report.verifiedBy = req.user._id;
    report.verifiedAt = new Date();
    await report.save();

    // 🔥 FIND BILL (1 bill per patient ✅)
    const bill = await Billing.findOne({
      patient: report.patient._id,
    }).populate("patient");

    if (bill) {
      // ✅ attach report URL from report
      bill.reportUrl = report.reportUrl;
      await bill.save();

      // ✅ send WhatsApp
      await sendReportOnWhatsAppIfPaid(bill);
    }

    res.json({ message: "Report verified", data: report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// exports.verifyReport = async (req, res) => {
//   try {
//     const report = await Report.findById(req.params.id);
//     if (!report) return res.status(404).json({ message: "Report not found" });

//     if (report.status !== "Completed")
//       return res.status(400).json({ message: "Only completed reports allowed" });

//     report.status = "Verified";
//     report.verifiedBy = req.user._id;
//     report.verifiedAt = new Date();
//     await report.save();

//     res.json({ message: "Report verified", data: report });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

/* ---------- GET ---------- */
exports.getReportById = async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate("patient", "name age gender")
    .populate("test", "name");

  if (!report) return res.status(404).json({ message: "Not found" });
  res.json({ data: report });
};

/* ---------- LIST ---------- */
exports.getReports = async (req, res) => {
  const filter = {
    franchiseId: req.user.franchiseId,
    isActive: true,
  };
  if (req.query.status) filter.status = req.query.status;

  const reports = await Report.find(filter)
    .populate("patient", "name")
    .populate("test", "name")
    .sort({ createdAt: -1 });

  res.json({ total: reports.length, data: reports });
};

/* ---------- DELETE ---------- */
exports.deleteReport = async (req, res) => {
  await Report.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: "Report deleted" });
};
