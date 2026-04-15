const axios = require("axios");

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v25.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// ✅ UPDATED (supports dynamic variables)
const sendTemplateMessage = async ({
  to,
  templateName,
  languageCode = "en_US",
  components = [],
}) => {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components,
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

// ✅ NEW (send PDF directly)
const sendDocumentMessage = async ({ to, link, filename, caption }) => {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "document",
    document: {
      link,
      filename,
      caption,
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

const sendTextMessage = async ({ to, body }) => {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body,
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

module.exports = {
  sendTemplateMessage,
  sendTextMessage,
  sendDocumentMessage, // ✅ export this
};






// // services/whatsapp.service.js
// const axios = require("axios");

// const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v25.0";
// const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
// const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// const sendTemplateMessage = async ({ to, templateName = "hello_world", languageCode = "en_US" }) => {
//   const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

//   const payload = {
//     messaging_product: "whatsapp",
//     to,
//     type: "template",
//     template: {
//       name: templateName,
//       language: {
//         code: languageCode,
//       },
//     },
//   };

//   const response = await axios.post(url, payload, {
//     headers: {
//       Authorization: `Bearer ${ACCESS_TOKEN}`,
//       "Content-Type": "application/json",
//     },
//   });

//   return response.data;
// };

// const sendTextMessage = async ({ to, body }) => {
//   const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

//   const payload = {
//     messaging_product: "whatsapp",
//     to,
//     type: "text",
//     text: {
//       body,
//     },
//   };

//   const response = await axios.post(url, payload, {
//     headers: {
//       Authorization: `Bearer ${ACCESS_TOKEN}`,
//       "Content-Type": "application/json",
//     },
//   });

//   return response.data;
// };

// module.exports = {
//   sendTemplateMessage,
//   sendTextMessage,
// };