import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle } from 'react-icons/fa';
import LocationSettingsCard from '../components/LocationSettingsCard';
import NearbyEventsSection from '../components/NearbyEventsSection';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [user, navigate]);

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

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading dashboard...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                <div className="w-20 h-20 bg-gray-200 text-gray-900 rounded-full flex items-center justify-center text-3xl font-bold uppercase tracking-widest shrink-0">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex flex-col items-center sm:items-start">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
                    <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> User Dashboard
                    </p>
                </div>
            </div>

            <div className="mb-8">
                <LocationSettingsCard />
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <FaTicketAlt className="text-gray-700" /> My Booking Requests
                </h2>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTicketAlt className="text-gray-300 text-3xl" />
                    </div>
                    <p className="text-xl text-gray-500 mb-6 mt-4 font-medium">You haven't booked any events yet.</p>
                    <Link to="/" className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition shadow-md">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => {
                        const event = getEventDetails(booking);
                        const eventId = getEventId(booking);
                        const canUserCancel = booking.status !== 'cancelled'
                            && booking.paymentStatus !== 'paid'
                            && booking.paymentStatus !== 'refund_pending';

                        return (
                            <div key={booking._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col">
                                <div className="p-6 border-b border-gray-50 flex-grow">
                                    {event ? (
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h3>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                        booking.status === 'confirmed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : booking.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                    {booking.status !== 'cancelled' && (
                                                        <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                            booking.paymentStatus === 'paid'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {booking.paymentStatus.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 mb-4 space-y-1">
                                                <p><strong className="text-gray-700">Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                                <p><strong className="text-gray-700">Amount:</strong> {booking.amount === 0 ? 'Free' : `Rs. ${booking.amount}`}</p>
                                                <p><strong className="text-gray-700">Method:</strong> {booking.paymentMethod || 'N/A'}</p>
                                                <p><strong className="text-gray-700">Gateway:</strong> {booking.paymentGateway || 'N/A'}</p>
                                                <p><strong className="text-gray-700">Requested:</strong> {new Date(booking.bookedAt).toLocaleDateString()}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-red-500 italic">Event details unavailable.</p>
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 flex justify-between items-center shrink-0">
                                    {eventId && booking.status !== 'cancelled' ? (
                                        <>
                                            <button
                                                onClick={() => navigate(`/events/${eventId}`)}
                                                className="text-gray-900 font-semibold text-sm hover:underline"
                                            >
                                                View Event
                                            </button>
                                            {canUserCancel ? (
                                                <button
                                                    onClick={() => cancelBooking(booking._id)}
                                                    className="text-red-500 font-semibold text-sm hover:text-red-700 transition flex items-center gap-1"
                                                >
                                                    <FaTimesCircle /> Cancel
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-500 text-right">
                                                    Contact admin for refund/cancellation
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-sm text-gray-500 italic">Booking Cancelled</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <NearbyEventsSection description="Fresh event suggestions matched to the city saved in your profile." />
        </div>
    );
};

export default UserDashboard;
