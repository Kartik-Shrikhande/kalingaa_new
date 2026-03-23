const express = require("express");
const router = express.Router();

const {
  createOrderForBill,
  verifyPayment
} = require("../controllers/payment.controller");

// Create Razorpay Order
router.post("/:billId/create-order", createOrderForBill);

// Verify Payment
router.post("/verify-payment", verifyPayment);

module.exports = router;