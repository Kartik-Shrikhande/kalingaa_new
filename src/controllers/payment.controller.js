const razorpay = require("../config/razorpay");
const Billing = require("../models/billing.model"); 

exports.createOrderForBill = async (req, res) => {
  try {

    const { billId } = req.params;

    console.log("BillId:", billId);

    const bill = await Billing.findById(billId);

    // console.log("Bill Found:", bill);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    const amount = bill.balanceDue * 100;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `bill_${bill._id}`
    });

    res.json({
      success: true,
      order
    });

  } catch (err) {
    console.error("🔥 Create Order Error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



const crypto = require("crypto");



exports.verifyPayment = async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billId
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });
    }

    // 🔥 UPDATE BILL HERE
    const bill = await Billing.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }

    bill.amountPaid = bill.totalAmount;
    bill.balanceDue = 0;
    bill.paymentStatus = "Paid";
    bill.paymentMode = "Online";

    bill.paymentDetails = {
      transactionId: razorpay_payment_id
    };

    await bill.save();

    return res.json({
      success: true,
      message: "Payment verified & bill updated"
    });

  } catch (err) {
    console.error("Verify Error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};