const crypto = require('crypto');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { AppError } = require('../utils/appError');
const { OTP_ACTIONS } = require('../utils/otpActions');
const { normalizeEmail } = require('./authService');

const verifyBookingOtp = async (email, otp) => {
    if (!otp || !/^\d{6}$/.test(otp)) {
        return null;
    }

    return OTP.findOne({ email: normalizeEmail(email), otp, action: OTP_ACTIONS.EVENT_BOOKING });
};

const reserveSeatForEvent = (eventId) =>
    Event.findOneAndUpdate(
        { _id: eventId, availableSeats: { $gt: 0 } },
        { $inc: { availableSeats: -1 } },
        { new: true }
    );

const releaseReservedSeat = async (eventId) => {
    await Event.findByIdAndUpdate(eventId, { $inc: { availableSeats: 1 } });
};

const ensureEventBookable = async ({ eventId, userId }) => {
    const event = await Event.findById(eventId);
    if (!event) {
        throw new AppError(404, 'Event not found', { code: 'EVENT_NOT_FOUND' });
    }

    if (event.availableSeats <= 0) {
        throw new AppError(409, 'No seats available', { code: 'NO_SEATS_AVAILABLE' });
    }

    const existingBooking = await Booking.findOne({
        userId,
        eventId,
        status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 });

    if (existingBooking) {
        const isUnpaidRazorpayAttempt =
            existingBooking.paymentGateway === 'razorpay' && existingBooking.paymentStatus !== 'paid';

        if (!isUnpaidRazorpayAttempt) {
            throw new AppError(
                409,
                existingBooking.status === 'confirmed'
                    ? 'You already have a confirmed booking for this event'
                    : 'You already have a pending booking for this event',
                { code: 'BOOKING_ALREADY_EXISTS' }
            );
        }

        existingBooking.status = 'cancelled';
        if (['initiated', 'not_paid'].includes(existingBooking.paymentStatus)) {
            existingBooking.paymentStatus = 'failed';
        }
        await existingBooking.save();
    }

    return event;
};

const markBookingPaymentFailed = async (booking, extras = {}) => {
    booking.status = 'cancelled';
    booking.paymentStatus = 'failed';
    booking.razorpayPaymentId = extras.paymentId || booking.razorpayPaymentId;
    booking.razorpaySignature = extras.signature || booking.razorpaySignature;
    booking.paymentMethod = extras.paymentMethod || booking.paymentMethod;
    booking.paymentDetails = extras.paymentDetails || booking.paymentDetails;
    await booking.save();
    return booking;
};

const isProcessedRefund = (refund) => refund?.status === 'processed';

const initiateRazorpayRefund = async ({ booking, razorpay, paymentId, notes, failureContext }) => {
    const refund = await razorpay.payments.refund(paymentId, { notes });
    const refundProcessed = isProcessedRefund(refund);

    booking.status = 'cancelled';
    booking.paymentStatus = refundProcessed ? 'refunded' : 'refund_pending';
    booking.refundDetails = refund;
    booking.razorpayPaymentId = failureContext?.paymentId || booking.razorpayPaymentId;
    booking.razorpaySignature = failureContext?.signature || booking.razorpaySignature;
    booking.paymentMethod = failureContext?.paymentMethod || booking.paymentMethod;
    booking.paymentDetails = failureContext?.paymentDetails || booking.paymentDetails;
    await booking.save();

    return { refund, refundProcessed };
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature, secret }) => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return expectedSignature === signature;
};

module.exports = {
    ensureEventBookable,
    initiateRazorpayRefund,
    isProcessedRefund,
    markBookingPaymentFailed,
    releaseReservedSeat,
    reserveSeatForEvent,
    verifyBookingOtp,
    verifyRazorpaySignature
};
