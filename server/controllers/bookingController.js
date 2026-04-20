const crypto = require('crypto');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');
const { getRazorpayInstance, hasRazorpayConfig } = require('../utils/razorpay');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const verifyBookingOTP = async (email, otp) => {
    if (!otp || !/^\d{6}$/.test(otp)) {
        return null;
    }
    return OTP.findOne({ email, otp, action: 'event_booking' });
};

const reserveSeatForEvent = async (eventId) => {
    return Event.findOneAndUpdate(
        { _id: eventId, availableSeats: { $gt: 0 } },
        { $inc: { availableSeats: -1 } },
        { new: true }
    );
};

const releaseReservedSeat = async (eventId) => {
    await Event.findByIdAndUpdate(eventId, { $inc: { availableSeats: 1 } });
};

const ensureEventBookable = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) {
        return { error: { status: 404, message: 'Event not found' } };
    }

    if (event.availableSeats <= 0) {
        return { error: { status: 400, message: 'No seats available' } };
    }

    const existingBooking = await Booking.findOne({
        userId,
        eventId,
        status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 });

    if (existingBooking) {
        const isUnpaidRazorpayAttempt = existingBooking.paymentGateway === 'razorpay' && existingBooking.paymentStatus !== 'paid';

        if (isUnpaidRazorpayAttempt) {
            existingBooking.status = 'cancelled';
            if (existingBooking.paymentStatus === 'initiated' || existingBooking.paymentStatus === 'not_paid') {
                existingBooking.paymentStatus = 'failed';
            }
            await existingBooking.save();
        } else {
            const duplicateMessage = existingBooking.status === 'confirmed'
                ? 'You already have a confirmed booking for this event'
                : 'You already have a pending booking for this event';
            return {
                error: {
                    status: 400,
                    message: duplicateMessage,
                    code: 'BOOKING_ALREADY_EXISTS'
                }
            };
        }
    }

    return { event };
};

const markBookingPaymentFailed = async (booking, extras = {}) => {
    booking.status = 'cancelled';
    booking.paymentStatus = 'failed';

    if (extras.paymentId) {
        booking.razorpayPaymentId = extras.paymentId;
    }

    if (extras.signature) {
        booking.razorpaySignature = extras.signature;
    }

    if (extras.paymentMethod) {
        booking.paymentMethod = extras.paymentMethod;
    }

    if (extras.paymentDetails) {
        booking.paymentDetails = extras.paymentDetails;
    }

    await booking.save();
};

const isProcessedRefund = (refund) => refund?.status === 'processed';

const initiateRazorpayRefund = async ({ booking, razorpay, paymentId, notes, failureContext }) => {
    const refund = await razorpay.payments.refund(paymentId, { notes });
    const refundProcessed = isProcessedRefund(refund);

    booking.status = 'cancelled';
    booking.paymentStatus = refundProcessed ? 'refunded' : 'refund_pending';
    booking.refundDetails = refund;

    if (failureContext?.paymentId) {
        booking.razorpayPaymentId = failureContext.paymentId;
    }

    if (failureContext?.signature) {
        booking.razorpaySignature = failureContext.signature;
    }

    if (failureContext?.paymentMethod) {
        booking.paymentMethod = failureContext.paymentMethod;
    }

    if (failureContext?.paymentDetails) {
        booking.paymentDetails = failureContext.paymentDetails;
    }

    await booking.save();

    return { refund, refundProcessed };
};

const ensureBookingAllowedForRole = (req, res) => {
    if (req.user.role === 'client') {
        res.status(403).json({
            message: 'Client organizer accounts cannot book events. Please use a user account.'
        });
        return false;
    }
    return true;
};

