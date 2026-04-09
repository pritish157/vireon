const express = require('express');
const router = express.Router();
const { bookEvent, createPaymentOrder, verifyPayment, markPaymentFailed, refundBookingPayment, confirmBooking, getMyBookings, cancelBooking, sendBookingOTP } = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

router.post('/send-otp', protect, sendBookingOTP);
router.post('/', protect, bookEvent);
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/:id/payment-failed', protect, markPaymentFailed);
router.put('/:id/confirm', protect, admin, confirmBooking);
router.post('/:id/refund', protect, admin, refundBookingPayment);
router.get('/my', protect, getMyBookings);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
