import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/authContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import EventRegionFields from '../components/EventRegionFields';
import useIsMobileViewport from '../hooks/useIsMobileViewport';
import MobileClientDashboardView from '../components/mobile/MobileClientDashboardView';

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
    image: '',
    editRequestReason: ''
};

const toDateInputValue = (value) => {
    if (!value) return '';
    return new Date(value).toISOString().split('T')[0];
};

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const isLocalImageData = (value) => String(value || '').startsWith('data:image/');

const ClientDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [selectedImageName, setSelectedImageName] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const isMobile = useIsMobileViewport();

    useEffect(() => {
        if (isMobile) {
            return;
        }
        if (!user) {
            navigate('/client/login');
            return;
        }
        if (user.role !== 'client') {
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
            return;
        }
        fetchData();
    }, [isMobile, user, navigate]);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/client/events/my');
            setEvents(data.events || []);
            setRequests(data.requests || []);
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to load client dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setShowEventForm(false);
        setEditingEventId(null);
        setFormData(initialFormData);
        setSelectedImageName('');
    };

    const openNewRequestForm = () => {
        setEditingEventId(null);
        setFormData(initialFormData);
        setSelectedImageName('');
        setSuccessMsg('');
        setErrorMsg('');
        setShowEventForm(true);
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrorMsg('Please select a valid image file.');
            return;
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            setErrorMsg('Image must be 4MB or smaller.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const fileDataUrl = typeof reader.result === 'string' ? reader.result : '';
            if (!fileDataUrl) {
                setErrorMsg('Failed to read image file.');
                return;
            }
            setFormData((prev) => ({ ...prev, image: fileDataUrl }));
            setSelectedImageName(file.name);
            setErrorMsg('');
        };
        reader.onerror = () => {
            setErrorMsg('Failed to read image file.');
        };
        reader.readAsDataURL(file);
    };

    const clearSelectedImage = () => {
        setFormData((prev) => ({ ...prev, image: '' }));
        setSelectedImageName('');
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const payload = { ...formData };
            if (editingEventId) {
                await api.put(`/client/events/${editingEventId}/request-edit`, payload);
                setSuccessMsg('Edit request sent to admin for approval.');
            } else {
                delete payload.editRequestReason;
                await api.post('/client/events', payload);
                setSuccessMsg('Event registration request sent to admin for approval.');
            }

            resetForm();
            await fetchData();
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditRequestForm = (event) => {
        setEditingEventId(event._id);
        setFormData({
            title: event.title || '',
            description: event.description || '',
            date: toDateInputValue(event.date),
            stateCode: event.stateCode || '',
            district: event.district || '',
            city: event.city || '',
            location: event.location || '',
            country: event.country || 'India',
            category: event.category || '',
            totalSeats: String(event.totalSeats ?? ''),
            ticketPrice: String(event.ticketPrice ?? ''),
            image: event.image || '',
            editRequestReason: ''
        });
        setSelectedImageName(isLocalImageData(event.image) ? 'Previously uploaded image' : '');
        setShowEventForm(true);
        setSuccessMsg('');
        setErrorMsg('');
    };

    const statusClassName = (status) => {
        if (status === 'approved') return 'bg-green-100 text-green-700';
        if (status === 'rejected') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    if (loading) {
        return <div className="py-20 text-center text-xl font-semibold">Loading client dashboard...</div>;
    }

    if (isMobile) {
        return <MobileClientDashboardView />;
    }

    const pendingRequests = requests.filter((req) => req.status === 'pending').length;
    const approvedRequests = requests.filter((req) => req.status === 'approved').length;
    const rejectedRequests = requests.filter((req) => req.status === 'rejected').length;

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
                        <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">Client Dashboard</h1>
                        <p className="text-gray-300">Submit events and manage admin approval requests.</p>
                    </div>
                    <button
                        onClick={() => (showEventForm ? resetForm() : openNewRequestForm())}
                        className="w-full rounded-lg bg-white px-6 py-3 font-bold text-black shadow-md transition hover:bg-gray-100 md:w-auto"
                    >
                        {showEventForm ? 'Close Form' : (editingEventId ? 'Edit Request Form' : '+ Request New Event')}
                    </button>
                </div>
            </motion.div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">Pending Requests</p>
                    <h3 className="text-3xl font-black text-yellow-600">{pendingRequests}</h3>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">Approved Requests</p>
                    <h3 className="text-3xl font-black text-green-600">{approvedRequests}</h3>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-500">Rejected Requests</p>
                    <h3 className="text-3xl font-black text-red-600">{rejectedRequests}</h3>
                </div>
            </div>

            {errorMsg && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
                    {successMsg}
                </div>
            )}

            {showEventForm && (
                <div className="mb-8 rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm md:rounded-2xl md:p-8">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">
                        {editingEventId ? 'Request Event Edit Approval' : 'Submit New Event for Approval'}
                    </h2>
                    <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <input
                            required
                            type="text"
                            placeholder="Event Title"
                            className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <input
                            required
                            type="text"
                            placeholder="Category"
                            className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        <input
                            required
                            type="date"
                            className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                        <EventRegionFields formData={formData} setFormData={setFormData} />
                        <input
                            required
                            min="1"
                            step="1"
                            type="number"
                            placeholder="Total Seats"
                            className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700"
                            value={formData.totalSeats}
                            onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                        />
                        <input
                            required
                            min="0"
                            step="1"
                            type="number"
                            placeholder="Ticket Price (0 for free)"
                            className="rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700"
                            value={formData.ticketPrice}
                            onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                        />
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
                        {editingEventId && (
                            <textarea
                                required
                                minLength={15}
                                placeholder="What exactly are you changing and why? (required for edit approval)"
                                className="h-28 rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700 md:col-span-2"
                                value={formData.editRequestReason}
                                onChange={(e) => setFormData({ ...formData, editRequestReason: e.target.value })}
                            />
                        )}
                        {editingEventId && (
                            <p className="-mt-3 text-sm text-gray-500 md:col-span-2">
                                This note is visible to admins and must explain the exact changes requested.
                            </p>
                        )}
                        <textarea
                            required
                            placeholder="Event Description"
                            className="h-32 rounded-lg border px-4 py-3 outline-none transition focus:ring-2 focus:ring-gray-700 md:col-span-2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <div className="mt-2 flex flex-col gap-3 md:col-span-2 sm:flex-row">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 rounded-lg bg-gray-900 py-3 font-bold text-white shadow-md transition hover:bg-black disabled:opacity-70"
                            >
                                {submitting
                                    ? 'Submitting...'
                                    : (editingEventId ? 'Request Edit Approval' : 'Request Registration Approval')}
                            </button>
                            {editingEventId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-lg bg-gray-100 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-200 sm:w-auto"
                                >
                                    Cancel Edit Request
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="flex flex-col">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">Approved Events</h2>
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <ul className="max-h-[650px] divide-y divide-gray-100 overflow-y-auto">
                            {events.length === 0 ? (
                                <li className="p-6 text-center text-gray-500">No approved events yet.</li>
                            ) : (
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
                                        </div>
                                        <button
                                            onClick={() => openEditRequestForm(event)}
                                            className="w-full rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white sm:w-auto"
                                        >
                                            Request Edit
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">Approval Requests</h2>
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <ul className="max-h-[650px] divide-y divide-gray-100 overflow-y-auto">
                            {requests.length === 0 ? (
                                <li className="p-6 text-center text-gray-500">No requests submitted yet.</li>
                            ) : (
                                requests.map((request) => (
                                    <li key={request._id} className="p-5 transition hover:bg-gray-50">
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <h4 className="font-bold leading-tight text-gray-900">
                                                {request.proposedEventData?.title || request.eventId?.title || 'Untitled Event'}
                                            </h4>
                                            <span className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusClassName(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            <strong>Type:</strong> {request.requestType === 'edit' ? 'Edit Request' : 'New Registration'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}
                                        </p>
                                        {request.requestType === 'edit' && request.editRequestReason && (
                                            <p className="mt-2 rounded border border-blue-100 bg-blue-50 p-2 text-sm text-gray-700">
                                                <strong>Edit Note:</strong> {request.editRequestReason}
                                            </p>
                                        )}
                                        {request.reviewedAt && (
                                            <p className="text-sm text-gray-600">
                                                <strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleString()}
                                            </p>
                                        )}
                                        {request.reviewNote && (
                                            <p className="mt-2 rounded border border-gray-100 bg-gray-50 p-2 text-sm text-gray-700">
                                                <strong>Admin Note:</strong> {request.reviewNote}
                                            </p>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
