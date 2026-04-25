import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaFilter, FaSearch } from 'react-icons/fa';
import api from '../utils/axios';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import Footer from '../components/Footer';
import MobileScreenShell from '../components/mobile/MobileScreenShell';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';
import useIsMobileViewport from '../hooks/useIsMobileViewport';

const PAGE_SIZE = 6;
const categories = ['All', 'Technology', 'Music', 'Business', 'Art', 'Sports', 'Wedding'];

function EventsMobileScreen({ user }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { hasStoredLocation, locationLabel, openManualLocationModal } = useLocationPreferences();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [page, setPage] = useState(1);
    const [browseMode, setBrowseMode] = useState('all');

    const canShowNearby = Boolean(user && user.role !== 'client');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 250);
        return () => clearTimeout(timeoutId);
    }, [search, sortBy, category, browseMode]);

    useEffect(() => {
        const nextParams = {};
        if (search) nextParams.search = search;
        if (sortBy !== 'date') nextParams.sort = sortBy;
        if (category) nextParams.category = category;
        setSearchParams(nextParams, { replace: true });
        setPage(1);
    }, [search, sortBy, category, setSearchParams]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let url = `/events?search=${encodeURIComponent(search)}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
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
        <MobileScreenShell
            eyebrow="Events"
            title="Browse events"
            subtitle="Search, filter, and page through a tighter listing instead of a long scrolling feed."
            actions={
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white"
                    aria-label="Back to home"
                >
                    <FaArrowLeft />
                </button>
            }
        >
            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title or venue"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 focus:border-slate-300 focus:outline-none"
                    />
                </div>

                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                    {categories.map((item) => {
                        const active = (item === 'All' && !category) || category === item;
                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setCategory(item === 'All' ? '' : item)}
                                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                                    active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Sort</span>
                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                            className="mt-2 w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
                        >
                            <option value="date">Date</option>
                            <option value="price-low">Low Price</option>
                            <option value="price-high">High Price</option>
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={() => {
                            if (!hasStoredLocation) {
                                openManualLocationModal();
                            }
                            setBrowseMode((current) => (current === 'nearby' ? 'all' : 'nearby'));
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left ${
                            browseMode === 'nearby' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-xs" />
                            <span className="text-[11px] font-black uppercase tracking-[0.18em]">Mode</span>
                        </div>
                        <p className="mt-2 text-sm font-bold">
                            {browseMode === 'nearby' ? 'Nearby first' : 'Browse all'}
                        </p>
                    </button>
                </div>
            </section>

            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Results</p>
                        <p className="mt-1 text-base font-black text-slate-900">{events.length} events</p>
                    </div>
                    {canShowNearby && hasStoredLocation && (
                        <p className="max-w-[12rem] text-right text-xs text-slate-500">
                            Personalized for {locationLabel}
                        </p>
                    )}
                </div>

                <div className="mt-4 space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} />)
                    ) : visibleEvents.length === 0 ? (
                        <div className="rounded-[22px] bg-slate-50 p-5 text-sm text-slate-500">
                            No events match your current search and filters.
                        </div>
                    ) : (
                        visibleEvents.map((event, index) => (
                            <motion.div
                                key={event._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, delay: index * 0.04 }}
                            >
                                <EventCard event={event} />
                            </motion.div>
                        ))
                    )}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 disabled:opacity-45"
                    >
                        Prev
                    </button>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                        Page {page} / {totalPages}
                    </p>
                    <button
                        type="button"
                        disabled={page === totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white disabled:opacity-45"
                    >
                        Next
                    </button>
                </div>
            </section>
        </MobileScreenShell>
    );
}

function EventsDesktopScreen() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.search) {
            navigate(`/${location.search}`, { replace: true });
        } else {
            navigate('/', { replace: true, state: { scrollToEvents: true } });
        }
    }, [location.search, navigate]);

    return null;
}

export default function EventsScreen() {
    const isMobile = useIsMobileViewport();
    const { user } = useContext(AuthContext);

    if (isMobile) {
        return <EventsMobileScreen user={user} />;
    }

    return <EventsDesktopScreen />;
}
