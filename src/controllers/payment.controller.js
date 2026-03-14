const razorpay = require("../config/razorpay");

exports.createOrder = async (req,res)=>{
try{

const {amount} = req.body;

const options = {
amount: amount * 100,
currency: "INR",
receipt: "receipt_"+Date.now()
};

const order = await razorpay.orders.create(options);

res.json({
success:true,
order
});

}catch(err){
res.status(500).json({message:err.message});
}
};



const crypto = require("crypto");

exports.verifyPayment = async (req,res)=>{

try{

const {
razorpay_order_id,
razorpay_payment_id,
razorpay_signature
} = req.body;

const body = razorpay_order_id + "|" + razorpay_payment_id;

const expectedSignature = crypto
.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
.update(body)
.digest("hex");

if(expectedSignature === razorpay_signature){

return res.json({
success:true,
message:"Payment Verified"
});

}

return res.status(400).json({
success:false,
message:"Invalid signature"
});

}catch(err){
res.status(500).json({message:err.message});
}
};