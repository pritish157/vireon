import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

export default function useIsMobileViewport() {
    const getMatches = () => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false;
        }
        return window.matchMedia(MOBILE_QUERY).matches;
    };

    const [isMobile, setIsMobile] = useState(getMatches);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined;
        }

        const mediaQuery = window.matchMedia(MOBILE_QUERY);
        const handleChange = (event) => setIsMobile(event.matches);

        setIsMobile(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    return isMobile;
}
