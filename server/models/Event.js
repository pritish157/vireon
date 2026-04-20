const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: '', index: true },
    district: { type: String, trim: true, default: '', index: true },
    stateCode: { type: String, trim: true, default: '', index: true },
    state: { type: String, trim: true, default: '', index: true },
    country: { type: String, trim: true, default: 'India' },
    category: { type: String, required: true, trim: true },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    image: { type: String },
    ticketPrice: { type: Number, required: true, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
