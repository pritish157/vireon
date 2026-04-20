import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import EventRegionFields from '../components/EventRegionFields';

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

    useEffect(() => {
        if (!user) {
            navigate('/client/login');
            return;
        }
        if (user.role !== 'client') {
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
            return;
        }
        fetchData();
    }, [user, navigate]);

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
        return <div className="text-center py-20 text-xl font-semibold">Loading client dashboard...</div>;
    }

    const pendingRequests = requests.filter((req) => req.status === 'pending').length;
    const approvedRequests = requests.filter((req) => req.status === 'approved').length;
    const rejectedRequests = requests.filter((req) => req.status === 'rejected').length;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Client Dashboard</h1>
                    <p className="text-gray-300">Submit events and manage admin approval requests.</p>
                </div>
                <button
                    onClick={() => (showEventForm ? resetForm() : openNewRequestForm())}
                    className="w-full md:w-auto bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition shadow-md"
                >
                    {showEventForm ? 'Close Form' : (editingEventId ? 'Edit Request Form' : '+ Request New Event')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Pending Requests</p>
                    <h3 className="text-3xl font-black text-yellow-600">{pendingRequests}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Approved Requests</p>
                    <h3 className="text-3xl font-black text-green-600">{approvedRequests}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Rejected Requests</p>
                    <h3 className="text-3xl font-black text-red-600">{rejectedRequests}</h3>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mb-6">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg mb-6">
                    {successMsg}
                </div>
            )}

            {showEventForm && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        {editingEventId ? 'Request Event Edit Approval' : 'Submit New Event for Approval'}
                    </h2>
                    <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                            required
                            type="text"
                            placeholder="Event Title"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <input
                            required
                            type="text"
                            placeholder="Category"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        <input
                            required
                            type="date"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
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
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.totalSeats}
                            onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                        />
                        <input
                            required
                            min="0"
                            step="1"
                            type="number"
                            placeholder="Ticket Price (0 for free)"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.ticketPrice}
                            onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                        />
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Image URL (optional if uploading from local storage)"
                                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                                value={isLocalImageData(formData.image) ? '' : formData.image}
                                onChange={(e) => {
                                    setFormData({ ...formData, image: e.target.value });
                                    setSelectedImageName('');
                                }}
                            />
                            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageFileChange}
                                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                                {formData.image && (
                                    <button
                                        type="button"
                                        onClick={clearSelectedImage}
                                        className="sm:w-auto bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
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
                                    className="mt-3 w-full max-w-xs h-40 object-cover rounded-lg border border-gray-200"
                                />
                            )}
                        </div>
                        {editingEventId && (
                            <textarea
                                required
                                minLength={15}
                                placeholder="What exactly are you changing and why? (required for edit approval)"
                                className="border px-4 py-3 rounded-lg md:col-span-2 h-28 focus:ring-2 focus:ring-gray-700 outline-none transition"
                                value={formData.editRequestReason}
                                onChange={(e) => setFormData({ ...formData, editRequestReason: e.target.value })}
                            />
                        )}
                        {editingEventId && (
                            <p className="md:col-span-2 text-sm text-gray-500 -mt-3">
                                This note is visible to admins and must explain the exact changes requested.
                            </p>
                        )}
                        <textarea
                            required
                            placeholder="Event Description"
                            className="border px-4 py-3 rounded-lg md:col-span-2 h-32 focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 mt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition shadow-md disabled:opacity-70"
                            >
                                {submitting
                                    ? 'Submitting...'
                                    : (editingEventId ? 'Request Edit Approval' : 'Request Registration Approval')}
                            </button>
                            {editingEventId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="sm:w-auto bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancel Edit Request
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Approved Events</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[650px] overflow-y-auto">
                            {events.length === 0 ? (
                                <li className="p-6 text-gray-500 text-center">No approved events yet.</li>
                            ) : (
                                events.map((event) => (
                                    <li key={event._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition">
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1 leading-tight">{event.title}</h4>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <span>{new Date(event.date).toLocaleDateString()}</span>
                                                <span>{event.category}</span>
                                                <span>Rs. {event.ticketPrice}</span>
                                                <span>{event.availableSeats}/{event.totalSeats} seats</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openEditRequestForm(event)}
                                            className="w-full sm:w-auto text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
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
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Approval Requests</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[650px] overflow-y-auto">
                            {requests.length === 0 ? (
                                <li className="p-6 text-gray-500 text-center">No requests submitted yet.</li>
                            ) : (
                                requests.map((request) => (
                                    <li key={request._id} className="p-5 hover:bg-gray-50 transition">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="font-bold text-gray-900 leading-tight">
                                                {request.proposedEventData?.title || request.eventId?.title || 'Untitled Event'}
                                            </h4>
                                            <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${statusClassName(request.status)}`}>
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
                                            <p className="text-sm text-gray-700 mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                                                <strong>Edit Note:</strong> {request.editRequestReason}
                                            </p>
                                        )}
                                        {request.reviewedAt && (
                                            <p className="text-sm text-gray-600">
                                                <strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleString()}
                                            </p>
                                        )}
                                        {request.reviewNote && (
                                            <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
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
