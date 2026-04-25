const Razorpay = require('razorpay');
const { env } = require('../config/env');
const { AppError } = require('./appError');

const hasRazorpayConfig = () => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

const getRazorpayInstance = () => {
    if (!hasRazorpayConfig()) {
        throw new AppError(503, 'Razorpay credentials are not configured', {
            code: 'RAZORPAY_NOT_CONFIGURED'
        });
    }

    return new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET
    });
};

module.exports = { getRazorpayInstance, hasRazorpayConfig };
