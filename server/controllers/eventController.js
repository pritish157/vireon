const Event = require('../models/Event');

const validateEventPayload = (payload, { isUpdate = false } = {}) => {
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
            errors.push('Location must be between 2 and 200 characters');
        } else {
            normalized.location = location;
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
        } else if (eventDate < new Date()) {
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

        const { errors, normalized } = validateEventPayload(req.body, { isUpdate: true });
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
