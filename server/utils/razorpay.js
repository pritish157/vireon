const Razorpay = require('razorpay');

const hasRazorpayConfig = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpayInstance = () => {
    if (!hasRazorpayConfig()) {
        throw new Error('Razorpay credentials are not configured');
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

module.exports = { getRazorpayInstance, hasRazorpayConfig };
