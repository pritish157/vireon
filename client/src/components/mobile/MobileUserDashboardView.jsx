import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt, FaMoneyBillWave, FaTicketAlt } from 'react-icons/fa';
import api from '../../utils/axios';
import { AuthContext } from '../../context/authContext';
import MobileScreenShell from './MobileScreenShell';

export default function MobileUserDashboardView() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        const loadBookings = async () => {
            if (!user) {
                navigate('/login', { replace: true });
                return;
            }

            try {
                const { data } = await api.get('/bookings/my');
                setBookings(data || []);
            } catch (error) {
                console.error('Failed to load mobile user dashboard', error);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, [navigate, user]);

    const metrics = useMemo(() => {
        const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
        return [
            { label: 'Bookings', value: bookings.length, icon: <FaTicketAlt className="text-blue-500" /> },
            { label: 'Upcoming', value: confirmed.length, icon: <FaCalendarAlt className="text-emerald-500" /> },
            {
                label: 'Spent',
                value: `Rs. ${confirmed.reduce((sum, booking) => sum + Number(booking.amount || 0), 0)}`,
                icon: <FaMoneyBillWave className="text-amber-500" />
            }
        ];
    }, [bookings]);

    const recentBookings = bookings.slice(0, 3);

    return (
        <MobileScreenShell
            eyebrow="Dashboard"
            title="Your overview"
            subtitle="A compact snapshot of bookings, upcoming plans, and quick actions without a long feed."
        >
            <section className="grid grid-cols-3 gap-3">
                {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                        <div className="text-lg">{metric.icon}</div>
                        <p className="mt-4 text-lg font-black text-slate-900">{metric.value}</p>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                    </div>
                ))}
            </section>

            <section className="grid grid-cols-2 gap-3">
                <Link to="/bookings" className="rounded-[24px] bg-slate-900 px-4 py-4 text-white shadow-lg shadow-slate-900/15">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Action</p>
                    <p className="mt-3 text-base font-black">Open bookings</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">Manage confirmations and payment states.</p>
                </Link>
                <Link to="/events" className="rounded-[24px] border border-white/70 bg-white/95 px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Action</p>
                    <p className="mt-3 text-base font-black text-slate-900">Find events</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Go back to discovery without extra scrolling.</p>
                </Link>
            </section>

            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Recent activity</p>
                        <h2 className="mt-1 text-lg font-black text-slate-900">Latest bookings</h2>
                    </div>
                    <Link to="/bookings" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                        See all
                        <FaArrowRight className="text-xs" />
                    </Link>
                </div>

                <div className="mt-4 space-y-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-24 animate-pulse rounded-[22px] bg-slate-100" />
                        ))
                    ) : recentBookings.length === 0 ? (
                        <div className="rounded-[22px] bg-slate-50 p-4 text-sm text-slate-500">
                            No bookings yet.
                        </div>
                    ) : (
                        recentBookings.map((booking) => (
                            <div key={booking._id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-black text-slate-900">
                                            {booking.eventId?.title || 'Deleted event'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {new Date(booking.bookedAt).toLocaleDateString()} - {booking.amount === 0 ? 'Free' : `Rs. ${booking.amount}`}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                        booking.status === 'confirmed'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : booking.status === 'cancelled'
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </MobileScreenShell>
    );
}
