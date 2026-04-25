const { z } = require('zod');
const { objectIdSchema, paginationQuerySchema } = require('./common');
const { createEventSchema } = require('./eventValidators');

const createClientEventSchema = createEventSchema;

const requestClientEventEditSchema = {
    params: z.object({
        eventId: objectIdSchema
    }),
    body: createEventSchema.body.partial().extend({
        editRequestReason: z.string().trim().min(15).max(1000)
    }).refine((value) => Object.keys(value).some((key) => key !== 'editRequestReason'), {
        message: 'Provide at least one field to update'
    })
};

const adminClientRequestsQuerySchema = {
    query: paginationQuerySchema.extend({
        status: z.enum(['pending', 'approved', 'rejected']).optional()
    })
};

const reviewClientEventRequestSchema = {
    params: z.object({
        requestId: objectIdSchema
    }),
    body: z.object({
        action: z.enum(['approve', 'reject']).optional(),
        status: z.enum(['APPROVED', 'REJECTED']).optional(),
        reviewNote: z.string().trim().max(1000).optional().default('')
    }).refine((value) => value.action || value.status, {
        message: 'Provide action or status'
    })
};

module.exports = {
    adminClientRequestsQuerySchema,
    createClientEventSchema,
    requestClientEventEditSchema,
    reviewClientEventRequestSchema
};
