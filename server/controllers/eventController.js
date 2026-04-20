const Event = require('../models/Event');
const User = require('../models/User');
const { validateEventPayload } = require('../utils/eventPayload');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDateRangeFilter = (dateStr) => {
    const selectedDate = new Date(dateStr);
    if (Number.isNaN(selectedDate.getTime())) {
        return null;
    }
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    return { date: { $gte: startOfDay, $lte: endOfDay } };
};

exports.getEvents = async (req, res) => {
    try {
        const filters = {};
        if (req.query.category) filters.category = req.query.category;
        if (req.query.search) filters.title = { $regex: req.query.search, $options: 'i' };

        const events = await Event.find(filters).populate('createdBy', 'name email');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getNearbyEvents = async (req, res) => {
    try {
        if (req.user.role === 'client') {
            return res.status(403).json({ message: 'Client organizer accounts do not use nearby attendee events' });
        }

        const user = await User.findById(req.user.id).select('city district state stateCode country');

        const commonParts = [];
        if (req.query.category) {
            commonParts.push({ category: req.query.category });
        }
        if (req.query.date) {
            const dr = buildDateRangeFilter(req.query.date);
            if (!dr) {
                return res.status(400).json({ message: 'Please provide a valid date filter' });
            }
            commonParts.push(dr);
        }

        const withCommon = (regionFilter) =>
            commonParts.length ? { $and: [regionFilter, ...commonParts] } : regionFilter;

        const run = async (regionFilter) =>
            Event.find(withCommon(regionFilter)).populate('createdBy', 'name email').sort({ date: 1 });

        const stateCode = String(user?.stateCode || '').trim();
        const district = String(user?.district || '').trim();
        const stateName = String(user?.state || '').trim();
        const city = String(user?.city || '').trim();

        if (stateCode && district) {
            let events = await run({ stateCode, district });
            if (events.length === 0) {
                events = await run({ stateCode });
            }
            return res.json(events);
        }

        if (stateName && district) {
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
            let events = await run({ $and: [stateMatch, { $or: localityClauses }] });
            if (events.length === 0) {
                events = await run(stateMatch);
            }
            return res.json(events);
        }

        if (stateCode) {
            const events = await run({ stateCode });
            return res.json(events);
        }

        if (stateName) {
            const events = await run({ state: new RegExp(`^${escapeRegex(stateName)}$`, 'i') });
            return res.json(events);
        }

        return res.json([]);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { errors, normalized } = validateEventPayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
        }

        const event = await Event.create({
            ...normalized,
            availableSeats: normalized.totalSeats,
            createdBy: req.user.id
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const existingEvent = await Event.findById(req.params.id);
        if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

        const body = { ...req.body };
        if (Object.prototype.hasOwnProperty.call(body, 'stateCode') && !Object.prototype.hasOwnProperty.call(body, 'district')) {
            body.district = existingEvent.district;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'district') && !Object.prototype.hasOwnProperty.call(body, 'stateCode')) {
            body.stateCode = existingEvent.stateCode;
        }

        const { errors, normalized } = validateEventPayload(body, { isUpdate: true });
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
        }

        if (typeof normalized.totalSeats === 'number') {
            const confirmedSeats = existingEvent.totalSeats - existingEvent.availableSeats;
            if (normalized.totalSeats < confirmedSeats) {
                return res.status(400).json({ message: 'Total seats cannot be less than already confirmed bookings' });
            }
            normalized.availableSeats = normalized.totalSeats - confirmedSeats;
        }

        Object.assign(existingEvent, normalized);
        await existingEvent.save();

        res.json(existingEvent);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
