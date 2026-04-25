import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FaArrowRight,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaSignOutAlt,
    FaTicketAlt,
    FaTimes,
    FaUserCircle
} from 'react-icons/fa';

const drawerLinkClassName =
    'flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white';

const MobileNavDrawer = ({
    open,
    onClose,
    user,
    dashboardPath,
    locationLabel,
    hasStoredLocation,
    savingLocation,
    onOpenLocation,
    onGoToEvents,
    onLogout
}) => {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm md:hidden"
                        onClick={onClose}
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-y-0 right-0 z-[80] flex w-[88vw] max-w-sm flex-col bg-white shadow-2xl md:hidden"
                        aria-label="Mobile navigation"
                    >
                        <div className="border-b border-slate-100 bg-slate-950 px-5 pb-5 pt-6 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/55">Vireon</p>
                                    <h2 className="mt-2 text-2xl font-black">Mobile menu</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
                                    aria-label="Close menu"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg">
                                        <FaUserCircle />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-bold">
                                            {user ? user.name : 'Guest explorer'}
                                        </p>
                                        <p className="truncate text-sm text-white/65">
                                            {user ? user.email : 'Log in to manage bookings'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                            <div className="space-y-3">
                                <Link to="/" onClick={onClose} className={drawerLinkClassName}>
                                    <span className="flex items-center gap-3">
                                        <FaTicketAlt className="text-slate-400" />
                                        Explore home
                                    </span>
                                    <FaArrowRight className="text-slate-300" />
                                </Link>

                                <button type="button" onClick={onGoToEvents} className={`${drawerLinkClassName} w-full`}>
                                    <span className="flex items-center gap-3">
                                        <FaCalendarAlt className="text-slate-400" />
                                        Browse events
                                    </span>
                                    <FaArrowRight className="text-slate-300" />
                                </button>

                                <Link to={dashboardPath} onClick={onClose} className={drawerLinkClassName}>
                                    <span className="flex items-center gap-3">
                                        <FaUserCircle className="text-slate-400" />
                                        {user ? 'Open dashboard' : 'Login / signup'}
                                    </span>
                                    <FaArrowRight className="text-slate-300" />
                                </Link>
                            </div>

                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Location</p>
                                <div className="mt-3 flex items-start gap-3">
                                    <div className="mt-0.5 rounded-2xl bg-white p-3 text-slate-600 shadow-sm">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900">
                                            {hasStoredLocation ? locationLabel : 'Set your location'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {hasStoredLocation
                                                ? 'Nearby recommendations use this saved district.'
                                                : 'Choose a state and district for personalized event discovery.'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onOpenLocation}
                                    disabled={savingLocation}
                                    className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-black disabled:opacity-60"
                                >
                                    {hasStoredLocation ? 'Change location' : 'Choose location'}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold text-slate-500">
                                <Link to="/terms" onClick={onClose} className="rounded-2xl border border-slate-200 px-3 py-3">
                                    Terms
                                </Link>
                                <Link to="/privacy" onClick={onClose} className="rounded-2xl border border-slate-200 px-3 py-3">
                                    Privacy
                                </Link>
                                <Link to="/refund-policy" onClick={onClose} className="rounded-2xl border border-slate-200 px-3 py-3">
                                    Refunds
                                </Link>
                            </div>
                        </div>

                        {user && (
                            <div className="border-t border-slate-100 p-5">
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
                                >
                                    <FaSignOutAlt />
                                    Logout
                                </button>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileNavDrawer;
