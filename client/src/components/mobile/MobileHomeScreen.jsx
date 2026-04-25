import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FaArrowRight,
    FaCalendarAlt,
    FaCompass,
    FaMapMarkerAlt,
    FaPlus,
    FaTicketAlt
} from 'react-icons/fa';
import EventCard from '../EventCard';
import MobileScreenShell from './MobileScreenShell';

const quickActionBase =
    'rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]';

export default function MobileHomeScreen({
    user,
    events,
    loading,
    locationLabel,
    hasStoredLocation,
    onOpenLocation
}) {
    const navigate = useNavigate();

    const featuredEvents = events.slice(0, 4);
    const categories = ['Music', 'Technology', 'Business', 'Wedding', 'Art', 'Sports'];

    return (
        <MobileScreenShell
            eyebrow="Mobile Home"
            title="Your city, organized."
            subtitle="A compact event app flow with quick discovery, one-tap navigation, and no endless feed."
        >
            <section className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/events')}
                    className={`${quickActionBase} text-left active:scale-[0.98]`}
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <FaCompass />
                    </div>
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Explore</p>
                    <p className="mt-1 text-base font-black text-slate-900">Browse events</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">See filtered listings on a dedicated screen.</p>
                </button>

                <button
                    type="button"
                    onClick={() => navigate(user?.role === 'client' ? '/client/dashboard' : user?.role === 'admin' ? '/admin' : '/dashboard')}
                    className={`${quickActionBase} text-left active:scale-[0.98]`}
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        {user?.role === 'client' || user?.role === 'admin' ? <FaPlus /> : <FaTicketAlt />}
                    </div>
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Action</p>
                    <p className="mt-1 text-base font-black text-slate-900">
                        {user?.role === 'client' || user?.role === 'admin' ? 'Open dashboard' : 'My tickets'}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {user?.role === 'client' || user?.role === 'admin'
                            ? 'Manage events, requests, and activity.'
                            : 'Jump into upcoming bookings and confirmations.'}
                    </p>
                </button>
            </section>

            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Location</p>
                        <p className="mt-1 text-base font-black text-slate-900">
                            {hasStoredLocation ? locationLabel : 'Set your district'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenLocation}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
                    >
                        {hasStoredLocation ? 'Change' : 'Choose'}
                    </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <FaMapMarkerAlt className="text-blue-500" />
                    <span>Nearby suggestions use your saved location first.</span>
                </div>
            </section>

            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Categories</p>
                        <h2 className="mt-1 text-lg font-black text-slate-900">Popular tonight</h2>
                    </div>
                    <Link to="/events" className="text-sm font-bold text-blue-600">
                        View all
                    </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => navigate(`/events?category=${encodeURIComponent(category)}`)}
                            className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-700 active:scale-[0.98]"
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </section>

            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Featured</p>
                        <h2 className="mt-1 text-lg font-black text-slate-900">This week</h2>
                    </div>
                    <Link to="/events" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                        Explore
                        <FaArrowRight className="text-xs" />
                    </Link>
                </div>

                {loading ? (
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 2 }).map((_, index) => (
                            <div key={index} className="h-32 animate-pulse rounded-[22px] bg-slate-100" />
                        ))}
                    </div>
                ) : featuredEvents.length === 0 ? (
                    <div className="mt-4 rounded-[22px] bg-slate-50 p-4 text-sm text-slate-500">
                        No featured events available right now.
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        {featuredEvents.map((event, index) => (
                            <motion.div
                                key={event._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, delay: index * 0.04 }}
                            >
                                <EventCard event={event} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            <section className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/events')}
                    className="rounded-[24px] border border-slate-200 bg-slate-900 px-4 py-4 text-left text-white shadow-lg shadow-slate-900/15 active:scale-[0.98]"
                >
                    <FaCalendarAlt className="text-lg text-white/80" />
                    <p className="mt-4 text-sm font-black">Events Screen</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">Filters, search, and pagination live there now.</p>
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/bookings')}
                    className="rounded-[24px] border border-white/70 bg-white/95 px-4 py-4 text-left shadow-[0_14px_40px_rgba(15,23,42,0.08)] active:scale-[0.98]"
                >
                    <FaTicketAlt className="text-lg text-blue-600" />
                    <p className="mt-4 text-sm font-black text-slate-900">Bookings Screen</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">A separate place for confirmations, payment states, and requests.</p>
                </button>
            </section>
        </MobileScreenShell>
    );
}
