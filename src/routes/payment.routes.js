const { createOrder, verifyPayment } = require("../controllers/payment.controller");

const router = require("express").Router();

router.post("/create-order",createOrder);
router.post("/verify-payment",verifyPayment);

module.exports = router;