exports.sendBookingOTP = async (req, res) => {
    try {
        if (!ensureBookingAllowedForRole(req, res)) {
            return;
        }

        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        if (!ensureBookingAllowedForRole(req, res)) {
            return;
        }

        const { eventId, otp } = req.body;

        if (!eventId || !otp) {
            return res.status(400).json({ message: 'Event ID and OTP are required' });
        }

        const validOTP = await verifyBookingOTP(req.user.email, otp);
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const { event, error } = await ensureEventBookable(eventId, req.user.id);
        if (error) {
            return res.status(error.status).json({ message: error.message, code: error.code });
        }

        if (event.ticketPrice > 0) {
            return res.status(400).json({ message: 'Paid events must be completed through Razorpay checkout' });
        }

        const reservedEvent = await reserveSeatForEvent(eventId);
        if (!reservedEvent) {
            return res.status(400).json({ message: 'No seats available' });
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
        } catch (bookingError) {
            await releaseReservedSeat(eventId);
            throw bookingError;
        }

        await OTP.deleteOne({ _id: validOTP._id });

        res.status(201).json({ message: 'Free event booked successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createPaymentOrder = async (req, res) => {
    try {
        if (!ensureBookingAllowedForRole(req, res)) {
            return;
        }

        if (!hasRazorpayConfig()) {
            return res.status(500).json({ message: 'Razorpay is not configured on the server' });
        }

        const { eventId, otp } = req.body;

        if (!eventId || !otp) {
            return res.status(400).json({ message: 'Event ID and OTP are required' });
        }

        const validOTP = await verifyBookingOTP(req.user.email, otp);
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const { event, error } = await ensureEventBookable(eventId, req.user.id);
        if (error) {
            return res.status(error.status).json({ message: error.message, code: error.code });
        }

        if (event.ticketPrice <= 0) {
            return res.status(400).json({ message: 'Free events do not require a Razorpay order' });
        }

        const razorpay = getRazorpayInstance();
        const receipt = `booking_${Date.now()}_${req.user.id.toString().slice(-6)}`;
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

        await OTP.deleteOne({ _id: validOTP._id });

        res.status(201).json({
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            bookingId: booking._id,
            eventTitle: event.title,
            user: {
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create Razorpay order', error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing Razorpay payment verification data' });
        }

        const booking = await Booking.findById(bookingId).populate('eventId').populate('userId', 'name email');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (String(booking.userId._id) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to verify this payment' });
        }

        if (booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ message: 'Razorpay order mismatch' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await markBookingPaymentFailed(booking, {
                paymentId: razorpay_payment_id,
                signature: razorpay_signature
            });
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const razorpay = getRazorpayInstance();
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (payment.status !== 'captured' && payment.status !== 'authorized') {
            await markBookingPaymentFailed(booking, {
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                paymentMethod: payment.method || 'unknown',
                paymentDetails: payment
            });
            return res.status(400).json({ message: `Payment is not successful. Current status: ${payment.status}` });
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
                const message = refundProcessed
                    ? 'Payment received but no seats were available. Refund processed automatically.'
                    : 'Payment received but no seats were available. Refund has been initiated and is awaiting completion.';
                return res.status(409).json({ message, refundStatus: refund.status });
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

        res.json({ message: 'Payment verified successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

exports.markPaymentFailed = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (String(booking.userId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to update this booking' });
        }

        if (booking.paymentGateway !== 'razorpay') {
            return res.json({ message: 'Ignoring failure update for non-Razorpay booking', booking });
        }

        if (booking.paymentStatus === 'paid') {
            return res.json({ message: 'Ignoring failure update for paid booking', booking });
        }

        await markBookingPaymentFailed(booking);
        res.json({ message: 'Payment attempt marked as failed', booking });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update payment status', error: error.message });
    }
};

exports.refundBookingPayment = async (req, res) => {
    try {
        if (!hasRazorpayConfig()) {
            return res.status(500).json({ message: 'Razorpay is not configured on the server' });
        }

        const booking = await Booking.findOneAndUpdate(
            {
                _id: req.params.id,
                razorpayPaymentId: { $ne: null },
                paymentStatus: 'paid'
            },
            {
                $set: { paymentStatus: 'refund_pending' }
            },
            {
                new: true
            }
        ).populate('eventId').populate('userId', 'name email');

        if (!booking) {
            const existingBooking = await Booking.findById(req.params.id);
            if (!existingBooking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            if (existingBooking.paymentStatus === 'refund_pending') {
                return res.status(409).json({ message: 'Refund is already in progress for this booking' });
            }

            if (existingBooking.paymentStatus === 'refunded') {
                return res.status(400).json({ message: 'This booking has already been refunded' });
            }

            return res.status(400).json({ message: 'This booking does not have a refundable paid transaction' });
        }

        const razorpay = getRazorpayInstance();
        let refund;
        const wasConfirmed = booking.status === 'confirmed';

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
                const event = await Event.findById(booking.eventId._id);
                if (event) {
                    event.availableSeats += 1;
                    await event.save();
                }
            }
        } catch (error) {
            await Booking.findByIdAndUpdate(booking._id, {
                $set: {
                    paymentStatus: 'paid'
                }
            });
            throw error;
        }

        const message = isProcessedRefund(refund)
            ? 'Refund processed successfully'
            : 'Refund initiated successfully and is awaiting completion';

        res.json({ message, booking, refund });
    } catch (error) {
        res.status(500).json({ message: 'Refund failed', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') return res.status(400).json({ message: 'Booking is already confirmed' });
        if (booking.paymentGateway === 'razorpay') {
            return res.status(400).json({ message: 'Razorpay bookings must be confirmed through payment verification' });
        }

        const event = await Event.findById(booking.eventId._id);
        if (!event || event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }
        await booking.save();

        event.availableSeats -= 1;
        await event.save();

        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        if (req.user.role === 'client') {
            return res.status(403).json({ message: 'Client organizer accounts do not have booking history' });
        }

        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });
        if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refund_pending') {
            return res.status(400).json({ message: 'Paid bookings must be refunded by an admin before cancellation' });
        }

        const wasConfirmed = booking.status === 'confirmed';
        booking.status = 'cancelled';
        await booking.save();

        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
