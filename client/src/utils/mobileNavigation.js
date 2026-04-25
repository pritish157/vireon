export const getDashboardPath = (user) => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'client') return '/client/dashboard';
    if (user) return '/dashboard';
    return '/login';
};

export const getBookingsPath = (user) => {
    return '/bookings';
};

export const getProfilePath = () => {
    return '/profile';
};

export const shouldShowMobileChrome = (pathname = '') => {
    const hiddenPrefixes = [
        '/login',
        '/register',
        '/client/login',
        '/client/register',
        '/forgot-password',
        '/reset-password',
        '/payment-success',
        '/payment-failed'
    ];

    return !hiddenPrefixes.some((prefix) => pathname.startsWith(prefix));
};

export const getMobilePageTitle = (pathname = '') => {
    if (pathname === '/') return 'Discover Events';
    if (pathname === '/events') return 'Events';
    if (pathname === '/bookings') return 'Bookings';
    if (pathname === '/profile') return 'Profile';
    if (pathname.startsWith('/events/') || pathname.startsWith('/event/')) return 'Event Details';
    if (pathname === '/dashboard') return 'My Bookings';
    if (pathname === '/client/dashboard') return 'Client Workspace';
    if (pathname === '/admin') return 'Admin Panel';
    if (pathname === '/terms') return 'Terms';
    if (pathname === '/privacy') return 'Privacy';
    if (pathname === '/refund-policy') return 'Refund Policy';
    return 'Vireon';
};
