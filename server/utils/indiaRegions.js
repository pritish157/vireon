const { getAllStates, getDistricts } = require('india-state-district');

const norm = (s) =>
    String(s || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s_]+/g, ' ')
        .trim();

const STATE_NAME_ALIASES = {
    orissa: 'OD',
    'nct of delhi': 'DL',
    delhi: 'DL',
    'dadra and nagar haveli and daman and diu': 'DH',
    'jammu and kashmir': 'JK',
    ladakh: 'LA',
    pondicherry: 'PY',
    puducherry: 'PY',
    telangana: 'TG',
    'uttaranchal': 'UK',
    uttarakhand: 'UK'
};

const getStateName = (stateCode) => {
    const row = getAllStates().find((s) => s.code === stateCode);
    return row ? row.name : '';
};

const isValidIndianRegion = (stateCode, district) => {
    if (!stateCode || !district) return false;
    const list = getDistricts(stateCode);
    const nd = norm(district);
    return list.some((d) => d === district || norm(d) === nd);
};

const findStateCodeFromGeocoderState = (stateName) => {
    if (!stateName) return null;
    const n = norm(stateName);
    const aliasCode = STATE_NAME_ALIASES[n];
    if (aliasCode && getDistricts(aliasCode).length) return aliasCode;

    const states = getAllStates();
    const exact = states.find((s) => norm(s.name) === n);
    if (exact) return exact.code;

    const partial = states.find((s) => n.includes(norm(s.name)) || norm(s.name).includes(n));
    if (partial) return partial.code;

    return null;
};

const findCanonicalDistrict = (stateCode, geocoderDistrict) => {
    if (!stateCode || !geocoderDistrict) return null;
    const list = getDistricts(stateCode);
    if (!list.length) return null;

    const n = norm(geocoderDistrict);
    const direct = list.find((d) => norm(d) === n);
    if (direct) return direct;

    const nBangalore = n.replace(/bengaluru/g, 'bangalore');
    const bang = list.find((d) => norm(d) === nBangalore);
    if (bang) return bang;

    const strip = (x) => norm(x).replace(/\s+/g, '');
    const strippedMatch = list.find((d) => strip(d) === strip(geocoderDistrict));
    if (strippedMatch) return strippedMatch;

    const sub = list.find((d) => n.includes(norm(d)) || norm(d).includes(n));
    if (sub) return sub;

    return null;
};

const resolveIndiaFromGeocodeParts = ({ state: geoState, district: geoDistrict, city: geoCity, country: geoCountry }) => {
    const country = String(geoCountry || 'India').trim() || 'India';
    if (norm(country) !== 'india') {
        return {
            country,
            stateCode: '',
            state: String(geoState || '').trim(),
            district: String(geoDistrict || '').trim(),
            city: String(geoCity || '').trim(),
            matched: false
        };
    }

    const stateCode = findStateCodeFromGeocoderState(geoState);
    if (!stateCode) {
        return {
            country,
            stateCode: '',
            state: String(geoState || '').trim(),
            district: String(geoDistrict || '').trim(),
            city: String(geoCity || '').trim(),
            matched: false
        };
    }

    const districtCanon = findCanonicalDistrict(stateCode, geoDistrict) || '';
    return {
        country,
        stateCode,
        state: getStateName(stateCode),
        district: districtCanon,
        city: String(geoCity || '').trim(),
        matched: Boolean(districtCanon)
    };
};

module.exports = {
    getAllStates,
    getDistricts,
    getStateName,
    isValidIndianRegion,
    resolveIndiaFromGeocodeParts,
    findStateCodeFromGeocoderState,
    findCanonicalDistrict
};
