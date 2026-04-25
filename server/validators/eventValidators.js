const { z } = require('zod');
const { objectIdSchema, paginationQuerySchema } = require('./common');

const baseEventBody = z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(2000),
    date: z.string().min(1),
    location: z.string().trim().min(2).max(200),
    stateCode: z.string().trim().min(2).max(4),
    district: z.string().trim().min(1).max(120),
    city: z.string().trim().max(80).optional().default(''),
    country: z.string().trim().optional().default('India'),
    category: z.string().trim().min(1).max(80),
    totalSeats: z.coerce.number().int().positive(),
    ticketPrice: z.coerce.number().min(0),
    image: z.string().trim().optional().default('')
});

const eventQuerySchema = {
    query: paginationQuerySchema.extend({
        category: z.string().trim().optional(),
        search: z.string().trim().optional(),
        date: z.string().trim().optional(),
        sort: z.enum(['date', 'price-low', 'price-high', 'recent']).optional().default('date')
    })
};

const eventIdSchema = {
    params: z.object({
        id: objectIdSchema
    })
};

const createEventSchema = {
    body: baseEventBody
};

const updateEventSchema = {
    params: z.object({
        id: objectIdSchema
    }),
    body: baseEventBody.partial().refine((value) => Object.keys(value).length > 0, {
        message: 'Provide at least one field to update'
    })
};

module.exports = {
    createEventSchema,
    eventIdSchema,
    eventQuerySchema,
    updateEventSchema
};
