const {
    getStateName,
    isValidIndianRegion,
    findStateCodeFromGeocoderState,
    findCanonicalDistrict
} = require('./indiaRegions');

/**
 * Plain-obj snapshot from ClientEventRequest.proposedEventData (may be partial / legacy).
 * Fills stateCode + canonical district when only legacy state + district strings exist.
 */
const coerceProposedEventSnapshotForIndia = (raw) => {
    if (!raw || typeof raw !== 'object') {
        return {};
    }
    const data = typeof raw.toObject === 'function' ? raw.toObject() : { ...raw };
    const country = String(data.country || 'India').trim() || 'India';
    if (country !== 'India') {
        return data;
    }

    const scExisting = String(data.stateCode || '').trim().toUpperCase();
    const distExisting = String(data.district || '').trim();
    if (scExisting && isValidIndianRegion(scExisting, distExisting)) {
        const canon = findCanonicalDistrict(scExisting, distExisting) || distExisting;
        return {
            ...data,
            country: 'India',
            stateCode: scExisting,
            district: canon,
            state: getStateName(scExisting)
        };
    }

    const code = findStateCodeFromGeocoderState(String(data.state || '').trim());
    const dist = String(data.district || '').trim();
    if (!code || !dist) {
        return { ...data, country: 'India' };
    }
    const canon = findCanonicalDistrict(code, dist);
    if (!canon || !isValidIndianRegion(code, canon)) {
        return { ...data, country: 'India' };
    }
    return {
        ...data,
        country: 'India',
        stateCode: code,
        state: getStateName(code),
        district: canon
    };
};

const isPastCalendarDate = (dateValue) => {
    const eventDate = new Date(dateValue);
    if (Number.isNaN(eventDate.getTime())) {
        return false;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return eventDate < todayStart;
};

const validateEventPayload = (payload, { isUpdate = false, allowPastEventDate = false } = {}) => {
    const errors = [];
    const normalized = {};

    const hasField = (field) => Object.prototype.hasOwnProperty.call(payload, field);

    if (!isUpdate || hasField('title')) {
        const title = String(payload.title || '').trim();
        if (title.length < 3 || title.length > 120) {
            errors.push('Title must be between 3 and 120 characters');
        } else {
            normalized.title = title;
        }
    }

    if (!isUpdate || hasField('description')) {
        const description = String(payload.description || '').trim();
        if (description.length < 10 || description.length > 2000) {
            errors.push('Description must be between 10 and 2000 characters');
        } else {
            normalized.description = description;
        }
    }

    if (!isUpdate || hasField('location')) {
        const location = String(payload.location || '').trim();
        if (location.length < 2 || location.length > 200) {
            errors.push('Venue or address must be between 2 and 200 characters');
        } else {
            normalized.location = location;
        }
    }

    if (!isUpdate || hasField('country')) {
        normalized.country = String(payload.country || 'India').trim() || 'India';
    }

    const countryForRegion = String(
        hasField('country') ? payload.country : normalized.country || 'India'
    ).trim() || 'India';

    if (!isUpdate) {
        if (countryForRegion !== 'India') {
            errors.push('Only India is supported for events at this time');
        } else {
            const stateCode = String(payload.stateCode || '').trim().toUpperCase();
            const district = String(payload.district || '').trim();
            if (!stateCode || stateCode.length < 2 || stateCode.length > 4) {
                errors.push('Please select a valid state');
            } else if (!district) {
                errors.push('Please select a district');
            } else if (!isValidIndianRegion(stateCode, district)) {
                errors.push('District does not belong to the selected state');
            } else {
                normalized.stateCode = stateCode;
                normalized.district = district;
                normalized.state = getStateName(stateCode);
            }
        }
    } else if (hasField('stateCode') || hasField('district')) {
        if (countryForRegion !== 'India') {
            errors.push('Only India is supported for events at this time');
        } else {
            if (hasField('stateCode')) {
                const sc = String(payload.stateCode || '').trim().toUpperCase();
                if (sc && (sc.length < 2 || sc.length > 4)) {
                    errors.push('Invalid state selection');
                } else if (sc) {
                    normalized.stateCode = sc;
                    normalized.state = getStateName(sc);
                }
            }
            if (hasField('district')) {
                normalized.district = String(payload.district || '').trim();
            }
            const scFinal = normalized.stateCode;
            const dFinal = normalized.district;
            if (scFinal && dFinal && !isValidIndianRegion(scFinal, dFinal)) {
                errors.push('District does not belong to the selected state');
            }
        }
    }

    if (!isUpdate || hasField('city')) {
        const city = String(payload.city || '').trim();
        if (city.length > 80) {
            errors.push('City or area must be at most 80 characters');
        } else {
            normalized.city = city;
        }
    }

    if (!isUpdate || hasField('category')) {
        const category = String(payload.category || '').trim();
        if (!category) {
            errors.push('Category is required');
        } else {
            normalized.category = category;
        }
    }

    if (!isUpdate || hasField('date')) {
        const eventDate = new Date(payload.date);
        if (Number.isNaN(eventDate.getTime())) {
            errors.push('Please provide a valid event date');
        } else if (!allowPastEventDate && isPastCalendarDate(payload.date)) {
            errors.push('Event date cannot be in the past');
        } else {
            normalized.date = eventDate;
        }
    }

    if (!isUpdate || hasField('totalSeats')) {
        const totalSeats = Number(payload.totalSeats);
        if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
            errors.push('Total seats must be a positive whole number');
        } else {
            normalized.totalSeats = totalSeats;
        }
    }

    if (!isUpdate || hasField('ticketPrice')) {
        const ticketPrice = Number(payload.ticketPrice ?? 0);
        if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
            errors.push('Ticket price cannot be negative');
        } else {
            normalized.ticketPrice = ticketPrice;
        }
    }

    if (!isUpdate || hasField('image')) {
        normalized.image = String(payload.image || '').trim();
    }

    return { errors, normalized };
};

module.exports = {
    isPastCalendarDate,
    validateEventPayload,
    coerceProposedEventSnapshotForIndia
};
