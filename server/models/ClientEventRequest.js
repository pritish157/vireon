const mongoose = require('mongoose');

const clientEventRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        enum: ['create', 'edit'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    },
    approvedEventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    },
    // Full event snapshot (region, seats, etc.). Use Mixed so Mongoose does not strip fields
    // like stateCode/district that validateEventPayload requires on admin approval.
    proposedEventData: { type: mongoose.Schema.Types.Mixed, required: true },
    editRequestReason: { type: String, trim: true, default: '' },
    reviewNote: { type: String, trim: true, default: '' },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('ClientEventRequest', clientEventRequestSchema);
