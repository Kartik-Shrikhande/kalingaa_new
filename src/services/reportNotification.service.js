const { sendDocumentMessage } = require("./whatsapp.service");
const { formatPhoneForWhatsApp } = require("../utils/phoneFormatter");

const sendReportOnWhatsAppIfPaid = async (bill) => {
  try {
    // ✅ Check full payment
    if (bill.balanceDue > 0) {
      console.log("Payment pending, skipping WhatsApp");
      return;
    }

    // ✅ Avoid duplicate send
    if (bill.whatsappSent) {
      console.log("WhatsApp already sent");
      return;
    }

    // ✅ Format phone
    const phone = formatPhoneForWhatsApp(bill.patient.phone);

 // ✅ ADD THESE LOGS
    console.log("📲 Sending WhatsApp...");
    console.log("Original Phone:", bill.patient.phone);
    console.log("Formatted Phone:", phone);
    console.log("Report URL:", bill.reportUrl);

    if (!phone) {
      console.log("Invalid phone number");
      return;
    }

    const patientName = bill.patient.name || "User";
    const reportLink = bill.reportUrl;

    if (!reportLink) {
      console.log("Report URL missing");
      return;
    }

    // ✅ Send PDF directly on WhatsApp
    await sendDocumentMessage({
      to: phone,
      link: reportLink,
      filename: "Report.pdf",
      caption: `Hello ${patientName}, your report is ready. Thank you for completing the payment.`,
    });

    // ✅ Mark as sent
    bill.whatsappSent = true;
    await bill.save();

    console.log("WhatsApp report sent successfully");
  } catch (error) {
    console.error("sendReportOnWhatsAppIfPaid error:", error.message);
  }
};

module.exports = {
  sendReportOnWhatsAppIfPaid,
};