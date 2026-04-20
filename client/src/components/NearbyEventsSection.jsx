import React, { useContext, useEffect, useState } from 'react';
import api from '../utils/axios';
import EventCard from './EventCard';
import EventCardSkeleton from './EventCardSkeleton';
import EmptyState from './EmptyState';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';
import EventCarousel from './EventCarousel';

const CATEGORY_OPTIONS = ['', 'Technology', 'Music', 'Business', 'Art', 'Sports'];

const NearbyEventsSection = ({
    title = 'Nearby Events',
    description = 'Events in your saved state and district (and city when set), same idea as local discovery in food apps—',
    variant = 'grid'
}) => {
    const { user } = useContext(AuthContext);
    const { hasStoredLocation, locationLabel, openManualLocationModal } = useLocationPreferences();
    const [events, setEvents] = useState([]);
    const [category, setCategory] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || user.role === 'client' || !hasStoredLocation) {
            setEvents([]);
            return;
        }

        if (!localStorage.getItem('token')) {
            setEvents([]);
            setLoading(false);
            setError('Please sign in again to load nearby events.');
            return;
        }

        const fetchNearbyEvents = async () => {
            setLoading(true);
            setError('');

            try {
                const { data } = await api.get('/events/nearby', {
                    params: {
                        category: category || undefined,
                        date: selectedDate || undefined
                    }
                });
                setEvents(data);
            } catch (fetchError) {
                const status = fetchError.response?.status;
                if (status === 401) {
                    setError('Session expired or not signed in. Please log in again.');
                } else if (!fetchError.response) {
                    setError('Network error — check that the API is running and CORS allows this site.');
                } else {
                    setError(fetchError.response?.data?.message || 'Failed to load nearby events.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNearbyEvents();
    }, [category, hasStoredLocation, selectedDate, user]);

    if (!user || user.role === 'client') {
        return null;
    }

    return (
        <section className="mt-12 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Personalized For You</p>
                    <h2 className="mt-3 text-3xl font-extrabold text-gray-900">{title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        {description}{' '}
                        <span className="font-semibold text-gray-900">
                            {hasStoredLocation ? locationLabel : 'Set state and district to begin.'}
                        </span>
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">All Categories</option>
                        {CATEGORY_OPTIONS.filter(Boolean).map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
            </div>

            {!hasStoredLocation ? (
                <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900">Set your area to unlock nearby events</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Choose state and district (GPS or manual). We&apos;ll match events tagged for that region—no need to set it every visit.
                    </p>
                    <button
                        onClick={openManualLocationModal}
                        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                    >
                        Choose Location
                    </button>
                </div>
            ) : loading ? (
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <EventCardSkeleton key={index} />
                    ))}
                </div>
            ) : error ? (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                    {error}
                </div>
            ) : events.length === 0 ? (
                <div className="mt-8">
                    <EmptyState
                        title="No nearby events found"
                        description="Try another category or date, or update your location preferences."
                    />
                </div>
            ) : variant === 'carousel' ? (
                <div className="mt-8">
                    <EventCarousel
                        events={events}
                        autoPlay
                        title={null}
                        subtitle={null}
                        renderItem={(event) => <EventCard event={event} />}
                    />
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default NearbyEventsSection;
