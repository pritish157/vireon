import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
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
            if (!user || !id) {
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

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;
    if (error && !event) return <div className="text-center py-20 text-xl text-red-500">{error || 'Event not found'}</div>;

    const isSoldOut = event.availableSeats <= 0;
    const isPaidEvent = event.ticketPrice > 0;
    const hasActiveBooking = Boolean(existingBooking);
    const bookingStatusLabel = existingBooking?.status === 'confirmed'
        ? 'You already have a confirmed booking for this event.'
        : 'You already have a pending booking for this event.';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition"
                >
                    <FaArrowLeft /> Back to Events
                </button>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <div className="rounded-2xl overflow-hidden shadow-lg bg-white mb-8">
                            {event.image ? (
                                <img src={event.image} alt={event.title} className="w-full h-96 object-cover" />
                            ) : (
                                <div className="w-full h-96 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">
                                    {event.category}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide">
                                    {event.category}
                                </div>
                            </div>

                            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">{event.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Price</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {event.ticketPrice === 0 ? <span className="text-green-600">Free</span> : `Rs. ${event.ticketPrice}`}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</p>
                                    <p className="text-lg font-bold text-gray-900">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Seats Left</p>
                                    <p className={`text-2xl font-bold ${event.availableSeats < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {event.availableSeats}/{event.totalSeats}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{event.location}</p>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold mb-4 text-gray-900">Share This Event</h3>
                                <ShareEvent eventId={event._id} eventTitle={event.title} />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <RatingComponent eventId={event._id} />
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Get Your Ticket</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaMoneyBillWave className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Ticket Price</p>
                                        <p className="font-bold text-gray-900 text-lg">
                                            {event.ticketPrice === 0 ? <span className="text-green-600">Free</span> : `Rs. ${event.ticketPrice}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaChair className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Availability</p>
                                        <p className={`font-bold text-lg ${event.availableSeats < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {event.availableSeats}/{event.totalSeats} seats
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaCalendarAlt className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Event Date</p>
                                        <p className="font-bold text-gray-900">{new Date(event.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-600">
                                    <FaMapMarkerAlt className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                                        <p className="font-bold text-gray-900 text-sm">{event.location}</p>
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

                            {showOTP && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP to Continue</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="6-digit code"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition shadow-sm font-bold tracking-widest text-center text-lg"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength="6"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleBooking}
                                disabled={isSoldOut || hasActiveBooking || bookingLoading || (showOTP && otp.length !== 6)}
                                className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition shadow-lg mb-4 ${
                                    isSoldOut || hasActiveBooking || (successMsg && !showOTP && !isPaidEvent)
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl'
                                }`}
                            >
                                {bookingLoading ? 'Processing...' : (
                                    hasActiveBooking
                                        ? 'Already Booked'
                                        : showOTP
                                        ? (isPaidEvent ? 'Verify OTP & Pay' : 'Verify OTP & Book')
                                        : (successMsg && !showOTP && !isPaidEvent ? 'Booked' : (isSoldOut ? 'Sold Out' : 'Book Now'))
                                )}
                            </button>

                            {error && <p className="text-red-600 text-sm text-center mb-4 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
                            {successMsg && <p className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg font-medium">{successMsg}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
