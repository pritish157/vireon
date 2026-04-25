const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    date: { type: Date, required: true, index: true },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    stateCode: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    category: { type: String, required: true, trim: true, maxlength: 80, index: true },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    ticketPrice: { type: Number, required: true, default: 0, min: 0, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    clientOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null, index: true }
}, { timestamps: true });

eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ stateCode: 1, district: 1, date: 1 });
eventSchema.index({ createdBy: 1, date: -1 });
eventSchema.index({ clientOwner: 1, date: -1 });

module.exports = mongoose.model('Event', eventSchema);
