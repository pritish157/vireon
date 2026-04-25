import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/axios';
import { AuthContext } from '../context/authContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave, FaArrowLeft } from 'react-icons/fa';
import ShareEvent from '../components/ShareEvent';
import RatingComponent from '../components/RatingComponent';

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
        resolve(true);
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const extractPaymentErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [existingBooking, setExistingBooking] = useState(null);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showFullDescription, setShowFullDescription] = useState(false);

    const markOrderFailed = async (bookingId) => {
        if (!bookingId) {
            return;
        }

        try {
            await api.post(`/bookings/${bookingId}/payment-failed`);
        } catch (statusError) {
            console.error('Failed to mark payment attempt as failed', statusError);
        }
    };

    useEffect(() => {
        if (location.state?.paymentError) {
            setError(location.state.paymentError);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
            } catch (err) {
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    useEffect(() => {
        const fetchExistingBooking = async () => {
            if (!user || !id || user.role === 'client') {
                setExistingBooking(null);
                return;
            }

            try {
                const { data } = await api.get('/bookings/my');
                const currentBooking = data.find((booking) => booking.eventId?._id === id && booking.status !== 'cancelled') || null;
                setExistingBooking(currentBooking);
            } catch (bookingError) {
                console.error('Failed to fetch booking status for event', bookingError);
            }
        };

        fetchExistingBooking();
    }, [user, id]);

    const startRazorpayCheckout = async () => {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setBookingLoading(false);
            setError('Failed to load Razorpay checkout. Please try again.');
            return;
        }

        const { data } = await api.post('/bookings/create-order', {
            eventId: event._id,
            otp: otp.trim()
        });

        const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: 'Vireon',
            description: event.title,
            order_id: data.orderId,
            prefill: {
                name: data.user.name,
                email: data.user.email
            },
            theme: {
                color: '#2563eb'
            },
            handler: async (response) => {
                try {
                    await api.post('/bookings/verify-payment', {
                        bookingId: data.bookingId,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    navigate('/payment-success');
                } catch (verificationError) {
                    await markOrderFailed(data.bookingId);
                    setBookingLoading(false);
                    setShowOTP(false);
                    setOtp('');
                    const paymentError = extractPaymentErrorMessage(verificationError, 'Payment verification failed');
                    setError(paymentError);
                    navigate('/payment-failed', { state: { paymentError } });
                }
            },
            modal: {
                ondismiss: async () => {
                    await markOrderFailed(data.bookingId);
                    setBookingLoading(false);
                    setShowOTP(false);
                    setOtp('');
                    setError('Payment window closed before completion.');
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', async (response) => {
            await markOrderFailed(data.bookingId);
            setBookingLoading(false);
            setShowOTP(false);
            setOtp('');
            const paymentError = response?.error?.description || 'Payment failed';
            setError(paymentError);
            navigate('/payment-failed', { state: { paymentError } });
        });
        razorpay.open();
    };

    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role === 'client') {
            setError('Client organizer accounts cannot book tickets. Please use a user account for bookings.');
            return;
        }

        if (!event) return;

        setBookingLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                setSuccessMsg('OTP sent to your email. Enter it below to continue.');
            } else if (event.ticketPrice > 0) {
                await startRazorpayCheckout();
            } else {
                const { data } = await api.post('/bookings', { eventId: event._id, otp: otp.trim() });
                setSuccessMsg('Free event booked successfully.');
                setShowOTP(false);
                setOtp('');
                setExistingBooking(data.booking);
            }
        } catch (err) {
            setBookingLoading(false);
            const backendMessage = err.response?.data?.message || 'Booking failed';
            setError(backendMessage);
        } finally {
            if (event?.ticketPrice === 0 || !showOTP) {
                setBookingLoading(false);
            }
        }
    };

    if (loading) return <div className="py-20 text-center text-xl font-semibold">Loading...</div>;
    if (error && !event) return <div className="py-20 text-center text-xl text-red-500">{error || 'Event not found'}</div>;

    const isSoldOut = event.availableSeats <= 0;
    const isPaidEvent = event.ticketPrice > 0;
    const isClientAccount = user?.role === 'client';
    const hasActiveBooking = Boolean(existingBooking);
    const bookingStatusLabel = existingBooking?.status === 'confirmed'
        ? 'You already have a confirmed booking for this event.'
        : 'You already have a pending booking for this event.';
    const bookingDisabled = isClientAccount || isSoldOut || hasActiveBooking || bookingLoading || (showOTP && otp.length !== 6);
    const bookingLabel = bookingLoading
        ? 'Processing...'
        : isClientAccount
            ? 'Booking Disabled for Client Account'
            : hasActiveBooking
                ? 'Already Booked'
                : showOTP
                    ? (isPaidEvent ? 'Verify OTP & Pay' : 'Verify OTP & Book')
                    : (successMsg && !showOTP && !isPaidEvent ? 'Booked' : (isSoldOut ? 'Sold Out' : 'Book Now'));
    const descriptionIsLong = String(event.description || '').length > 180;
    const displayedDescription = showFullDescription || !descriptionIsLong
        ? event.description
        : `${String(event.description).slice(0, 180).trim()}...`;

    return (
        <div className="min-h-screen bg-gray-50 py-3 md:py-8">
            <div className="mx-auto max-w-6xl px-4">
                <button
                    onClick={() => navigate('/')}
                    className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-gray-900 md:mb-6 md:text-base md:font-medium"
                >
                    <FaArrowLeft /> Back to Events
                </button>

                <div className="grid gap-8 md:grid-cols-3">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24 }}
                        className="order-2 md:order-1 md:col-span-2"
                    >
                        <div className="mb-6 overflow-hidden rounded-[28px] bg-white shadow-lg md:mb-8 md:rounded-2xl">
                            {event.image ? (
                                <img src={event.image} alt={event.title} loading="lazy" className="h-[260px] w-full object-cover md:h-96" />
                            ) : (
                                <div className="flex h-[260px] w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 text-6xl font-black uppercase tracking-widest text-white/50 md:h-96">
                                    {event.category}
                                </div>
                            )}
                        </div>

                        <div className="mb-6 rounded-[28px] bg-white p-5 shadow-lg md:mb-8 md:rounded-2xl md:p-8">
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="inline-block rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-800">
                                    {event.category}
                                </div>
                            </div>

                            <h1 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-4xl">{event.title}</h1>
                            <div className="mb-8">
                                <p className="text-base leading-relaxed text-gray-600 md:text-lg">{displayedDescription}</p>
                                {descriptionIsLong && (
                                    <button
                                        type="button"
                                        onClick={() => setShowFullDescription((current) => !current)}
                                        className="mt-3 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 md:hidden"
                                    >
                                        {showFullDescription ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>

                            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                                <div className="rounded-2xl bg-gray-50 p-4 md:rounded-xl">
                                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Price</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {event.ticketPrice === 0 ? <span className="text-green-600">Free</span> : `Rs. ${event.ticketPrice}`}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 p-4 md:rounded-xl">
                                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Date</p>
                                    <p className="text-lg font-bold text-gray-900">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 p-4 md:rounded-xl">
                                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Seats Left</p>
                                    <p className={`text-2xl font-bold ${event.availableSeats < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {event.availableSeats}/{event.totalSeats}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 p-4 md:rounded-xl">
                                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Location</p>
                                    <p className="truncate text-sm font-bold text-gray-900">{event.location}</p>
                                    {(event.city || event.district || event.state) && (
                                        <p className="mt-1 text-xs font-medium text-gray-600">
                                            {[event.city, event.district, event.state].filter(Boolean).join(' - ')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="mb-4 text-lg font-bold text-gray-900">Share This Event</h3>
                                <ShareEvent eventId={event._id} eventTitle={event.title} />
                            </div>
                        </div>

                        <div className="rounded-[28px] bg-white p-5 shadow-lg md:rounded-2xl md:p-8">
                            <RatingComponent eventId={event._id} />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.26, delay: 0.04 }}
                        className="order-1 md:order-2 md:col-span-1"
                    >
                        <div className="mb-6 rounded-[28px] bg-white p-5 shadow-lg md:sticky md:top-24 md:rounded-2xl md:p-8">
                            <h3 className="mb-6 text-xl font-bold text-gray-800">Get Your Ticket</h3>

                            <div className="mb-8 space-y-4">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaMoneyBillWave className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-gray-500">Ticket Price</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {event.ticketPrice === 0 ? <span className="text-green-600">Free</span> : `Rs. ${event.ticketPrice}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaChair className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-gray-500">Availability</p>
                                        <p className={`text-lg font-bold ${event.availableSeats < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {event.availableSeats}/{event.totalSeats} seats
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaCalendarAlt className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-gray-500">Event Date</p>
                                        <p className="font-bold text-gray-900">{new Date(event.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaMapMarkerAlt className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-gray-500">Location</p>
                                        <p className="text-sm font-bold text-gray-900">{event.location}</p>
                                        {(event.city || event.district || event.state) && (
                                            <p className="mt-0.5 text-xs font-medium text-gray-500">
                                                {[event.city, event.district, event.state].filter(Boolean).join(' - ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isPaidEvent && !showOTP && (
                                <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                                    Payment for this event will be processed securely through Razorpay after OTP verification.
                                </div>
                            )}

                            {hasActiveBooking && (
                                <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                                    {bookingStatusLabel}
                                </div>
                            )}

                            {isClientAccount && (
                                <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-900">
                                    Client organizer accounts can create and manage events, but cannot book tickets.
                                </div>
                            )}

                            {showOTP && (
                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Enter OTP to Continue</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="6-digit code"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-bold tracking-widest shadow-sm transition focus:ring-2 focus:ring-blue-500"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength="6"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleBooking}
                                disabled={bookingDisabled}
                                className={`mb-4 w-full rounded-2xl px-6 py-4 text-base font-bold transition shadow-lg md:rounded-xl md:py-3 md:text-lg ${
                                    bookingDisabled || (successMsg && !showOTP && !isPaidEvent)
                                        ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
                                }`}
                            >
                                {bookingLabel}
                            </button>

                            {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-600">{error}</p>}
                            {successMsg && <p className="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-600">{successMsg}</p>}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_35px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
                <div className="mx-auto flex max-w-lg items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Ticket</p>
                        <p className="truncate text-lg font-black text-slate-900">
                            {event.ticketPrice === 0 ? 'Free entry' : `Rs. ${event.ticketPrice}`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleBooking}
                        disabled={bookingDisabled}
                        className={`rounded-2xl px-5 py-3 text-sm font-bold shadow-lg transition ${
                            bookingDisabled
                                ? 'bg-slate-200 text-slate-500'
                                : 'bg-slate-900 text-white shadow-slate-900/20 active:scale-[0.98]'
                        }`}
                    >
                        {showOTP ? 'Continue' : 'Book'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
