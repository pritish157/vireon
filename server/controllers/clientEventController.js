const Event = require('../models/Event');
const User = require('../models/User');
const ClientEventRequest = require('../models/ClientEventRequest');
const { sendClientEventApprovalEmail, sendClientEventDecisionEmail } = require('../utils/email');
const { validateEventPayload, coerceProposedEventSnapshotForIndia } = require('../utils/eventPayload');

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
    const src = typeof raw.toObject === 'function' ? raw.toObject() : raw;
    const patch = {};
    for (const key of CLIENT_EVENT_PATCH_KEYS) {
        if (Object.prototype.hasOwnProperty.call(src, key) && src[key] !== undefined) {
            patch[key] = src[key];
        }
    }
    return patch;
};

const parseReviewBody = (body) => {
    const raw = body && typeof body === 'object' ? body : {};
    let action = typeof raw.action === 'string' ? raw.action.trim().toLowerCase() : '';
    const statusUpper = String(raw.status || '').trim().toUpperCase();
    if (!action && statusUpper === 'APPROVED') action = 'approve';
    if (!action && statusUpper === 'REJECTED') action = 'reject';
    if (action !== 'approve' && action !== 'reject') {
        return { action: null, reviewNote: '' };
    }
    const reviewNote = String(raw.reviewNote ?? '').trim();
    return { action, reviewNote };
};

const getAdminRecipientEmails = async () => {
    const adminUsers = await User.find({ role: 'admin' }).select('email');
    const adminEmailsFromUsers = adminUsers.map((admin) => String(admin.email || '').trim().toLowerCase()).filter(Boolean);
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

exports.getMyClientEventsDashboard = async (req, res) => {
    try {
        const [events, requests] = await Promise.all([
            Event.find({ clientOwner: req.user.id }).sort({ createdAt: -1 }),
            ClientEventRequest.find({ submittedBy: req.user.id })
                .populate('eventId', 'title date location category totalSeats availableSeats ticketPrice')
                .populate('approvedEventId', 'title date location category totalSeats availableSeats ticketPrice')
                .populate('reviewedBy', 'name email')
                .sort({ createdAt: -1 })
        ]);

        res.json({ events, requests });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createClientEventRequest = async (req, res) => {
    try {
        const { errors, normalized } = validateEventPayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
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

        res.status(201).json({
            message: 'Event registration request submitted for admin approval',
            request
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.requestClientEventEdit = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (String(event.clientOwner) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You can only request edits for your own events' });
        }

        const pendingEdit = await ClientEventRequest.findOne({
            submittedBy: req.user.id,
            eventId: event._id,
            requestType: 'edit',
            status: 'pending'
        });

        if (pendingEdit) {
            return res.status(400).json({ message: 'You already have a pending edit request for this event' });
        }

        const editRequestReason = String(req.body.editRequestReason || '').trim();
        if (editRequestReason.length < 15) {
            return res.status(400).json({ message: 'Please describe what you want to edit and why (at least 15 characters)' });
        }

        const { errors, normalized } = validateEventPayload(req.body, { isUpdate: true });
        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0], errors });
        }

        if (Object.keys(normalized).length === 0) {
            return res.status(400).json({ message: 'Please provide at least one field to update' });
        }

        if (typeof normalized.totalSeats === 'number') {
            const confirmedSeats = event.totalSeats - event.availableSeats;
            if (normalized.totalSeats < confirmedSeats) {
                return res.status(400).json({ message: 'Total seats cannot be less than already confirmed bookings' });
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

        res.status(201).json({
            message: 'Event edit request submitted for admin approval',
            request
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getClientEventRequestsForAdmin = async (req, res) => {
    try {
        const filters = {};
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (req.query.status && validStatuses.includes(req.query.status)) {
            filters.status = req.query.status;
        }

        const requests = await ClientEventRequest.find(filters)
            .populate('submittedBy', 'name email')
            .populate('eventId', 'title date location category totalSeats availableSeats ticketPrice')
            .populate('approvedEventId', 'title date location category totalSeats availableSeats ticketPrice')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.reviewClientEventRequest = async (req, res) => {
    try {
        const { action, reviewNote } = parseReviewBody(req.body);
        if (!action) {
            return res.status(400).json({
                success: false,
                message: "Provide status: APPROVED | REJECTED, or action: approve | reject"
            });
        }

        const request = await ClientEventRequest.findById(req.params.requestId).populate('submittedBy', 'name email');
        if (!request) {
            return res.status(404).json({ success: false, message: 'Client event request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'This request has already been reviewed' });
        }

        let approvedEvent = null;

        if (action === 'approve') {
            if (request.requestType === 'create') {
                const proposed = coerceProposedEventSnapshotForIndia(request.proposedEventData);
                const { errors, normalized } = validateEventPayload(proposed, { allowPastEventDate: true });
                if (errors.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot approve: ${errors[0]}`,
                        errors
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
                    return res.status(404).json({ success: false, message: 'Original event for edit request was not found' });
                }

                if (String(event.clientOwner) !== String(request.submittedBy._id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Event ownership mismatch. Cannot approve this edit request'
                    });
                }

                const patch = pickClientEventPatch(request.proposedEventData);
                const eventPlain = event.toObject();
                const merged = { ...eventPlain, ...patch };
                const coerced = coerceProposedEventSnapshotForIndia(merged);
                const { errors, normalized } = validateEventPayload(coerced, { allowPastEventDate: true });
                if (errors.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot approve: ${errors[0]}`,
                        errors
                    });
                }

                const confirmedSeats = event.totalSeats - event.availableSeats;
                if (normalized.totalSeats < confirmedSeats) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot approve: total seats cannot be less than already confirmed bookings'
                    });
                }
                normalized.availableSeats = normalized.totalSeats - confirmedSeats;

                Object.assign(event, normalized);
                await event.save();
                approvedEvent = event;
            }
        }

        request.status = action === 'approve' ? 'approved' : 'rejected';
        request.reviewNote = String(reviewNote || '').trim();
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        if (approvedEvent) {
            request.approvedEventId = approvedEvent._id;
        }
        await request.save();

        await sendClientEventDecisionEmail({
            clientEmail: request.submittedBy?.email,
            clientName: request.submittedBy?.name,
            eventTitle: approvedEvent?.title || request.proposedEventData?.title || request.eventId?.title || 'Your event',
            requestType: request.requestType,
            action,
            reviewNote: request.reviewNote
        });

        const message =
            action === 'approve' ? 'Event approved successfully' : 'Event request rejected successfully';

        res.json({
            success: true,
            message,
            request,
            approvedEvent: action === 'approve' ? approvedEvent : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
