import axios from 'axios';

const isLocalHttpUrl = (urlString) => {
    try {
        const u = new URL(urlString);
        return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
    } catch {
        return false;
    }
};

/**
 * When the app is served over HTTPS (tunnel, preview host, etc.), the browser blocks
 * requests to http://localhost (mixed content). Prefer same-origin `/api` so Vite's proxy
 * can reach the backend without exposing HTTP to the page.
 */
const resolveBaseURL = () => {
    const raw = import.meta.env.VITE_API_URL?.trim();
    if (!raw) return '/api';

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && isLocalHttpUrl(raw)) {
        if (import.meta.env.DEV) {
            console.warn(
                '[Vireon] VITE_API_URL is HTTP localhost but the page is HTTPS — browsers block that (mixed content). Using same-origin /api (Vite dev proxy). Remove VITE_API_URL for local dev, or set it to an HTTPS API URL.'
            );
        }
        return '/api';
    }

    const base = raw.replace(/\/$/, '');
    if (/\/api$/i.test(base)) {
        return `${base}/`;
    }
    return `${base}/api/`;
};

const api = axios.create({
    baseURL: resolveBaseURL()
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
