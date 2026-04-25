import React, { useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/axios';
import {
    FaMapMarkerAlt,
    FaSearch,
    FaRegClock,
    FaTicketAlt,
    FaShieldAlt,
    FaArrowRight
} from 'react-icons/fa';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import EmptyState from '../components/EmptyState';
import NearbyEventsSection from '../components/NearbyEventsSection';
import EventCarousel from '../components/EventCarousel';
import Footer from '../components/Footer';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';
import MobileHomeScreen from '../components/mobile/MobileHomeScreen';
import useIsMobileViewport from '../hooks/useIsMobileViewport';

const Home = () => {
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const { hasStoredLocation, locationLabel, openManualLocationModal } = useLocationPreferences();
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [loading, setLoading] = useState(true);
    const [browseMode, setBrowseMode] = useState('auto'); // auto | nearby | all
    const deferredSearch = useDeferredValue(search);
    const isMobile = useIsMobileViewport();

    const categories = ['Technology', 'Music', 'Business', 'Art', 'Sports'];

    const canShowNearby = Boolean(user && user.role !== 'client');
    const defaultMode = useMemo(() => {
        if (browseMode !== 'auto') return browseMode;
        if (canShowNearby && hasStoredLocation) return 'nearby';
        return 'all';
    }, [browseMode, canShowNearby, hasStoredLocation]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [deferredSearch, category, sortBy]);

    useEffect(() => {
        if (location.state?.scrollToEvents) {
            requestAnimationFrame(() => {
                const section = document.getElementById('events-section');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let url = `/events?search=${deferredSearch}`;
            if (category) url += `&category=${category}`;
            const { data } = await api.get(url);

            const sorted = [...data].sort((a, b) => {
                if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
                if (sortBy === 'price-low') return a.ticketPrice - b.ticketPrice;
                if (sortBy === 'price-high') return b.ticketPrice - a.ticketPrice;
                return 0;
            });

            setEvents(sorted);
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    if (isMobile) {
        return (
            <MobileHomeScreen
                user={user}
                events={events}
                loading={loading}
                locationLabel={locationLabel}
                hasStoredLocation={hasStoredLocation}
                onOpenLocation={openManualLocationModal}
            />
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="relative hidden overflow-hidden rounded-3xl bg-black text-white shadow-2xl md:mb-12 md:block">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                <div className="relative z-10 flex flex-col items-center p-10 text-center md:p-20">
                    <span className="mb-6 rounded-full border border-white/20 bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
                        Welcome to Vireon
                    </span>
                    <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight drop-shadow-lg md:text-7xl">
                        Find Your Next <br />
                        <span className="bg-gradient-to-r from-gray-200 to-gray-500 bg-clip-text text-transparent">Unforgettable</span> Experience
                    </h1>
                    <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                        Discover the best tech conferences, late-night music festivals, and hands-on workshops happening directly in your area. Secure your spot today.
                    </p>

                    <div className="group relative mx-auto flex w-full max-w-2xl items-center shadow-2xl">
                        <FaSearch className="absolute left-6 text-xl text-gray-500 transition-colors group-focus-within:text-black" />
                        <input
                            type="text"
                            placeholder="Search events by title..."
                            className="w-full rounded-full border-2 border-transparent bg-white/95 py-5 pl-16 pr-6 text-lg font-medium text-black placeholder-gray-400 backdrop-blur-sm transition-all focus:border-gray-500 focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="hidden grid-cols-1 gap-8 px-4 md:mb-16 md:grid md:grid-cols-3">
                <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-2xl text-white shadow-md shadow-gray-200/50">
                        <FaRegClock />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">Fast Booking</h3>
                    <p className="text-sm leading-relaxed text-gray-500">Secure your tickets instantly with our fast streamlined booking infrastructure built for speed.</p>
                </div>
                <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-2xl text-white shadow-md shadow-gray-200/50">
                        <FaTicketAlt />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">Seamless Access</h3>
                    <p className="text-sm leading-relaxed text-gray-500">Download tickets instantly or manage them right from your personal dashboard with easily.</p>
                </div>
                <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-2xl text-white shadow-md shadow-gray-200/50">
                        <FaShieldAlt />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">Secure Platform</h3>
                    <p className="text-sm leading-relaxed text-gray-500">All transactions and registrations are bounded by cutting-edge security and 2FA OTP tech.</p>
                </div>
            </div>

            <div className="mb-6 px-1 md:mb-8 md:px-4">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Filter by Category</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
                    <button
                        onClick={() => setCategory('')}
                        className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition md:py-2 ${
                            category === ''
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/10'
                                : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-100 md:bg-gray-200 md:hover:bg-gray-300'
                        }`}
                    >
                        All Events
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition md:py-2 ${
                                category === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-100 md:bg-gray-200 md:hover:bg-gray-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div id="events-section" className="mb-6 px-1 md:mb-8 md:px-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Events</h2>
                        {defaultMode === 'nearby' ? (
                            <p className="mt-1 text-gray-600">
                                Showing events near <span className="font-semibold text-gray-900">{locationLabel}</span>
                            </p>
                        ) : (
                            <p className="mt-1 text-gray-600">{events.length} events found</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        {canShowNearby && (
                            <div className="grid grid-cols-2 gap-2 md:mr-2 md:flex md:items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!hasStoredLocation) openManualLocationModal();
                                        setBrowseMode('nearby');
                                    }}
                                    className={`rounded-2xl border px-4 py-3 text-sm font-bold transition md:rounded-lg md:py-2 ${
                                        defaultMode === 'nearby'
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    Nearby
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBrowseMode('all')}
                                    className={`rounded-2xl border px-4 py-3 text-sm font-bold transition md:rounded-lg md:py-2 ${
                                        defaultMode === 'all'
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    Browse all
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-3 rounded-[24px] border border-white/70 bg-white/90 px-4 py-3 shadow-sm md:border-transparent md:bg-transparent md:px-0 md:py-0 md:shadow-none">
                            <label className="text-sm font-semibold text-gray-700">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 md:w-auto md:rounded-lg md:py-2"
                            >
                                <option value="date">Date (Earliest)</option>
                                <option value="price-low">Price (Low to High)</option>
                                <option value="price-high">Price (High to Low)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {!loading && events.length > 0 && (
                <div className="px-1 md:px-4">
                    <EventCarousel
                        title="Featured this week"
                        subtitle="A curated, smooth slideshow of popular upcoming events."
                        events={events.slice(0, 10)}
                        renderItem={(event) => <EventCard event={event} />}
                    />
                </div>
            )}

            {defaultMode === 'nearby' ? (
                <div className="mt-10 px-1 md:px-4">
                    <NearbyEventsSection
                        title="Events near you"
                        description="We're showing events matched to your saved location."
                        variant="carousel"
                    />
                    {!hasStoredLocation && (
                        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                            <h3 className="text-xl font-bold text-gray-900">Set your location to personalize Home</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Choose your state and district to see nearby events instead of a long generic list.
                            </p>
                            <button
                                type="button"
                                onClick={openManualLocationModal}
                                className="mt-5 rounded-xl bg-gray-900 px-5 py-3 font-bold text-white transition hover:bg-black"
                            >
                                Choose location
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="grid grid-cols-1 gap-4 px-1 md:grid-cols-2 md:gap-8 md:px-4 lg:grid-cols-3">
                            {Array(6).fill(0).map((_, i) => (
                                <EventCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="px-1 md:px-4">
                            <EmptyState
                                title="No Events Found"
                                description={
                                    category
                                        ? `No ${category} events available right now. Try other categories!`
                                        : "Try adjusting your search or filters to find what you're looking for."
                                }
                            />
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                            className="grid grid-cols-1 gap-4 px-1 md:grid-cols-2 md:gap-8 md:px-4 lg:grid-cols-3"
                        >
                            {events.map((event) => (
                                <motion.div
                                    key={event._id}
                                    variants={{
                                        hidden: { opacity: 0, y: 14 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    transition={{ duration: 0.22 }}
                                >
                                    <EventCard event={event} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </>
            )}

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
};

export default Home;
