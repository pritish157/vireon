import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaFilter, FaSearch, FaRegCalendarAlt } from 'react-icons/fa';
import api from '../utils/axios';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import Footer from '../components/Footer';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';

const PAGE_SIZE = 9;
const categories = ['All', 'Technology', 'Music', 'Business', 'Art', 'Sports', 'Wedding'];

export default function EventsScreen() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useContext(AuthContext);
    const { hasStoredLocation, locationLabel, openManualLocationModal } = useLocationPreferences();
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [page, setPage] = useState(1);
    const [browseMode, setBrowseMode] = useState('all');

    const canShowNearby = Boolean(user && user.role !== 'client');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 250);
        return () => clearTimeout(timeoutId);
    }, [search, sortBy, category, statusFilter, browseMode]);

    useEffect(() => {
        const nextParams = {};
        if (search) nextParams.search = search;
        if (sortBy !== 'date') nextParams.sort = sortBy;
        if (category) nextParams.category = category;
        if (statusFilter !== 'all') nextParams.status = statusFilter;
        setSearchParams(nextParams, { replace: true });
        setPage(1);
    }, [search, sortBy, category, statusFilter, setSearchParams]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let url = `/events?search=${encodeURIComponent(search)}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            
            const { data } = await api.get(url);

            const sorted = [...data].sort((a, b) => {
                if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
                if (sortBy === 'price-low') return a.ticketPrice - b.ticketPrice;
                if (sortBy === 'price-high') return b.ticketPrice - a.ticketPrice;
                return 0;
            });

            const nearbyFirst = browseMode === 'nearby' && hasStoredLocation
                ? sorted.filter((event) => [event.city, event.district, event.state, event.location].some((value) =>
                    String(value || '').toLowerCase().includes(String(locationLabel).toLowerCase())
                ))
                : sorted;

            setEvents(nearbyFirst);
        } catch (error) {
            console.error('Error fetching events', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
    const visibleEvents = useMemo(() => {
        const startIndex = (page - 1) * PAGE_SIZE;
        return events.slice(startIndex, startIndex + PAGE_SIZE);
    }, [events, page]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Section */}
            <div className="bg-slate-950 px-4 py-8 text-white md:px-8 md:py-12">
                <div className="mx-auto max-w-7xl">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="mb-6 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 w-max"
                    >
                        <FaArrowLeft /> Back to home
                    </button>
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">Browse Events</h1>
                    <p className="mt-4 max-w-2xl text-slate-300 md:text-lg">
                        Discover amazing experiences. Filter by upcoming or past events, categories, and locations.
                    </p>
                </div>
            </div>

            {/* Filters & Results */}
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
                    {/* Sidebar / Top Filters */}
                    <aside className="w-full shrink-0 space-y-6 md:w-72">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title or venue"
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                <FaRegCalendarAlt /> Timing
                            </h3>
                            <div className="flex flex-col gap-2">
                                {['all', 'upcoming', 'past'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`rounded-xl px-4 py-2.5 text-left text-sm font-bold capitalize transition ${
                                            statusFilter === status
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {status} Events
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Category</h3>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((item) => {
                                    const active = (item === 'All' && !category) || category === item;
                                    return (
                                        <button
                                            key={item}
                                            onClick={() => setCategory(item === 'All' ? '' : item)}
                                            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                                                active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sort & Mode */}
                        <div className="grid grid-cols-2 gap-3">
                            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Sort By</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
                                >
                                    <option value="date">Date</option>
                                    <option value="price-low">Low Price</option>
                                    <option value="price-high">High Price</option>
                                </select>
                            </label>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!hasStoredLocation) openManualLocationModal();
                                    setBrowseMode((current) => (current === 'nearby' ? 'all' : 'nearby'));
                                }}
                                className={`rounded-2xl border p-3 text-left shadow-sm transition ${
                                    browseMode === 'nearby' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Mode</span>
                                <p className="mt-1 text-sm font-bold">
                                    {browseMode === 'nearby' ? 'Nearby' : 'All Locales'}
                                </p>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Results</p>
                                <p className="mt-1 text-lg font-black text-slate-900">{events.length} events found</p>
                            </div>
                            {canShowNearby && hasStoredLocation && (
                                <p className="max-w-[12rem] text-right text-xs font-medium text-slate-500">
                                    Personalized for <span className="font-bold text-slate-700">{locationLabel}</span>
                                </p>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                                {Array.from({ length: 6 }).map((_, idx) => <EventCardSkeleton key={idx} />)}
                            </div>
                        ) : visibleEvents.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                                <p className="text-lg font-bold text-slate-500">No events found</p>
                                <p className="mt-2 text-sm text-slate-400">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                                <AnimatePresence mode="popLayout">
                                    {visibleEvents.map((event) => {
                                        const isPast = new Date(event.date) < new Date();
                                        return (
                                            <motion.div
                                                layout
                                                key={event._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.25, type: 'spring', bounce: 0.3 }}
                                                className={`relative ${isPast ? 'grayscale opacity-75' : ''}`}
                                            >
                                                {isPast && (
                                                    <div className="absolute left-3 top-3 z-20 rounded-full bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
                                                        Past Event
                                                    </div>
                                                )}
                                                <div className="relative z-10 h-full">
                                                    <EventCard event={event} />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {totalPages > 1 && (
                            <div className="mt-10 flex items-center justify-between rounded-[24px] bg-white p-4 shadow-sm">
                                <button
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page === 1}
                                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Page {page} / {totalPages}
                                </p>
                                <button
                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                    disabled={page === totalPages}
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}
