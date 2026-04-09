const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending' },
    paymentStatus: { type: String, enum: ['initiated', 'paid', 'not_paid', 'failed', 'refund_pending', 'refunded'], default: 'not_paid' },
    paymentMethod: { type: String, default: 'free' },
    paymentGateway: { type: String, enum: ['none', 'razorpay'], default: 'none' },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    paymentDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    refundDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    amount: { type: Number, required: true },
    bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
