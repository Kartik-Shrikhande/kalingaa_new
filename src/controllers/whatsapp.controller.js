// controllers/whatsapp.controller.js
const {
  sendTemplateMessage,
  sendTextMessage,
} = require("../services/whatsapp.service");
const { formatPhoneForWhatsApp } = require("../utils/phoneFormatter");

const sendHelloWorld = async (req, res) => {
  try {
    const rawPhone = req.body.phone || process.env.WHATSAPP_TEST_RECIPIENT;
    const to = formatPhoneForWhatsApp(rawPhone);

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const result = await sendTemplateMessage({
      to,
      templateName: "hello_world",
      languageCode: "en_US",
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp template message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("sendHelloWorld error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

const sendCustomText = async (req, res) => {
  try {
    const { phone, message } = req.body;
    const to = formatPhoneForWhatsApp(phone);

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: "Phone and message are required",
      });
    }

    const result = await sendTextMessage({
      to,
      body: message,
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp text message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("sendCustomText error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

const receiveWebhook = async (req, res) => {
  try {
    console.log("WhatsApp Webhook Payload:", JSON.stringify(req.body, null, 2));
    return res.sendStatus(200);
  } catch (error) {
    console.error("receiveWebhook error:", error.message);
    return res.sendStatus(500);
  }
};


const Report = require("../models/report.model");
const { sendDocumentMessage } = require("../services/whatsapp.service");


const sendReportManual = async (req, res) => {
  try {
    const { reportId } = req.body;

    const report = await Report.findById(reportId).populate("patient");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

   if (!report.pdfUrl) {
      return res.status(400).json({
        success: false,
        message: "Report PDF not generated",
      });
    }

    const phone = formatPhoneForWhatsApp(report.patient.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    console.log("📲 Sending manual report...");
    console.log("To:", phone);
console.log("PDF:", report.pdfUrl);

    const response = await sendDocumentMessage({
      to: phone,
    link: report.pdfUrl,
      filename: "Report.pdf",
      caption: `Hello ${report.patient.name}, your report is ready.`,
    });

    console.log("✅ WhatsApp Response:", response);

    return res.status(200).json({
      success: true,
      message: "Report sent on WhatsApp",
      data: response,
    });
  } catch (error) {
    console.error("❌ Manual WhatsApp error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = {
  sendHelloWorld,
  sendCustomText,
  verifyWebhook,
  receiveWebhook,
  sendReportManual,
};