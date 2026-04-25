const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending', index: true },
    paymentStatus: {
        type: String,
        enum: ['initiated', 'paid', 'not_paid', 'failed', 'refund_pending', 'refunded'],
        default: 'not_paid',
        index: true
    },
    paymentMethod: { type: String, default: 'free' },
    paymentGateway: { type: String, enum: ['none', 'razorpay'], default: 'none', index: true },
    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null, index: true },
    razorpaySignature: { type: String, default: null },
    paymentDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    refundDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    amount: { type: Number, required: true, min: 0 },
    bookedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ eventId: 1, status: 1 });
bookingSchema.index({ userId: 1, eventId: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
