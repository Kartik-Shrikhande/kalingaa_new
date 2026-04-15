const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/test-whatsapp", async (req, res) => {
  try {
    const response = await axios.post(
      "https://graph.facebook.com/v25.0/1045388438663290/messages",
      {
        messaging_product: "whatsapp",
        to:process.env.WHATSAPP_TEST_RECIPIENT,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});



router.get("/webhook", (req, res) => {
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
});

router.post("/webhook", async (req, res) => {
  console.log("Webhook payload:", JSON.stringify(req.body, null, 2));
  return res.sendStatus(200);
});
module.exports = router;