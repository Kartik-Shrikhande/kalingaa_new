// routes/whatsapp.routes.js
const express = require("express");
const router = express.Router();

const {
  sendHelloWorld,
  sendCustomText,
  verifyWebhook,
  receiveWebhook,
  sendReportManual,
} = require("../controllers/whatsapp.controller");

router.post("/send-template", sendHelloWorld);
router.post("/send-text", sendCustomText);

router.get("/webhook", verifyWebhook);
router.post("/webhook", receiveWebhook);
router.post("/send-report-manual", sendReportManual);

module.exports = router;