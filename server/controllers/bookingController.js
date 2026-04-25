const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { env } = require('../config/env');
const { asyncHandler } = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');
const { getRazorpayInstance, hasRazorpayConfig } = require('../utils/razorpay');
const { OTP_ACTIONS } = require('../utils/otpActions');
const { normalizeEmail } = require('../services/authService');
const {
    ensureEventBookable,
    initiateRazorpayRefund,
    isProcessedRefund,
    markBookingPaymentFailed,
    releaseReservedSeat,
    reserveSeatForEvent,
    verifyBookingOtp,
    verifyRazorpaySignature
} = require('../services/bookingService');
const { parsePagination } = require('../utils/query');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const assertBookingAllowedForRole = (user) => {
    if (user.role === 'client') {
        throw new AppError(403, 'Client organizer accounts cannot book events. Please use a user account.', {
            code: 'CLIENT_BOOKING_DISABLED'
        });
    }
};

exports.sendBookingOTP = asyncHandler(async (req, res) => {
    assertBookingAllowedForRole(req.user);

    const otp = generateOtp();
    const email = normalizeEmail(req.user.email);

    await OTP.findOneAndDelete({ email, action: OTP_ACTIONS.EVENT_BOOKING });
    await OTP.create({ email, otp, action: OTP_ACTIONS.EVENT_BOOKING });
    await sendOTPEmail(email, otp, 'event_booking');

    return sendSuccess(res, {
        message: 'OTP sent successfully'
    });
});

exports.bookEvent = asyncHandler(async (req, res) => {
    assertBookingAllowedForRole(req.user);

    const { eventId, otp } = req.body;
    const validOtp = await verifyBookingOtp(req.user.email, otp);

    if (!validOtp) {
        throw new AppError(400, 'Invalid or expired OTP for booking', { code: 'OTP_INVALID' });
    }

    const event = await ensureEventBookable({ eventId, userId: req.user.id });

    if (event.ticketPrice > 0) {
        throw new AppError(400, 'Paid events must be completed through Razorpay checkout', {
            code: 'RAZORPAY_REQUIRED'
        });
    }

    const reservedEvent = await reserveSeatForEvent(eventId);
    if (!reservedEvent) {
        throw new AppError(409, 'No seats available', { code: 'NO_SEATS_AVAILABLE' });
    }

    let booking;
    try {
        booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentMethod: 'free',
            paymentGateway: 'none',
            amount: 0
        });
    } catch (error) {
        await releaseReservedSeat(eventId);
        throw error;
    }

    await OTP.deleteOne({ _id: validOtp._id });

    return sendSuccess(res, {
        statusCode: 201,
        message: 'Free event booked successfully',
        data: {
            booking: booking.toObject()
        }
    });
});

