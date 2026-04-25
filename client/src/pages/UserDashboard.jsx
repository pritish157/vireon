import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/authContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle } from 'react-icons/fa';
import LocationSettingsCard from '../components/LocationSettingsCard';
import NearbyEventsSection from '../components/NearbyEventsSection';
import useIsMobileViewport from '../hooks/useIsMobileViewport';
import MobileUserDashboardView from '../components/mobile/MobileUserDashboardView';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMobile = useIsMobileViewport();

    useEffect(() => {
        if (isMobile) {
            return;
        }
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'client') {
            navigate('/client/dashboard');
            return;
        }
        if (user.role === 'admin') {
            navigate('/admin');
            return;
        }
        fetchBookings();
    }, [isMobile, user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchBookings();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    const getEventId = (booking) => {
        if (!booking?.eventId) return null;
        return typeof booking.eventId === 'string' ? booking.eventId : booking.eventId._id;
    };

    const getEventDetails = (booking) => {
        if (!booking?.eventId || typeof booking.eventId === 'string') {
            return null;
        }
        return booking.eventId;
    };

    if (isMobile) {
        return <MobileUserDashboardView />;
    }

    if (loading) return <div className="py-20 text-center text-xl font-semibold">Loading dashboard...</div>;

    return (
        <div className="mx-auto max-w-6xl">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
                className="mb-5 rounded-[28px] bg-slate-950 p-5 text-white shadow-xl md:hidden"
            >
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">My account</p>
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white/10 text-2xl font-black uppercase">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-black">Welcome, {user?.name}!</h1>
                        <p className="mt-1 text-sm text-white/65">Your mobile booking hub with quick access to recent tickets.</p>
                    </div>
                </div>
            </motion.div>

            <div className="mb-8 hidden flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:flex sm:p-8 md:flex-row md:items-start md:gap-6 md:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-200 text-3xl font-bold uppercase tracking-widest text-gray-900">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <h1 className="mb-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">Welcome, {user?.name}!</h1>
                    <p className="flex items-center justify-center gap-2 text-gray-500 md:justify-start">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span> User Dashboard
                    </p>
                </div>
            </div>

            <div className="mb-6 md:mb-8">
                <LocationSettingsCard />
            </div>

            <div className="mb-5 flex items-center justify-between md:mb-6">
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 sm:gap-3 sm:text-2xl">
                    <FaTicketAlt className="text-gray-700" /> My Booking Requests
                </h2>
            </div>

            {bookings.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
                        <FaTicketAlt className="text-3xl text-gray-300" />
                    </div>
                    <p className="mt-4 mb-6 text-xl font-medium text-gray-500">You haven't booked any events yet.</p>
                    <Link to="/" className="inline-block rounded-lg bg-gray-900 px-8 py-3 font-bold text-white shadow-md transition hover:bg-black">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                    {bookings.map((booking) => {
                        const event = getEventDetails(booking);
                        const eventId = getEventId(booking);
                        const canUserCancel = booking.status !== 'cancelled'
                            && booking.paymentStatus !== 'paid'
                            && booking.paymentStatus !== 'refund_pending';

                        return (
                            <motion.div
                                key={booking._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/95 shadow-[0_16px_42px_rgba(15,23,42,0.08)] transition hover:shadow-md md:rounded-xl"
                            >
                                <div className="flex-grow border-b border-gray-50 p-5 md:p-6">
                                    {event ? (
                                        <>
                                            <div className="mb-4 flex items-start justify-between">
                                                <h3 className="text-lg font-bold leading-tight text-gray-900">{event.title}</h3>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                                                        booking.status === 'confirmed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : booking.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                    {booking.status !== 'cancelled' && (
                                                        <span className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                                                            booking.paymentStatus === 'paid'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {booking.paymentStatus.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mb-4 space-y-1 text-sm text-gray-500">
                                                <p><strong className="text-gray-700">Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                                <p><strong className="text-gray-700">Amount:</strong> {booking.amount === 0 ? 'Free' : `Rs. ${booking.amount}`}</p>
                                                <p><strong className="text-gray-700">Method:</strong> {booking.paymentMethod || 'N/A'}</p>
                                                <p><strong className="text-gray-700">Gateway:</strong> {booking.paymentGateway || 'N/A'}</p>
                                                <p><strong className="text-gray-700">Requested:</strong> {new Date(booking.bookedAt).toLocaleDateString()}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="italic text-red-500">Event details unavailable.</p>
                                    )}
                                </div>
                                <div className="flex shrink-0 flex-col gap-3 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    {eventId && booking.status !== 'cancelled' ? (
                                        <>
                                            <button
                                                onClick={() => navigate(`/events/${eventId}`)}
                                                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100 sm:rounded-lg sm:px-0 sm:py-0 sm:shadow-none sm:hover:bg-transparent sm:hover:underline"
                                            >
                                                View Event
                                            </button>
                                            {canUserCancel ? (
                                                <button
                                                    onClick={() => cancelBooking(booking._id)}
                                                    className="flex items-center justify-center gap-1 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-rose-100 hover:text-red-700 sm:rounded-lg sm:bg-transparent sm:px-0 sm:py-0"
                                                >
                                                    <FaTimesCircle /> Cancel
                                                </button>
                                            ) : (
                                                <span className="text-right text-xs text-gray-500">
                                                    Contact admin for refund/cancellation
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-sm italic text-gray-500">Booking Cancelled</div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <NearbyEventsSection description="Fresh event suggestions matched to the city saved in your profile." />
        </div>
    );
};

export default UserDashboard;
