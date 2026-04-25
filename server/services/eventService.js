const Event = require('../models/Event');
const { parsePagination } = require('../utils/query');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSortOption = (sort) => {
    if (sort === 'price-low') return { ticketPrice: 1, date: 1 };
    if (sort === 'price-high') return { ticketPrice: -1, date: 1 };
    if (sort === 'recent') return { createdAt: -1 };
    return { date: 1 };
};

const buildEventFilters = ({ category, search, date }) => {
    const filters = {};

    if (category) {
        filters.category = category;
    }

    if (search) {
        const safeSearch = escapeRegex(search);
        filters.$or = [
            { title: { $regex: safeSearch, $options: 'i' } },
            { location: { $regex: safeSearch, $options: 'i' } },
            { city: { $regex: safeSearch, $options: 'i' } },
            { district: { $regex: safeSearch, $options: 'i' } },
            { state: { $regex: safeSearch, $options: 'i' } }
        ];
    }

    if (date) {
        const eventDate = new Date(date);
        if (!Number.isNaN(eventDate.getTime())) {
            const startOfDay = new Date(eventDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(eventDate);
            endOfDay.setHours(23, 59, 59, 999);
            filters.date = { $gte: startOfDay, $lte: endOfDay };
        }
    }

    return filters;
};

const getPaginatedEvents = async ({ filters, query, populateCreatedBy = true }) => {
    const pagination = parsePagination(query);
    const mongoQuery = Event.find(filters);

    if (populateCreatedBy) {
        mongoQuery.populate('createdBy', 'name email');
    }

    mongoQuery.sort(getSortOption(query.sort));

    if (pagination.enabled) {
        mongoQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [items, total] = await Promise.all([
        mongoQuery.lean(),
        pagination.enabled ? Event.countDocuments(filters) : Promise.resolve(null)
    ]);

    return {
        items,
        pagination: pagination.enabled
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / pagination.limit))
            }
            : null
    };
};

module.exports = {
    buildEventFilters,
    escapeRegex,
    getPaginatedEvents,
    getSortOption
};
