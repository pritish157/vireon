import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';
import { FaTicketAlt, FaUser, FaSignOutAlt, FaBars, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';
import MobileNavDrawer from './MobileNavDrawer';
import { getDashboardPath, getMobilePageTitle, shouldShowMobileChrome } from '../utils/mobileNavigation';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { locationLabel, hasStoredLocation, openManualLocationModal, savingLocation } = useLocationPreferences();

    const goToEventsSection = () => {
        setIsOpen(false);
        setShowUserMenu(false);

        if (location.pathname === '/' && window.innerWidth >= 768) {
            const section = document.getElementById('events-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        navigate('/events');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsOpen(false);
        setShowUserMenu(false);
    };

    const dashboardPath = getDashboardPath(user);
    const showMobileChrome = shouldShowMobileChrome(location.pathname);
    const mobilePageTitle = getMobilePageTitle(location.pathname);

    useEffect(() => {
        const openDrawer = () => setIsOpen(true);
        window.addEventListener('vireon:open-mobile-drawer', openDrawer);
        return () => window.removeEventListener('vireon:open-mobile-drawer', openDrawer);
    }, []);

    useEffect(() => {
        if (!isOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    return (
        <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="hidden justify-between items-center py-4 md:flex">
                    {/* Logo */}
                    <Link to="/" className="text-white text-2xl font-bold flex items-center gap-2 hover:text-blue-400 transition" onClick={() => { setIsOpen(false); setShowUserMenu(false); }}>
                        <FaTicketAlt /> Vireon
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={goToEventsSection} className="text-gray-200 hover:text-white transition font-medium">
                            Events
                        </button>

                        {user && user.role !== 'client' && (
                            <button
                                type="button"
                                onClick={openManualLocationModal}
                                disabled={savingLocation}
                                className="flex max-w-[220px] items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-3 pr-2 text-left text-sm text-gray-100 transition hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
                            >
                                <FaMapMarkerAlt className="shrink-0 text-blue-300" />
                                <span className="min-w-0 flex-1 truncate font-medium">
                                    {hasStoredLocation ? locationLabel : 'Select location'}
                                </span>
                                <FaChevronDown className="shrink-0 text-[10px] opacity-70" />
                            </button>
                        )}
                        
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                                >
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <FaUser className="text-sm" />
                                    </div>
                                    <span className="font-medium hidden sm:block">{user.name}</span>
                                </button>
                                
                                {/* User Dropdown Menu */}
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <p className="font-bold text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                            <p className="text-xs text-blue-600 font-semibold uppercase mt-1">{user.role}</p>
                                        </div>
                                <Link
                                    to={dashboardPath}
                                    className="block px-4 py-3 text-gray-900 hover:bg-gray-100 font-medium transition"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setShowUserMenu(false);
                                    }}
                                >
                                    Dashboard
                                </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium transition flex items-center gap-2"
                                        >
                                            <FaSignOutAlt /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/client/login" className="text-gray-200 hover:text-white transition font-semibold px-3 py-2 text-sm border border-gray-600 rounded-lg hover:border-gray-400">
                                    Client Portal
                                </Link>
                                <Link to="/login" className="text-gray-200 hover:text-white transition font-semibold px-4 py-2">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                </div>

                {showMobileChrome && (
                    <div className="md:hidden py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <Link
                                    to="/"
                                    className="inline-flex items-center gap-2 text-white text-xl font-black tracking-tight"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setShowUserMenu(false);
                                    }}
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-base shadow-inner shadow-white/5">
                                        <FaTicketAlt />
                                    </span>
                                    Vireon
                                </Link>
                                <p className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-white/45">
                                    {mobilePageTitle}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {user && user.role !== 'client' && (
                                    <button
                                        type="button"
                                        onClick={openManualLocationModal}
                                        disabled={savingLocation}
                                        className="flex max-w-[170px] items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-left text-xs font-semibold text-white/90 backdrop-blur disabled:opacity-60"
                                    >
                                        <FaMapMarkerAlt className="shrink-0 text-blue-300" />
                                        <span className="min-w-0 truncate">
                                            {hasStoredLocation ? locationLabel : 'Set location'}
                                        </span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsOpen(true)}
                                    className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white shadow-lg shadow-black/10"
                                    aria-label="Open mobile menu"
                                >
                                    <FaBars />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-white/80 backdrop-blur">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white">
                                        {user ? `Hi, ${user.name.split(' ')[0]}` : 'Plan your next outing'}
                                    </p>
                                    <p className="mt-1 text-xs text-white/55">
                                        {user ? 'Use the bottom nav for quick actions and bookings.' : 'Search, filter, and book events in a thumb-friendly flow.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={goToEventsSection}
                                    className="shrink-0 rounded-2xl bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-900"
                                >
                                    Events
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <MobileNavDrawer
                open={isOpen}
                onClose={() => setIsOpen(false)}
                user={user}
                dashboardPath={dashboardPath}
                locationLabel={locationLabel}
                hasStoredLocation={hasStoredLocation}
                savingLocation={savingLocation}
                onOpenLocation={() => {
                    openManualLocationModal();
                    setIsOpen(false);
                }}
                onGoToEvents={() => {
                    goToEventsSection();
                    setIsOpen(false);
                }}
                onLogout={handleLogout}
            />
        </nav>
    );
};

export default Navbar;
