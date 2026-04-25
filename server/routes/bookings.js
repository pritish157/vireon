const express = require('express');
const router = express.Router();
const {
    bookEvent,
    createPaymentOrder,
    verifyPayment,
    markPaymentFailed,
    refundBookingPayment,
    confirmBooking,
    getMyBookings,
    cancelBooking,
    sendBookingOTP
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    bookEventSchema,
    cancelBookingSchema,
    confirmBookingSchema,
    createPaymentOrderSchema,
    getMyBookingsSchema,
    refundBookingSchema,
    sendBookingOtpSchema,
    updateBookingFailureSchema,
    verifyPaymentSchema
} = require('../validators/bookingValidators');

router.post('/send-otp', protect, validate(sendBookingOtpSchema), sendBookingOTP);
router.post('/', protect, validate(bookEventSchema), bookEvent);
router.post('/create-order', protect, validate(createPaymentOrderSchema), createPaymentOrder);
router.post('/verify-payment', protect, validate(verifyPaymentSchema), verifyPayment);
router.post('/:id/payment-failed', protect, validate(updateBookingFailureSchema), markPaymentFailed);
router.put('/:id/confirm', protect, admin, validate(confirmBookingSchema), confirmBooking);
router.post('/:id/refund', protect, admin, validate(refundBookingSchema), refundBookingPayment);
router.get('/my', protect, validate(getMyBookingsSchema), getMyBookings);
router.delete('/:id', protect, validate(cancelBookingSchema), cancelBooking);

module.exports = router;