exports.createPaymentOrder = asyncHandler(async (req, res) => {
    assertBookingAllowedForRole(req.user);

    if (!hasRazorpayConfig()) {
        throw new AppError(503, 'Razorpay is not configured on the server', {
            code: 'RAZORPAY_NOT_CONFIGURED'
        });
    }

    const { eventId, otp } = req.body;
    const validOtp = await verifyBookingOtp(req.user.email, otp);

    if (!validOtp) {
        throw new AppError(400, 'Invalid or expired OTP for booking', { code: 'OTP_INVALID' });
    }

    const event = await ensureEventBookable({ eventId, userId: req.user.id });

    if (event.ticketPrice <= 0) {
        throw new AppError(400, 'Free events do not require a Razorpay order', {
            code: 'FREE_EVENT'
        });
    }

    const razorpay = getRazorpayInstance();
    const receipt = `booking_${Date.now()}_${String(req.user.id).slice(-6)}`;
    const order = await razorpay.orders.create({
        amount: Math.round(event.ticketPrice * 100),
        currency: 'INR',
        receipt,
        notes: {
            eventId: String(event._id),
            eventTitle: event.title,
            userId: String(req.user.id),
            userEmail: req.user.email
        }
    });

    const booking = await Booking.create({
        userId: req.user.id,
        eventId,
        status: 'pending',
        paymentStatus: 'initiated',
        paymentMethod: 'pending',
        paymentGateway: 'razorpay',
        razorpayOrderId: order.id,
        amount: event.ticketPrice
    });

    await OTP.deleteOne({ _id: validOtp._id });

    return sendSuccess(res, {
        statusCode: 201,
        message: 'Razorpay order created successfully',
        data: {
            key: env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            bookingId: booking._id,
            eventTitle: event.title,
            user: {
                name: req.user.name,
                email: req.user.email
            }
        }
    });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const booking = await Booking.findById(bookingId).populate('eventId').populate('userId', 'name email');
    if (!booking) {
        throw new AppError(404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
    }

    if (String(booking.userId._id) !== String(req.user.id)) {
        throw new AppError(403, 'Not authorized to verify this payment', { code: 'BOOKING_FORBIDDEN' });
    }

    if (booking.razorpayOrderId !== razorpay_order_id) {
        throw new AppError(400, 'Razorpay order mismatch', { code: 'RAZORPAY_ORDER_MISMATCH' });
    }

    const signatureValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        secret: env.RAZORPAY_KEY_SECRET
    });

    if (!signatureValid) {
        await markBookingPaymentFailed(booking, {
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        });
        throw new AppError(400, 'Invalid payment signature', { code: 'RAZORPAY_SIGNATURE_INVALID' });
    }

    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!['captured', 'authorized'].includes(payment.status)) {
        await markBookingPaymentFailed(booking, {
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
            paymentMethod: payment.method || 'unknown',
            paymentDetails: payment
        });
        throw new AppError(400, `Payment is not successful. Current status: ${payment.status}`, {
            code: 'PAYMENT_NOT_SUCCESSFUL'
        });
    }

    if (booking.status !== 'confirmed') {
        const reservedEvent = await reserveSeatForEvent(booking.eventId._id);
        if (!reservedEvent) {
            const { refund, refundProcessed } = await initiateRazorpayRefund({
                booking,
                razorpay,
                paymentId: razorpay_payment_id,
                notes: {
                    reason: 'Seat unavailable after payment'
                },
                failureContext: {
                    paymentId: razorpay_payment_id,
                    signature: razorpay_signature,
                    paymentMethod: payment.method || 'unknown',
                    paymentDetails: payment
                }
            });

            throw new AppError(
                409,
                refundProcessed
                    ? 'Payment received but no seats were available. Refund processed automatically.'
                    : 'Payment received but no seats were available. Refund has been initiated and is awaiting completion.',
                {
                    code: 'SEAT_UNAVAILABLE_AFTER_PAYMENT',
                    details: { refundStatus: refund.status }
                }
            );
        }
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentMethod = payment.method || 'unknown';
    booking.paymentGateway = 'razorpay';
    booking.paymentDetails = payment;
    await booking.save();

    await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

    return sendSuccess(res, {
        message: 'Payment verified successfully',
        data: {
            booking: booking.toObject()
        }
    });
});

exports.markPaymentFailed = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        throw new AppError(404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
    }

    if (String(booking.userId) !== String(req.user.id)) {
        throw new AppError(403, 'Not authorized to update this booking', { code: 'BOOKING_FORBIDDEN' });
    }

    if (booking.paymentGateway !== 'razorpay') {
        return sendSuccess(res, {
            message: 'Ignoring failure update for non-Razorpay booking',
            data: {
                booking: booking.toObject()
            }
        });
    }

    if (booking.paymentStatus === 'paid') {
        return sendSuccess(res, {
            message: 'Ignoring failure update for paid booking',
            data: {
                booking: booking.toObject()
            }
        });
    }

    await markBookingPaymentFailed(booking);

    return sendSuccess(res, {
        message: 'Payment attempt marked as failed',
        data: {
            booking: booking.toObject()
        }
    });
});

