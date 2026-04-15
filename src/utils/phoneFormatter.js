// utils/phoneFormatter.js
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;

  let cleaned = String(phone).replace(/\D/g, "");

  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }

  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
};

module.exports = {
  formatPhoneForWhatsApp,
};