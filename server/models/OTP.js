const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    action: {
        type: String,
        enum: [
            'account_verification',
            'account_verification_user',
            'account_verification_client',
            'event_booking',
            'password_reset'
        ],
        required: true,
        index: true
    },
    createdAt: { type: Date, default: Date.now, expires: 300 }
}, { timestamps: false });

otpSchema.index({ email: 1, action: 1 }, { unique: true });

module.exports = mongoose.model('OTP', otpSchema);
