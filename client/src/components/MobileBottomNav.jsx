import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaChartPie, FaHome, FaTicketAlt, FaUserCircle } from 'react-icons/fa';
import { AuthContext } from '../context/authContext';
import { getBookingsPath, getDashboardPath, getProfilePath, shouldShowMobileChrome } from '../utils/mobileNavigation';

const itemClassName = (active) => `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
    active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500'
}`;

const MobileBottomNav = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const isEventDetail = location.pathname.startsWith('/events/') || location.pathname.startsWith('/event/');

    if (!shouldShowMobileChrome(location.pathname) || isEventDetail) {
        return null;
    }

    const bookingsPath = getBookingsPath(user);
    const dashboardPath = getDashboardPath(user);
    const profilePath = getProfilePath();
    const isEventsActive = location.pathname === '/events' || location.pathname.startsWith('/events/') || location.pathname.startsWith('/event/');
    const isBookingsActive = location.pathname === bookingsPath;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
            <motion.nav
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="pointer-events-auto mx-auto flex max-w-md items-center gap-1 rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-[0_22px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
            >
                <button type="button" onClick={() => navigate('/')} className={itemClassName(location.pathname === '/')}>
                    <FaHome className="text-base" />
                    <span>Home</span>
                </button>
                <button type="button" onClick={() => navigate('/events')} className={itemClassName(isEventsActive)}>
                    <FaCalendarAlt className="text-base" />
                    <span>Events</span>
                </button>
                <button type="button" onClick={() => navigate(bookingsPath)} className={itemClassName(isBookingsActive)}>
                    <FaTicketAlt className="text-base" />
                    <span>Bookings</span>
                </button>
                <button type="button" onClick={() => navigate(dashboardPath)} className={itemClassName(location.pathname === dashboardPath)}>
                    <FaChartPie className="text-base" />
                    <span>Dashboard</span>
                </button>
                <button
                    type="button"
                    onClick={() => navigate(profilePath)}
                    className={itemClassName(location.pathname === profilePath)}
                >
                    <FaUserCircle className="text-base" />
                    <span>Profile</span>
                </button>
            </motion.nav>
        </div>
    );
};

export default MobileBottomNav;
