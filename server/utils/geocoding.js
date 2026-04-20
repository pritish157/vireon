const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const DEFAULT_HEADERS = {
    'Accept-Language': 'en',
    'User-Agent': 'Vireon/1.0 (location-personalization)'
};

const getFetch = () => {
    if (typeof fetch !== 'function') {
        throw new Error('Global fetch is not available in this Node.js runtime');
    }

    return fetch;
};

const normalizeRegion = (address = {}) => {
    const city = [
        address.city,
        address.town,
        address.village,
        address.municipality,
        address.suburb
    ]
        .find((value) => String(value || '').trim());

    const district = [
        address.county,
        address.district,
        address.state_district,
        address.region
    ]
        .find((value) => String(value || '').trim());

    const state = [
        address.state,
        address['ISO3166-2-lvl4']
    ]
        .find((value) => String(value || '').trim());

    const country = String(address.country || '').trim();

    return {
        city: String(city || '').trim(),
        district: String(district || '').trim(),
        state: String(state || '').trim(),
        country
    };
};

const buildUrl = (pathname, params) => {
    const url = new URL(pathname, NOMINATIM_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });
    return url;
};

const fetchJson = async (url) => {
    const response = await getFetch()(url, { headers: DEFAULT_HEADERS });
    if (!response.ok) {
        throw new Error(`Geocoding request failed with status ${response.status}`);
    }
    return response.json();
};

const reverseGeocodeCoordinates = async ({ latitude, longitude }) => {
    const url = buildUrl('/reverse', {
        format: 'jsonv2',
        lat: latitude,
        lon: longitude,
        addressdetails: 1,
        zoom: 10
    });

    const payload = await fetchJson(url);
    const normalized = normalizeRegion(payload.address);

    if (!normalized.state && !normalized.district && !normalized.city) {
        throw new Error('Unable to resolve a location from the provided coordinates');
    }

    if (!normalized.country && payload.address) {
        normalized.country = String(payload.address.country || '').trim();
    }

    return normalized;
};

const geocodeLocationText = async (location) => {
    const url = buildUrl('/search', {
        q: location,
        format: 'jsonv2',
        addressdetails: 1,
        limit: 1
    });

    const payload = await fetchJson(url);
    const firstResult = Array.isArray(payload) ? payload[0] : null;

    if (!firstResult) {
        return { city: '', district: '', state: '', country: '' };
    }

    return normalizeRegion(firstResult.address);
};

const enrichEventLocationData = async (location) => {
    if (!String(location || '').trim()) {
        return { city: '', district: '', state: '', country: '' };
    }

    try {
        return await geocodeLocationText(location);
    } catch (error) {
        console.warn(`Failed to geocode event location "${location}":`, error.message);
        return { city: '', district: '', state: '', country: '' };
    }
};

module.exports = {
    reverseGeocodeCoordinates,
    geocodeLocationText,
    enrichEventLocationData
};
