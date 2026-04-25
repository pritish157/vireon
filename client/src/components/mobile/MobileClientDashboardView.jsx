import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt, FaClipboardList, FaPlusCircle } from 'react-icons/fa';
import api from '../../utils/axios';
import { AuthContext } from '../../context/authContext';
import MobileScreenShell from './MobileScreenShell';

export default function MobileClientDashboardView() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            if (!user) {
                navigate('/client/login', { replace: true });
                return;
            }

            try {
                const { data } = await api.get('/client/events/my');
                setEvents(data.events || []);
                setRequests(data.requests || []);
            } catch (error) {
                console.error('Failed to load mobile client dashboard', error);
                setEvents([]);
                setRequests([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate, user]);

    const metrics = useMemo(() => ([
        { label: 'Live events', value: events.length, icon: <FaCalendarAlt className="text-blue-500" /> },
        { label: 'Pending', value: requests.filter((request) => request.status === 'pending').length, icon: <FaClipboardList className="text-amber-500" /> },
        { label: 'Approved', value: requests.filter((request) => request.status === 'approved').length, icon: <FaPlusCircle className="text-emerald-500" /> }
    ]), [events.length, requests]);

    const recentItems = requests.slice(0, 3);

    return (
        <MobileScreenShell
            eyebrow="Dashboard"
            title="Client workspace"
            subtitle="See request movement, approved event count, and the next few items that matter."
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
                    <p className="mt-3 text-base font-black">Request status</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">Keep tabs on approvals and admin notes.</p>
                </Link>
                <Link to="/events" className="rounded-[24px] border border-white/70 bg-white/95 px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Action</p>
                    <p className="mt-3 text-base font-black text-slate-900">View marketplace</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Browse live events in the public feed.</p>
                </Link>
            </section>

            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Recent activity</p>
                        <h2 className="mt-1 text-lg font-black text-slate-900">Latest requests</h2>
                    </div>
                    <Link to="/bookings" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                        Open tab
                        <FaArrowRight className="text-xs" />
                    </Link>
                </div>

                <div className="mt-4 space-y-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-24 animate-pulse rounded-[22px] bg-slate-100" />
                        ))
                    ) : recentItems.length === 0 ? (
                        <div className="rounded-[22px] bg-slate-50 p-4 text-sm text-slate-500">
                            No client requests yet.
                        </div>
                    ) : (
                        recentItems.map((request) => (
                            <div key={request._id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-black text-slate-900">
                                            {request.proposedEventData?.title || request.eventId?.title || 'Untitled event'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {request.requestType === 'edit' ? 'Edit request' : 'New registration'} - {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                        request.status === 'approved'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : request.status === 'rejected'
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {request.status}
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