exports.refundBookingPayment = asyncHandler(async (req, res) => {
    if (!hasRazorpayConfig()) {
        throw new AppError(503, 'Razorpay is not configured on the server', {
            code: 'RAZORPAY_NOT_CONFIGURED'
        });
    }

    const booking = await Booking.findOneAndUpdate(
        {
            _id: req.params.id,
            razorpayPaymentId: { $ne: null },
            paymentStatus: 'paid'
        },
        { $set: { paymentStatus: 'refund_pending' } },
        { new: true }
    ).populate('eventId').populate('userId', 'name email');

    if (!booking) {
        const existingBooking = await Booking.findById(req.params.id);
        if (!existingBooking) {
            throw new AppError(404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
        }
        if (existingBooking.paymentStatus === 'refund_pending') {
            throw new AppError(409, 'Refund is already in progress for this booking', { code: 'REFUND_IN_PROGRESS' });
        }
        if (existingBooking.paymentStatus === 'refunded') {
            throw new AppError(400, 'This booking has already been refunded', { code: 'BOOKING_ALREADY_REFUNDED' });
        }
        throw new AppError(400, 'This booking does not have a refundable paid transaction', {
            code: 'BOOKING_NOT_REFUNDABLE'
        });
    }

    const razorpay = getRazorpayInstance();
    const wasConfirmed = booking.status === 'confirmed';
    let refund;

    try {
        const result = await initiateRazorpayRefund({
            booking,
            razorpay,
            paymentId: booking.razorpayPaymentId,
            notes: {
                bookingId: String(booking._id),
                eventId: String(booking.eventId?._id || ''),
                userEmail: booking.userId?.email || ''
            }
        });
        refund = result.refund;

        if (result.refundProcessed && wasConfirmed && booking.eventId) {
            await Event.findByIdAndUpdate(booking.eventId._id, { $inc: { availableSeats: 1 } });
        }
    } catch (error) {
        await Booking.findByIdAndUpdate(booking._id, { $set: { paymentStatus: 'paid' } });
        throw error;
    }

    return sendSuccess(res, {
        message: isProcessedRefund(refund)
            ? 'Refund processed successfully'
            : 'Refund initiated successfully and is awaiting completion',
        data: {
            booking: booking.toObject(),
            refund
        }
    });
});

exports.confirmBooking = asyncHandler(async (req, res) => {
    const { paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');

    if (!booking) {
        throw new AppError(404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
    }

    if (booking.status === 'confirmed') {
        throw new AppError(400, 'Booking is already confirmed', { code: 'BOOKING_ALREADY_CONFIRMED' });
    }

    if (booking.paymentGateway === 'razorpay') {
        throw new AppError(400, 'Razorpay bookings must be confirmed through payment verification', {
            code: 'BOOKING_CONFIRMATION_NOT_ALLOWED'
        });
    }

    const event = await Event.findById(booking.eventId._id);
    if (!event || event.availableSeats <= 0) {
        throw new AppError(409, 'No seats available to confirm this booking', {
            code: 'NO_SEATS_AVAILABLE'
        });
    }

    booking.status = 'confirmed';
    if (paymentStatus) {
        booking.paymentStatus = paymentStatus;
    }
    await booking.save();

    event.availableSeats -= 1;
    await event.save();

    await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

    return sendSuccess(res, {
        message: 'Booking confirmed successfully',
        data: {
            booking: booking.toObject()
        }
    });
});

exports.getMyBookings = asyncHandler(async (req, res) => {
    if (req.user.role === 'client') {
        throw new AppError(403, 'Client organizer accounts do not have booking history', {
            code: 'CLIENT_BOOKINGS_DISABLED'
        });
    }

    const filters = req.user.role === 'admin' ? {} : { userId: req.user.id };
    if (req.query.status) {
        filters.status = req.query.status;
    }

    const pagination = parsePagination(req.query);

    const query = Booking.find(filters).sort({ createdAt: -1 });

    if (req.user.role === 'admin') {
        query.populate('eventId').populate('userId', 'name email');
    } else {
        query.populate('eventId');
    }

    if (pagination.enabled) {
        query.skip(pagination.skip).limit(pagination.limit);
    }

    const [bookings, total] = await Promise.all([
        query.lean(),
        pagination.enabled ? Booking.countDocuments(filters) : Promise.resolve(null)
    ]);

    return sendSuccess(res, {
        message: 'Bookings fetched successfully',
        data: bookings,
        pagination: pagination.enabled
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / pagination.limit))
            }
            : null
    });
});

exports.cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        throw new AppError(404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
    }

    if (String(booking.userId) !== String(req.user.id) && req.user.role !== 'admin') {
        throw new AppError(403, 'Not authorized', { code: 'BOOKING_FORBIDDEN' });
    }

    if (booking.status === 'cancelled') {
        throw new AppError(400, 'Booking is already cancelled', { code: 'BOOKING_ALREADY_CANCELLED' });
    }

    if (['paid', 'refund_pending'].includes(booking.paymentStatus)) {
        throw new AppError(400, 'Paid bookings must be refunded by an admin before cancellation', {
            code: 'BOOKING_CANCEL_BLOCKED'
        });
    }

    const wasConfirmed = booking.status === 'confirmed';
    booking.status = 'cancelled';
    await booking.save();

    if (wasConfirmed) {
        await Event.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: 1 } });
    }

    return sendSuccess(res, {
        message: 'Booking cancelled successfully'
    });
});
