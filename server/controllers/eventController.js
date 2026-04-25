const Event = require('../models/Event');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const { validateEventPayload } = require('../utils/eventPayload');
const { buildEventFilters, escapeRegex, getPaginatedEvents, getSortOption } = require('../services/eventService');
const { parsePagination } = require('../utils/query');

const paginateArray = (items, pagination) => {
    if (!pagination.enabled) {
        return { items, meta: null };
    }

    const pagedItems = items.slice(pagination.skip, pagination.skip + pagination.limit);
    return {
        items: pagedItems,
        meta: {
            page: pagination.page,
            limit: pagination.limit,
            total: items.length,
            totalPages: Math.max(1, Math.ceil(items.length / pagination.limit))
        }
    };
};

exports.getEvents = asyncHandler(async (req, res) => {
    const filters = buildEventFilters(req.query);
    const { items, pagination } = await getPaginatedEvents({ filters, query: req.query });

    return sendSuccess(res, {
        message: 'Events fetched successfully',
        data: items,
        pagination
    });
});

exports.getNearbyEvents = asyncHandler(async (req, res) => {
    if (req.user.role === 'client') {
        throw new AppError(403, 'Client organizer accounts do not use nearby attendee events', {
            code: 'CLIENT_NEARBY_DISABLED'
        });
    }

    const user = await User.findById(req.user.id).select('city district state stateCode country').lean();

    if (!user) {
        throw new AppError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    const commonFilters = buildEventFilters(req.query);
    const commonFilterEntries = Object.entries(commonFilters);

    const withCommon = (regionFilter) => {
        if (commonFilterEntries.length === 0) {
            return regionFilter;
        }
        return { $and: [regionFilter, commonFilters] };
    };

    const run = async (regionFilter) =>
        Event.find(withCommon(regionFilter))
            .populate('createdBy', 'name email')
            .sort(getSortOption(req.query.sort))
            .lean();

    const stateCode = String(user.stateCode || '').trim();
    const district = String(user.district || '').trim();
    const stateName = String(user.state || '').trim();
    const city = String(user.city || '').trim();

    let items = [];

    if (stateCode && district) {
        items = await run({ stateCode, district });
        if (items.length === 0) {
            items = await run({ stateCode });
        }
    } else if (stateName && district) {
        const stateMatch = { state: new RegExp(`^${escapeRegex(stateName)}$`, 'i') };
        const localityClauses = [
            { district: new RegExp(`^${escapeRegex(district)}$`, 'i') },
            ...(city
                ? [
                    { city: new RegExp(`^${escapeRegex(city)}$`, 'i') },
                    { location: new RegExp(escapeRegex(city), 'i') }
                ]
                : [])
        ];

        items = await run({ $and: [stateMatch, { $or: localityClauses }] });
        if (items.length === 0) {
            items = await run(stateMatch);
        }
    } else if (stateCode) {
        items = await run({ stateCode });
    } else if (stateName) {
        items = await run({ state: new RegExp(`^${escapeRegex(stateName)}$`, 'i') });
    }

    const pagination = parsePagination(req.query);
    const paged = paginateArray(items, pagination);

    return sendSuccess(res, {
        message: 'Nearby events fetched successfully',
        data: paged.items,
        pagination: paged.meta
    });
});

exports.getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email').lean();

    if (!event) {
        throw new AppError(404, 'Event not found', { code: 'EVENT_NOT_FOUND' });
    }

    return sendSuccess(res, {
        message: 'Event fetched successfully',
        data: event
    });
});

exports.createEvent = asyncHandler(async (req, res) => {
    const { errors, normalized } = validateEventPayload(req.body);

    if (errors.length > 0) {
        throw new AppError(400, errors[0], { code: 'INVALID_EVENT_PAYLOAD', details: errors });
    }

    const event = await Event.create({
        ...normalized,
        availableSeats: normalized.totalSeats,
        createdBy: req.user.id
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: 'Event created successfully',
        data: event.toObject()
    });
});

exports.updateEvent = asyncHandler(async (req, res) => {
    const existingEvent = await Event.findById(req.params.id);

    if (!existingEvent) {
        throw new AppError(404, 'Event not found', { code: 'EVENT_NOT_FOUND' });
    }

    const body = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(body, 'stateCode') && !Object.prototype.hasOwnProperty.call(body, 'district')) {
        body.district = existingEvent.district;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'district') && !Object.prototype.hasOwnProperty.call(body, 'stateCode')) {
        body.stateCode = existingEvent.stateCode;
    }

    const { errors, normalized } = validateEventPayload(body, { isUpdate: true });
    if (errors.length > 0) {
        throw new AppError(400, errors[0], { code: 'INVALID_EVENT_PAYLOAD', details: errors });
    }

    if (typeof normalized.totalSeats === 'number') {
        const confirmedSeats = existingEvent.totalSeats - existingEvent.availableSeats;
        if (normalized.totalSeats < confirmedSeats) {
            throw new AppError(400, 'Total seats cannot be less than already confirmed bookings', {
                code: 'INVALID_SEAT_COUNT'
            });
        }
        normalized.availableSeats = normalized.totalSeats - confirmedSeats;
    }

    Object.assign(existingEvent, normalized);
    await existingEvent.save();

    return sendSuccess(res, {
        message: 'Event updated successfully',
        data: existingEvent.toObject()
    });
});

exports.deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
        throw new AppError(404, 'Event not found', { code: 'EVENT_NOT_FOUND' });
    }

    return sendSuccess(res, {
        message: 'Event deleted successfully'
    });
});
