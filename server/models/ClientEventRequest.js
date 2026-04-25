const mongoose = require('mongoose');

const clientEventRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        enum: ['create', 'edit'],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null,
        index: true
    },
    approvedEventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    },
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

clientEventRequestSchema.index({ submittedBy: 1, createdAt: -1 });
clientEventRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ClientEventRequest', clientEventRequestSchema);
