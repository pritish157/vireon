const { z } = require('zod');
const { objectIdSchema, paginationQuerySchema } = require('./common');

const bookingActionBody = z.object({
    eventId: objectIdSchema,
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
});

const bookingIdParams = z.object({
    id: objectIdSchema
});

const verifyPaymentSchema = {
    body: z.object({
        bookingId: objectIdSchema,
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1)
    })
};

const confirmBookingSchema = {
    params: bookingIdParams,
    body: z.object({
        paymentStatus: z.enum(['paid', 'not_paid']).optional()
    })
};

module.exports = {
    bookEventSchema: { body: bookingActionBody },
    confirmBookingSchema,
    createPaymentOrderSchema: { body: bookingActionBody },
    getMyBookingsSchema: {
        query: paginationQuerySchema.extend({
            status: z.enum(['confirmed', 'cancelled', 'pending']).optional()
        })
    },
    refundBookingSchema: { params: bookingIdParams },
    sendBookingOtpSchema: { body: z.object({}).passthrough() },
    updateBookingFailureSchema: { params: bookingIdParams },
    verifyPaymentSchema,
    cancelBookingSchema: { params: bookingIdParams }
};
