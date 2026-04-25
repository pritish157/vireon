const Event = require('../models/Event');
const User = require('../models/User');
const ClientEventRequest = require('../models/ClientEventRequest');
const { asyncHandler } = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const { parsePagination } = require('../utils/query');
const {
    sendClientEventApprovalEmail,
    sendClientEventDecisionEmail
} = require('../utils/email');
const {
    validateEventPayload,
    coerceProposedEventSnapshotForIndia
} = require('../utils/eventPayload');

const CLIENT_EVENT_PATCH_KEYS = [
    'title',
    'description',
    'date',
    'stateCode',
    'district',
    'city',
    'location',
    'country',
    'category',
    'totalSeats',
    'ticketPrice',
    'image'
];

const pickClientEventPatch = (raw) => {
    if (!raw || typeof raw !== 'object') {
        return {};
    }

    const source = typeof raw.toObject === 'function' ? raw.toObject() : raw;
    return CLIENT_EVENT_PATCH_KEYS.reduce((accumulator, key) => {
        if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
            accumulator[key] = source[key];
        }
        return accumulator;
    }, {});
};

const parseReviewBody = (body) => {
    let action = typeof body.action === 'string' ? body.action.trim().toLowerCase() : '';
    const statusUpper = String(body.status || '').trim().toUpperCase();

    if (!action && statusUpper === 'APPROVED') action = 'approve';
    if (!action && statusUpper === 'REJECTED') action = 'reject';

    return {
        action,
        reviewNote: String(body.reviewNote || '').trim()
    };
};

const getAdminRecipientEmails = async () => {
    const adminUsers = await User.find({ role: 'admin' }).select('email').lean();
    const adminEmailsFromUsers = adminUsers
        .map((admin) => String(admin.email || '').trim().toLowerCase())
        .filter(Boolean);
    const adminEmailsFromEnv = String(process.env.ADMIN_EMAIL || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    return [...new Set([...adminEmailsFromUsers, ...adminEmailsFromEnv])];
};

const notifyAdminsForRequest = async ({ request, user, eventTitle, editRequestReason = '' }) => {
    const adminEmails = await getAdminRecipientEmails();
    if (adminEmails.length === 0) {
        return;
    }

    await sendClientEventApprovalEmail({
        adminEmails,
        clientName: user.name,
        clientEmail: user.email,
        requestType: request.requestType,
        eventTitle,
        requestId: request._id.toString(),
        editRequestReason
    });
};

exports.getMyClientEventsDashboard = asyncHandler(async (req, res) => {
    const [events, requests] = await Promise.all([
        Event.find({ clientOwner: req.user.id }).sort({ createdAt: -1 }).lean(),
        ClientEventRequest.find({ submittedBy: req.user.id })
            .populate('eventId', 'title date location category totalSeats availableSeats ticketPrice')
            .populate('approvedEventId', 'title date location category totalSeats availableSeats ticketPrice')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean()
    ]);

    return sendSuccess(res, {
        message: 'Client dashboard fetched successfully',
        data: { events, requests }
    });
});

exports.createClientEventRequest = asyncHandler(async (req, res) => {
    const { errors, normalized } = validateEventPayload(req.body);
    if (errors.length > 0) {
        throw new AppError(400, errors[0], { code: 'INVALID_EVENT_PAYLOAD', details: errors });
    }

    const request = await ClientEventRequest.create({
        requestType: 'create',
        submittedBy: req.user.id,
        proposedEventData: normalized,
        status: 'pending'
    });

    await notifyAdminsForRequest({
        request,
        user: req.user,
        eventTitle: normalized.title
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: 'Event registration request submitted for admin approval',
        data: {
            request: request.toObject()
        }
    });
});

exports.requestClientEventEdit = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
        throw new AppError(404, 'Event not found', { code: 'EVENT_NOT_FOUND' });
    }

    if (String(event.clientOwner) !== String(req.user.id)) {
        throw new AppError(403, 'You can only request edits for your own events', {
            code: 'EVENT_OWNERSHIP_REQUIRED'
        });
    }

    const pendingEdit = await ClientEventRequest.findOne({
        submittedBy: req.user.id,
        eventId: event._id,
        requestType: 'edit',
        status: 'pending'
    });

    if (pendingEdit) {
        throw new AppError(409, 'You already have a pending edit request for this event', {
            code: 'PENDING_EDIT_REQUEST_EXISTS'
        });
    }

    const editRequestReason = String(req.body.editRequestReason || '').trim();
    const { errors, normalized } = validateEventPayload(req.body, { isUpdate: true });

    if (errors.length > 0) {
        throw new AppError(400, errors[0], { code: 'INVALID_EVENT_PAYLOAD', details: errors });
    }

    if (Object.keys(normalized).length === 0) {
        throw new AppError(400, 'Please provide at least one field to update', {
            code: 'EMPTY_EDIT_REQUEST'
        });
    }

    if (typeof normalized.totalSeats === 'number') {
        const confirmedSeats = event.totalSeats - event.availableSeats;
        if (normalized.totalSeats < confirmedSeats) {
            throw new AppError(400, 'Total seats cannot be less than already confirmed bookings', {
                code: 'INVALID_SEAT_COUNT'
            });
        }
    }

    const request = await ClientEventRequest.create({
        requestType: 'edit',
        submittedBy: req.user.id,
        eventId: event._id,
        proposedEventData: normalized,
        editRequestReason,
        status: 'pending'
    });

    await notifyAdminsForRequest({
        request,
        user: req.user,
        eventTitle: normalized.title || event.title,
        editRequestReason
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: 'Event edit request submitted for admin approval',
        data: {
            request: request.toObject()
        }
    });
});

