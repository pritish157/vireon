import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
    const availablePercent = event.availableSeats > 0
        ? Math.round((event.availableSeats / event.totalSeats) * 100)
        : 0;

    return (
        <Link to={`/events/${event._id}`} className="block h-full">
            <motion.article
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_28px_70px_rgba(15,23,42,0.14)] md:rounded-2xl md:hover:-translate-y-2"
            >
                <div className="relative h-56 overflow-hidden bg-slate-200 md:h-48">
                    {event.image ? (
                        <img
                            src={event.image}
                            alt={event.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-5xl font-black uppercase tracking-[0.3em] text-white/20">
                            {String(event.category || 'Event').slice(0, 1)}
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/0 to-transparent" />

                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900 shadow-sm">
                        {event.category}
                    </div>

                    <div className="absolute right-4 top-4">
                        {availablePercent > 50 ? (
                            <div className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                                {availablePercent}% Available
                            </div>
                        ) : availablePercent > 0 ? (
                            <div className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                                Few Left
                            </div>
                        ) : (
                            <div className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                                Sold Out
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-3 text-xl font-black leading-tight text-slate-900 transition-colors group-hover:text-blue-600 md:text-lg">
                        {event.title}
                    </h3>

                    <p className="mb-5 line-clamp-2 text-sm leading-6 text-slate-600">
                        {event.description}
                    </p>

                    <div className="flex-1 space-y-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-600" />
                            <span>{new Date(event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="shrink-0 text-rose-500" />
                            <span className="truncate">{event.location}</span>
                        </div>
                        {(event.city || event.district || event.state) && (
                            <div className="flex items-start gap-2 pl-7 text-xs text-slate-500">
                                <span className="line-clamp-2">
                                    {[event.city, event.district, event.state].filter(Boolean).join(' - ')}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <FaChair className="text-violet-600" />
                            <span>{event.availableSeats} of {event.totalSeats} seats</span>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-emerald-600" />
                            <span className="text-2xl font-black text-slate-900">
                                {event.ticketPrice === 0 ? 'Free' : `Rs. ${event.ticketPrice}`}
                            </span>
                        </div>

                        <span className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition group-hover:bg-blue-600 md:rounded-lg md:px-4 md:py-2">
                            Book Now
                        </span>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
};

export default EventCard;
