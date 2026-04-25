import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChartLine, FaClock, FaMoneyBillWave, FaTicketAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../utils/axios';
import { AuthContext } from '../context/authContext';
import MobileScreenShell from '../components/mobile/MobileScreenShell';
import useIsMobileViewport from '../hooks/useIsMobileViewport';

const PAGE_SIZE = 5;

function MobileBookingsScreen() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (!user) {
                    setBookings([]);
                    setRequests([]);
                    return;
                }

                if (user.role === 'client') {
                    const { data } = await api.get('/client/events/my');
                    setRequests(data.requests || []);
                } else {
                    const { data } = await api.get('/bookings/my');
                    setBookings(data || []);
                }
            } catch (error) {
                console.error('Failed to load bookings screen', error);
                setBookings([]);
                setRequests([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const items = user?.role === 'client' ? requests : bookings;
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const pagedItems = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return items.slice(start, start + PAGE_SIZE);
    }, [items, page]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const summaryCards = user?.role === 'client'
        ? [
            {
                label: 'Pending',
                value: requests.filter((request) => request.status === 'pending').length,
                icon: <FaClock className="text-amber-500" />
            },
            {
                label: 'Approved',
                value: requests.filter((request) => request.status === 'approved').length,
                icon: <FaTicketAlt className="text-emerald-500" />
            },
            {
                label: 'Requests',
                value: requests.length,
                icon: <FaChartLine className="text-blue-500" />
            }
        ]
        : [
            {
                label: 'Confirmed',
                value: bookings.filter((booking) => booking.status === 'confirmed').length,
                icon: <FaTicketAlt className="text-emerald-500" />
            },
            {
                label: 'Pending',
                value: bookings.filter((booking) => booking.status === 'pending').length,
                icon: <FaClock className="text-amber-500" />
            },
            {
                label: 'Paid',
                value: bookings.filter((booking) => booking.paymentStatus === 'paid').length,
                icon: <FaMoneyBillWave className="text-blue-500" />
            }
        ];

    return (
        <MobileScreenShell
            eyebrow="Bookings"
            title={user?.role === 'client' ? 'Request activity' : 'Tickets and payments'}
            subtitle={user?.role === 'client'
                ? 'Track what is pending, approved, or needs attention without digging through a long dashboard.'
                : 'A focused screen for confirmations, payment states, and your most recent event activity.'}
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
            {!user ? (
                <section className="rounded-[26px] border border-white/70 bg-white/95 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-sm text-slate-500">Login to see your bookings, payment states, and request history.</p>
                    <Link to="/login" className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                        Login
                    </Link>
                </section>
            ) : (
                <>
                    <section className="grid grid-cols-3 gap-3">
                        {summaryCards.map((card) => (
                            <div key={card.label} className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                                <div className="text-lg">{card.icon}</div>
                                <p className="mt-4 text-2xl font-black text-slate-900">{card.value}</p>
                                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                            </div>
                        ))}
                    </section>

                    <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Recent</p>
                                <h2 className="mt-1 text-lg font-black text-slate-900">
                                    {user.role === 'client' ? 'Latest requests' : 'Latest bookings'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate(user.role === 'client' ? '/client/dashboard' : user.role === 'admin' ? '/admin' : '/dashboard')}
                                className="text-sm font-bold text-blue-600"
                            >
                                Open dashboard
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="h-24 animate-pulse rounded-[22px] bg-slate-100" />
                                ))
                            ) : pagedItems.length === 0 ? (
                                <div className="rounded-[22px] bg-slate-50 p-5 text-sm text-slate-500">
                                    Nothing here yet.
                                </div>
                            ) : (
                                pagedItems.map((item) => (
                                    <motion.div
                                        key={item._id}
                                        whileTap={{ scale: 0.985 }}
                                        className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                                    >
                                        {user.role === 'client' ? (
                                            <>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-base font-black text-slate-900">
                                                            {item.proposedEventData?.title || item.eventId?.title || 'Untitled event'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.requestType === 'edit' ? 'Edit request' : 'New registration'}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                                        item.status === 'approved'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : item.status === 'rejected'
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                                    Submitted {new Date(item.createdAt).toLocaleDateString()}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-base font-black text-slate-900">
                                                            {item.eventId?.title || 'Deleted event'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {new Date(item.bookedAt).toLocaleDateString()} - {item.amount === 0 ? 'Free' : `Rs. ${item.amount}`}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1 text-right">
                                                        <span className={`block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                                            item.status === 'confirmed'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : item.status === 'cancelled'
                                                                    ? 'bg-rose-100 text-rose-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                        <span className="block rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                                                            {String(item.paymentStatus || 'na').replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
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
                </>
            )}
        </MobileScreenShell>
    );
}

function DesktopBookingsScreen() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        navigate(user.role === 'client' ? '/client/dashboard' : user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }, [navigate, user]);

    return null;
}

export default function BookingsScreen() {
    const isMobile = useIsMobileViewport();

    if (isMobile) {
        return <MobileBookingsScreen />;
    }

    return <DesktopBookingsScreen />;
}