exports.getClientEventRequestsForAdmin = asyncHandler(async (req, res) => {
    const filters = {};
    if (req.query.status) {
        filters.status = req.query.status;
    }

    const pagination = parsePagination(req.query);
    const query = ClientEventRequest.find(filters)
        .populate('submittedBy', 'name email')
        .populate('eventId', 'title date location category totalSeats availableSeats ticketPrice')
        .populate('approvedEventId', 'title date location category totalSeats availableSeats ticketPrice')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

    if (pagination.enabled) {
        query.skip(pagination.skip).limit(pagination.limit);
    }

    const [requests, total] = await Promise.all([
        query.lean(),
        pagination.enabled ? ClientEventRequest.countDocuments(filters) : Promise.resolve(null)
    ]);

    return sendSuccess(res, {
        message: 'Client event requests fetched successfully',
        data: requests,
        pagination: pagination.enabled
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / pagination.limit))
            }
            : null
    });
});

exports.reviewClientEventRequest = asyncHandler(async (req, res) => {
    const { action, reviewNote } = parseReviewBody(req.body);
    if (!['approve', 'reject'].includes(action)) {
        throw new AppError(400, 'Provide status: APPROVED | REJECTED, or action: approve | reject', {
            code: 'INVALID_REVIEW_ACTION'
        });
    }

    const request = await ClientEventRequest.findById(req.params.requestId).populate('submittedBy', 'name email');
    if (!request) {
        throw new AppError(404, 'Client event request not found', { code: 'REQUEST_NOT_FOUND' });
    }

    if (request.status !== 'pending') {
        throw new AppError(400, 'This request has already been reviewed', {
            code: 'REQUEST_ALREADY_REVIEWED'
        });
    }

    let approvedEvent = null;

    if (action === 'approve') {
        if (request.requestType === 'create') {
            const proposed = coerceProposedEventSnapshotForIndia(request.proposedEventData);
            const { errors, normalized } = validateEventPayload(proposed, { allowPastEventDate: true });
            if (errors.length > 0) {
                throw new AppError(400, `Cannot approve: ${errors[0]}`, {
                    code: 'INVALID_EVENT_PAYLOAD',
                    details: errors
                });
            }

            approvedEvent = await Event.create({
                ...normalized,
                availableSeats: normalized.totalSeats,
                createdBy: req.user.id,
                clientOwner: request.submittedBy._id
            });
        } else {
            const event = await Event.findById(request.eventId);
            if (!event) {
                throw new AppError(404, 'Original event for edit request was not found', {
                    code: 'EVENT_NOT_FOUND'
                });
            }

            if (String(event.clientOwner) !== String(request.submittedBy._id)) {
                throw new AppError(400, 'Event ownership mismatch. Cannot approve this edit request', {
                    code: 'EVENT_OWNERSHIP_MISMATCH'
                });
            }

            const patch = pickClientEventPatch(request.proposedEventData);
            const merged = { ...event.toObject(), ...patch };
            const coerced = coerceProposedEventSnapshotForIndia(merged);
            const { errors, normalized } = validateEventPayload(coerced, { allowPastEventDate: true });
            if (errors.length > 0) {
                throw new AppError(400, `Cannot approve: ${errors[0]}`, {
                    code: 'INVALID_EVENT_PAYLOAD',
                    details: errors
                });
            }

            const confirmedSeats = event.totalSeats - event.availableSeats;
            if (normalized.totalSeats < confirmedSeats) {
                throw new AppError(400, 'Cannot approve: total seats cannot be less than already confirmed bookings', {
                    code: 'INVALID_SEAT_COUNT'
                });
            }

            normalized.availableSeats = normalized.totalSeats - confirmedSeats;
            Object.assign(event, normalized);
            await event.save();
            approvedEvent = event;
        }
    }

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewNote = reviewNote;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    if (approvedEvent) {
        request.approvedEventId = approvedEvent._id;
    }
    await request.save();

    await sendClientEventDecisionEmail({
        clientEmail: request.submittedBy?.email,
        clientName: request.submittedBy?.name,
        eventTitle: approvedEvent?.title || request.proposedEventData?.title || 'Your event',
        requestType: request.requestType,
        action,
        reviewNote: request.reviewNote
    });

    return sendSuccess(res, {
        message: action === 'approve' ? 'Event approved successfully' : 'Event request rejected successfully',
        data: {
            request: request.toObject(),
            approvedEvent: action === 'approve' ? approvedEvent?.toObject?.() || approvedEvent : null
        }
    });
});
