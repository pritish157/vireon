import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/authContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import EventRegionFields from '../components/EventRegionFields';
import useIsMobileViewport from '../hooks/useIsMobileViewport';
import MobileAdminDashboardView from '../components/mobile/MobileAdminDashboardView';

const initialFormData = {
    title: '',
    description: '',
    date: '',
    stateCode: '',
    district: '',
    city: '',
    location: '',
    country: 'India',
    category: '',
    totalSeats: '',
    ticketPrice: '',
    image: ''
};

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const isLocalImageData = (value) => String(value || '').startsWith('data:image/');

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [clientRequests, setClientRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [selectedImageName, setSelectedImageName] = useState('');
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const isMobile = useIsMobileViewport();

    useEffect(() => {
        if (isMobile) {
            return;
        }
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [isMobile, user, navigate]);

    const fetchData = async () => {
        try {
            const [eventsRes, bookingsRes, clientRequestsRes] = await Promise.all([
                api.get('/events'),
                api.get('/bookings/my'),
                api.get('/client/events/requests')
            ]);
            setEvents(eventsRes.data);
            setBookings(bookingsRes.data);
            setClientRequests(clientRequestsRes.data);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const resetEventForm = () => {
        setShowEventForm(false);
        setEditingEventId(null);
        setFormData(initialFormData);
        setSelectedImageName('');
    };

    const openNewEventForm = () => {
        setEditingEventId(null);
        setFormData(initialFormData);
        setSelectedImageName('');
        setShowEventForm(true);
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            alert('Image must be 4MB or smaller.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const fileDataUrl = typeof reader.result === 'string' ? reader.result : '';
            if (!fileDataUrl) {
                alert('Failed to read image file.');
                return;
            }
            setFormData((prev) => ({ ...prev, image: fileDataUrl }));
            setSelectedImageName(file.name);
        };
        reader.onerror = () => {
            alert('Failed to read image file.');
        };
        reader.readAsDataURL(file);
    };

    const clearSelectedImage = () => {
        setFormData((prev) => ({ ...prev, image: '' }));
        setSelectedImageName('');
    };

    const handleCreateOrUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            if (editingEventId) {
                await api.put(`/events/${editingEventId}`, formData);
            } else {
                await api.post('/events', formData);
            }
            resetEventForm();
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || `Error ${editingEventId ? 'updating' : 'creating'} event`);
        }
    };

    const handleEditEvent = (event) => {
        setEditingEventId(event._id);
        setFormData({
            title: event.title || '',
            description: event.description || '',
            date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
            stateCode: event.stateCode || '',
            district: event.district || '',
            city: event.city || '',
            location: event.location || '',
            country: event.country || 'India',
            category: event.category || '',
            totalSeats: String(event.totalSeats ?? ''),
            ticketPrice: String(event.ticketPrice ?? ''),
            image: event.image || ''
        });
        setSelectedImageName(isLocalImageData(event.image) ? 'Previously uploaded image' : '');
        setShowEventForm(true);
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/events/${id}`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Error deleting event');
            }
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error confirming booking');
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Cancel this booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    const handleRefundBooking = async (id) => {
        if (window.confirm('Process a Razorpay refund for this booking?')) {
            try {
                await api.post(`/bookings/${id}/refund`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Error processing refund');
            }
        }
    };

    const openReviewModal = (request, action) => {
        setReviewModal({ request, action });
        setReviewNote('');
        setReviewError('');
    };

    const closeReviewModal = () => {
        if (reviewBusy) return;
        setReviewModal(null);
        setReviewNote('');
        setReviewError('');
    };

    const submitClientRequestReview = async () => {
        if (!reviewModal) return;
        setReviewBusy(true);
        setReviewError('');
        const { request, action } = reviewModal;
        const body = { status: action === 'approve' ? 'APPROVED' : 'REJECTED' };
        const note = reviewNote.trim();
        if (note) body.reviewNote = note;

        try {
            await api.post(`/client/events/requests/${request._id}/review`, body);
            setReviewModal(null);
            setReviewNote('');
            fetchData();
        } catch (error) {
            const data = error.response?.data;
            const msg = data?.message || error.message || 'Could not complete this action';
            const detail =
                Array.isArray(data?.errors) && data.errors.length > 0
                    ? ` ${data.errors.slice(0, 4).join(' | ')}`
                    : '';
            setReviewError(`${msg}${detail}`);
        } finally {
            setReviewBusy(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-xl font-semibold">Loading admin panel...</div>;

    if (isMobile) {
        return <MobileAdminDashboardView />;
    }

    return (
        <div className="mx-auto max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
                className="mb-5 rounded-[28px] bg-black p-5 text-white shadow-lg md:mb-8 md:rounded-2xl md:p-8"
            >
                <div className="flex flex-col gap-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
                    <div>
                        <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">Admin Dashboard</h1>
                        <p className="text-gray-300">Manage events, payments, and refunds.</p>
                    </div>
                    <button
                        onClick={() => (showEventForm ? resetEventForm() : openNewEventForm())}
                        className="w-full rounded-lg bg-white px-6 py-3 font-bold text-black shadow-md transition hover:bg-gray-100 md:w-auto"
                    >
                        {showEventForm ? 'Close Form' : '+ Create New Event'}
                    </button>
                </div>
            </motion.div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div>
                        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">Total Revenue</p>
                        <h3 className="text-3xl font-black text-green-600">Rs. {bookings.reduce((sum, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + b.amount : sum, 0)}</h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-500">Rs</div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div>
                        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">Paid Clients</p>
                        <h3 className="text-3xl font-black text-blue-600">{new Set(bookings.filter((b) => b.paymentStatus === 'paid' && b.status === 'confirmed').map((b) => b.userId?._id)).size}</h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-500">U</div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div>
                        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">Refunded</p>
                        <h3 className="text-3xl font-black text-red-600">{bookings.filter((b) => b.paymentStatus === 'refunded').length}</h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-500">R</div>
                </div>
            </div>

            <div className="mb-8 rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm md:rounded-2xl md:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Client Event Approval Requests</h2>
                    <span className="text-sm font-bold text-gray-500">{clientRequests.length} total</span>
                </div>
                {clientRequests.length === 0 ? (
                    <p className="text-gray-500">No client requests available.</p>
                ) : (
                    <ul className="max-h-[380px] divide-y divide-gray-100 overflow-y-auto">
                        {clientRequests.map((request) => (
                            <li key={request._id} className="flex flex-col gap-3 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            {request.proposedEventData?.title || request.eventId?.title || 'Untitled Event'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            <strong>Client:</strong> {request.submittedBy?.name} ({request.submittedBy?.email})
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Request:</strong> {request.requestType === 'edit' ? 'Edit Event' : 'New Event Registration'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}
                                        </p>
                                        {request.requestType === 'edit' && request.editRequestReason && (
                                            <p className="mt-2 rounded border border-blue-100 bg-blue-50 p-2 text-sm text-gray-700">
                                                <strong>Client Edit Note:</strong> {request.editRequestReason}
                                            </p>
                                        )}
                                        {request.reviewNote && (
                                            <p className="mt-2 rounded border border-gray-100 bg-gray-50 p-2 text-sm text-gray-700">
                                                <strong>Review Note:</strong> {request.reviewNote}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`self-start rounded px-3 py-1 text-xs font-black uppercase tracking-wider ${
                                        request.status === 'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : request.status === 'rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {request.status}
                                    </span>
                                </div>

                                {request.status === 'pending' && request.proposedEventData && (
                                    <div className="space-y-1 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 text-xs text-gray-600">
                                        {request.proposedEventData.date && (
                                            <p>
                                                <span className="font-semibold text-gray-700">Date:</span>{' '}
                                                {new Date(request.proposedEventData.date).toLocaleString()}
                                            </p>
                                        )}
                                        {(request.proposedEventData.location || request.proposedEventData.city) && (
                                            <p>
                                                <span className="font-semibold text-gray-700">Venue:</span>{' '}
                                                {[request.proposedEventData.location, request.proposedEventData.city].filter(Boolean).join(' - ')}
                                            </p>
                                        )}
                                        {request.proposedEventData.totalSeats != null && (
                                            <p>
                                                <span className="font-semibold text-gray-700">Seats / price:</span>{' '}
                                                {request.proposedEventData.totalSeats} seats
                                                {request.proposedEventData.ticketPrice != null
                                                    ? ` - Rs. ${request.proposedEventData.ticketPrice}`
                                                    : ''}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {request.status === 'pending' && (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openReviewModal(request, 'approve')}
                                            className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-bold text-green-700 transition hover:bg-green-600 hover:text-white"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openReviewModal(request, 'reject')}
                                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-600 hover:text-white"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {showEventForm && (
                <div className="mb-8 rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm md:rounded-2xl md:p-8">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">{editingEventId ? 'Edit Event' : 'Create New Event'}</h2>
                    <form onSubmit={handleCreateOrUpdateEvent} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <input required type="text" placeholder="Event Title" className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                        <input required type="text" placeholder="Category" className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                        <input required type="date" className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                        <EventRegionFields formData={formData} setFormData={setFormData} />
                        <input required min="1" step="1" type="number" placeholder="Total Seats" className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700" value={formData.totalSeats} onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })} />
                        <input required min="0" step="1" type="number" placeholder="Ticket Price (0 for free)" className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700" value={formData.ticketPrice} onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })} />
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Image URL (optional if uploading from local storage)"
                                className="w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700"
                                value={isLocalImageData(formData.image) ? '' : formData.image}
                                onChange={(e) => {
                                    setFormData({ ...formData, image: e.target.value });
                                    setSelectedImageName('');
                                }}
                            />
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageFileChange}
                                    className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-700 hover:file:bg-gray-200"
                                />
                                {formData.image && (
                                    <button
                                        type="button"
                                        onClick={clearSelectedImage}
                                        className="rounded-lg bg-gray-100 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-200 sm:w-auto"
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>
                            {selectedImageName && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Local image selected: <span className="font-semibold">{selectedImageName}</span>
                                </p>
                            )}
                            {formData.image && (
                                <img
                                    src={formData.image}
                                    alt="Event preview"
                                    className="mt-3 h-40 w-full max-w-xs rounded-lg border border-gray-200 object-cover"
                                />
                            )}
                        </div>
                        <textarea required placeholder="Event Description" className="h-32 rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700 md:col-span-2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        <div className="mt-2 flex flex-col gap-3 md:col-span-2 sm:flex-row">
                            <button type="submit" className="flex-1 rounded-lg bg-gray-900 py-3 font-bold text-white shadow-md transition hover:bg-black">
                                {editingEventId ? 'Save Changes' : 'Publish Event'}
                            </button>
                            {editingEventId && (
                                <button
                                    type="button"
                                    onClick={resetEventForm}
                                    className="rounded-lg bg-gray-100 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-200 sm:w-auto"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="flex flex-col">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">All Events</h2>
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <ul className="max-h-[600px] divide-y divide-gray-100 overflow-y-auto">
                            {events.length === 0 ? <li className="p-6 text-center text-gray-500">No events created yet.</li> :
                                events.map((event) => (
                                    <li key={event._id} className="flex flex-col items-start gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h4 className="mb-1 font-bold leading-tight text-gray-900">{event.title}</h4>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <span>{new Date(event.date).toLocaleDateString()}</span>
                                                <span>{event.category}</span>
                                                <span>Rs. {event.ticketPrice}</span>
                                                <span>{event.availableSeats}/{event.totalSeats} seats</span>
                                            </div>
                                            {(event.state || event.district || event.city) && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {[event.city, event.district, event.state].filter(Boolean).join(' - ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex w-full gap-2 sm:w-auto">
                                            <button onClick={() => handleEditEvent(event)} className="flex-1 rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white sm:flex-none">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteEvent(event._id)} className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-500 hover:text-white sm:flex-none">
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">Booking Payments</h2>
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <ul className="max-h-[700px] divide-y divide-gray-100 overflow-y-auto">
                            {bookings.length === 0 ? <li className="p-6 text-center text-gray-500">No bookings yet.</li> :
                                bookings.map((booking) => (
                                    <li key={booking._id} className={`border-l-4 p-6 transition hover:bg-gray-50 ${
                                        booking.paymentStatus === 'paid'
                                            ? 'border-l-green-400'
                                            : booking.paymentStatus === 'refunded'
                                                ? 'border-l-red-400'
                                                : 'border-l-yellow-400'
                                    }`}>
                                        <div className="mb-3 flex items-start justify-between">
                                            <h4 className="text-lg font-bold leading-tight text-gray-900">{booking.eventId?.title || 'Deleted Event'}</h4>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-700">{booking.status}</span>
                                                <span className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                                                    booking.paymentStatus === 'paid'
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : booking.paymentStatus === 'refund_pending'
                                                            ? 'bg-orange-100 text-orange-700'
                                                        : booking.paymentStatus === 'refunded'
                                                            ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {booking.paymentStatus.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-3 space-y-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                                            <p><strong>User:</strong> {booking.userId?.name} ({booking.userId?.email})</p>
                                            <p><strong>Amount:</strong> {booking.amount === 0 ? 'Free' : `Rs. ${booking.amount}`}</p>
                                            <p><strong>Gateway:</strong> {booking.paymentGateway || 'none'}</p>
                                            <p><strong>Method:</strong> {booking.paymentMethod || 'N/A'}</p>
                                            {booking.razorpayOrderId && <p><strong>Order ID:</strong> <span className="break-all">{booking.razorpayOrderId}</span></p>}
                                            {booking.razorpayPaymentId && <p><strong>Payment ID:</strong> <span className="break-all">{booking.razorpayPaymentId}</span></p>}
                                            {booking.refundDetails?.id && <p><strong>Refund ID:</strong> <span className="break-all">{booking.refundDetails.id}</span></p>}
                                            {booking.paymentDetails?.email && <p><strong>Payer Email:</strong> {booking.paymentDetails.email}</p>}
                                            {booking.paymentDetails?.contact && <p><strong>Payer Contact:</strong> {booking.paymentDetails.contact}</p>}
                                            <p><strong>Requested:</strong> {new Date(booking.bookedAt).toLocaleString()}</p>
                                        </div>

                                        {booking.status === 'pending' && booking.paymentStatus !== 'paid' && booking.paymentGateway !== 'razorpay' && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="min-w-[120px] flex-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-bold text-green-700 shadow-sm transition hover:bg-green-600 hover:text-white">
                                                    Approve as Paid
                                                </button>
                                                <button onClick={() => handleConfirmBooking(booking._id, 'not_paid')} className="min-w-[120px] flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-800 hover:text-white">
                                                    Approve Undecided
                                                </button>
                                                <button onClick={() => handleCancelBooking(booking._id)} className="w-[100px] rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white">
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {booking.paymentStatus === 'paid' && booking.paymentGateway === 'razorpay' && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <button onClick={() => handleRefundBooking(booking._id)} className="min-w-[140px] flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-600 hover:text-white">
                                                    Refund Payment
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>
            </div>

            {reviewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    role="presentation"
                    onClick={(e) => e.target === e.currentTarget && closeReviewModal()}
                >
                    <div
                        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-modal-title"
                    >
                        <div
                            className={`border-b px-6 py-4 ${
                                reviewModal.action === 'approve' ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'
                            }`}
                        >
                            <h3 id="review-modal-title" className="text-lg font-bold text-gray-900">
                                {reviewModal.action === 'approve' ? 'Approve client request' : 'Decline client request'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                {reviewModal.action === 'approve'
                                    ? 'The event will be created or updated with the data the client submitted.'
                                    : 'The client will be notified. A clear note helps them fix and resubmit.'}
                            </p>
                        </div>
                        <div className="space-y-3 px-6 py-4 text-sm">
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="font-semibold text-gray-900">
                                    {reviewModal.request.proposedEventData?.title ||
                                        reviewModal.request.eventId?.title ||
                                        'Untitled event'}
                                </p>
                                <p className="mt-1 text-gray-600">
                                    {reviewModal.request.requestType === 'edit' ? 'Edit existing event' : 'New event'} -{' '}
                                    {reviewModal.request.submittedBy?.name}
                                </p>
                            </div>

                            {reviewModal.action === 'reject' && (
                                <div>
                                    <label htmlFor="review-decline-note" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                                        Note to client (optional)
                                    </label>
                                    <textarea
                                        id="review-decline-note"
                                        rows={4}
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                        placeholder="e.g. Please update the venue address and resubmit, or choose a future event date."
                                        className="min-h-[100px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-gray-800"
                                    />
                                </div>
                            )}

                            {reviewError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {reviewError}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeReviewModal}
                                disabled={reviewBusy}
                                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitClientRequestReview}
                                disabled={reviewBusy}
                                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto ${
                                    reviewModal.action === 'approve'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                {reviewBusy
                                    ? 'Working...'
                                    : reviewModal.action === 'approve'
                                        ? 'Confirm approval'
                                        : 'Confirm decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
