import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';
import { FaTicketAlt, FaUser, FaSignOutAlt, FaBars, FaTimes, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';

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

        if (location.pathname === '/') {
            const section = document.getElementById('events-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        navigate('/', { state: { scrollToEvents: true } });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsOpen(false);
        setShowUserMenu(false);
    };

    const dashboardPath = user?.role === 'admin'
        ? '/admin'
        : user?.role === 'client'
            ? '/client/dashboard'
            : '/dashboard';

    return (
        <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
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

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-white text-2xl"
                    >
                        {isOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden pb-4 space-y-3">
                        <button onClick={goToEventsSection} className="block text-gray-200 hover:text-white py-2 font-medium text-left w-full">
                            Events
                        </button>

                        {user && user.role !== 'client' && (
                            <button
                                type="button"
                                onClick={() => {
                                    openManualLocationModal();
                                    setIsOpen(false);
                                }}
                                disabled={savingLocation}
                                className="flex w-full items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-left text-sm text-gray-100"
                            >
                                <FaMapMarkerAlt className="text-blue-300" />
                                <span className="min-w-0 flex-1 truncate font-medium">
                                    {hasStoredLocation ? locationLabel : 'Select location'}
                                </span>
                            </button>
                        )}
                        
                        {user ? (
                            <>
                                <div className="py-3 border-t border-gray-700">
                                    <p className="text-white font-bold">{user.name}</p>
                                    <p className="text-gray-300 text-sm">{user.email}</p>
                                </div>
                                <Link
                                    to={dashboardPath}
                                    className="block text-gray-200 hover:text-white py-2 font-medium"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setShowUserMenu(false);
                                    }}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left text-red-400 hover:text-red-300 py-2 font-medium"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/client/login" className="block text-gray-200 hover:text-white py-2 font-medium" onClick={() => setIsOpen(false)}>
                                    Client Portal
                                </Link>
                                <Link to="/login" className="block text-gray-200 hover:text-white py-2 font-medium" onClick={() => setIsOpen(false)}>
                                    Login
                                </Link>
                                <Link to="/register" className="block bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg font-bold text-center transition shadow-lg" onClick={() => setIsOpen(false)}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
