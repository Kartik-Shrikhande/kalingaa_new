// const razorpay = require("../config/razorpay");
// const Payment = require("../models/Payment");

// exports.createPaymentOrder = async (req, res) => {
//   try {
//     const { amount, billId } = req.body;

//     const options = {
//       amount: amount * 100, // Razorpay works in paise
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);

//     const payment = await Payment.create({
//       patientId: req.user.id,
//       billId,
//       razorpayOrderId: order.id,
//       amount,
//     });

//     res.status(200).json({
//       success: true,
//       order,
//       paymentId: payment._id,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// const crypto = require("crypto");

// exports.verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature === razorpay_signature) {

//       await Payment.findOneAndUpdate(
//         { razorpayOrderId: razorpay_order_id },
//         {
//           razorpayPaymentId: razorpay_payment_id,
//           razorpaySignature: razorpay_signature,
//           status: "paid",
//         }
//       );

//       return res.json({ success: true, message: "Payment verified" });
//     }

//     res.status(400).json({ message: "Invalid signature" });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
