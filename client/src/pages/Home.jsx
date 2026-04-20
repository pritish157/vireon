import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaRegClock, FaTicketAlt, FaShieldAlt } from 'react-icons/fa';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import EmptyState from '../components/EmptyState';
import NearbyEventsSection from '../components/NearbyEventsSection';
import EventCarousel from '../components/EventCarousel';
import Footer from '../components/Footer';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';

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
        }, 400); // 400ms debounce
        return () => clearTimeout(timeoutId);
    }, [search, category, sortBy]);

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
            let url = `/events?search=${search}`;
            if (category) url += `&category=${category}`;
            const { data } = await api.get(url);
            
            // Sort events
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

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <div className="relative bg-black text-white rounded-3xl overflow-hidden mb-12 shadow-2xl">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                <div className="relative p-10 md:p-20 text-center flex flex-col items-center z-10">
                    <span className="bg-white/20 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">Welcome to Vireon</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg">
                        Find Your Next <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Unforgettable</span> Experience
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        Discover the best tech conferences, late-night music festivals, and hands-on workshops happening directly in your area. Secure your spot today.
                    </p>

                    <div className="w-full max-w-2xl mx-auto relative flex items-center shadow-2xl group">
                        <FaSearch className="absolute left-6 text-gray-500 text-xl group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events by title..."
                            className="w-full pl-16 pr-6 py-5 rounded-full text-lg text-black bg-white/95 backdrop-blur-sm border-2 border-transparent focus:border-gray-500 focus:outline-none transition-all placeholder-gray-400 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Why Choose Us / Features row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md shadow-gray-200/50">
                        <FaRegClock />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Booking</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Secure your tickets instantly with our fast streamlined booking infrastructure built for speed.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md shadow-gray-200/50">
                        <FaTicketAlt />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Seamless Access</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Download tickets instantly or manage them right from your personal dashboard with easily.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-md shadow-gray-200/50">
                        <FaShieldAlt />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Platform</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">All transactions and registrations are bounded by cutting-edge security and 2FA OTP tech.</p>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-8 px-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Filter by Category</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setCategory('')}
                        className={`px-5 py-2 rounded-full font-semibold transition ${
                            category === ''
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                    >
                        All Events
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-5 py-2 rounded-full font-semibold transition ${
                                category === cat
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sorting Options */}
            <div id="events-section" className="mb-8 px-4 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Events</h2>
                    {defaultMode === 'nearby' ? (
                        <p className="text-gray-600 mt-1">
                            Showing events near <span className="font-semibold text-gray-900">{locationLabel}</span>
                        </p>
                    ) : (
                        <p className="text-gray-600 mt-1">{events.length} events found</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {canShowNearby && (
                        <div className="hidden sm:flex items-center gap-2 mr-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!hasStoredLocation) openManualLocationModal();
                                    setBrowseMode('nearby');
                                }}
                                className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${
                                    defaultMode === 'nearby'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                Nearby
                            </button>
                            <button
                                type="button"
                                onClick={() => setBrowseMode('all')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${
                                    defaultMode === 'all'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                Browse all
                            </button>
                        </div>
                    )}
                    <label className="text-sm font-semibold text-gray-700">Sort by:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        <option value="date">Date (Earliest)</option>
                        <option value="price-low">Price (Low to High)</option>
                        <option value="price-high">Price (High to Low)</option>
                    </select>
                </div>
            </div>

            {/* Featured slider */}
            {!loading && events.length > 0 && (
                <div className="px-4">
                    <EventCarousel
                        title="Featured this week"
                        subtitle="A curated, smooth slideshow of popular upcoming events."
                        events={events.slice(0, 10)}
                        renderItem={(event) => <EventCard event={event} />}
                    />
                </div>
            )}

            {/* Primary listing: nearby-first */}
            {defaultMode === 'nearby' ? (
                <div className="px-4 mt-10">
                    <NearbyEventsSection
                        title="Events near you"
                        description="We’re showing events matched to your saved location—"
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
                    {/* Events Grid (Browse all) */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                            {Array(6).fill(0).map((_, i) => (
                                <EventCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="px-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                            {events.map((event) => (
                                <EventCard key={event._id} event={event} />
                            ))}
                        </div>
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
