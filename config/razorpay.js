
const Razorpay = require('razorpay');
require('dotenv').config();

// console.log("RAZORPAY_ID_KEY : ", process.env.RAZORPAY_ID_KEY);
// console.log("RAZORPAY_SECRET_KEY : ", process.env.RAZORPAY_SECRET_KEY);

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

module.exports = instance;