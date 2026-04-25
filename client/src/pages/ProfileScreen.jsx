import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronRight, FaMapMarkerAlt, FaPowerOff, FaTicketAlt, FaUserCircle } from 'react-icons/fa';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';
import MobileScreenShell from '../components/mobile/MobileScreenShell';
import useIsMobileViewport from '../hooks/useIsMobileViewport';

function MobileProfileScreen() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { locationLabel, hasStoredLocation, openManualLocationModal } = useLocationPreferences();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <MobileScreenShell
            eyebrow="Profile"
            title={user ? user.name : 'Guest profile'}
            subtitle={user ? user.email : 'Login to manage your bookings, preferences, and dashboard access.'}
        >
            <section className="rounded-[26px] border border-white/70 bg-white/95 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-2xl text-white">
                        <FaUserCircle />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-lg font-black text-slate-900">{user ? user.name : 'Not logged in'}</p>
                        <p className="mt-1 truncate text-sm text-slate-500">{user ? user.email : 'Use login to unlock profile settings'}</p>
                        {user && (
                            <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                                {user.role}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-[26px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
                <button
                    type="button"
                    onClick={openManualLocationModal}
                    className="flex w-full items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4"
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                            <FaMapMarkerAlt />
                        </span>
                        <span className="min-w-0 text-left">
                            <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Location</span>
                            <span className="mt-1 block truncate text-sm font-bold text-slate-900">
                                {hasStoredLocation ? locationLabel : 'Choose your district'}
                            </span>
                        </span>
                    </span>
                    <FaChevronRight className="text-slate-300" />
                </button>

                <Link
                    to={user?.role === 'client' ? '/client/dashboard' : user?.role === 'admin' ? '/admin' : '/dashboard'}
                    className="mt-3 flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4"
                >
                    <span className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                            <FaTicketAlt />
                        </span>
                        <span>
                            <span className="block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Dashboard</span>
                            <span className="mt-1 block text-sm font-bold text-slate-900">Open management screen</span>
                        </span>
                    </span>
                    <FaChevronRight className="text-slate-300" />
                </Link>
            </section>

            {user ? (
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-rose-50 px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-rose-600"
                >
                    <FaPowerOff />
                    Logout
                </button>
            ) : (
                <Link
                    to="/login"
                    className="flex w-full items-center justify-center rounded-[24px] bg-slate-900 px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-white"
                >
                    Login
                </Link>
            )}
        </MobileScreenShell>
    );
}

function DesktopProfileScreen() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    React.useEffect(() => {
        navigate(user?.role === 'client' ? '/client/dashboard' : user?.role === 'admin' ? '/admin' : user ? '/dashboard' : '/login', { replace: true });
    }, [navigate, user]);

    return null;
}

export default function ProfileScreen() {
    const isMobile = useIsMobileViewport();

    if (isMobile) {
        return <MobileProfileScreen />;
    }

    return <DesktopProfileScreen />;
}
