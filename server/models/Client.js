const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'client', index: true },
    isVerified: { type: Boolean, default: false, index: true },
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpiry: { type: Date, default: null, select: false }
}, { timestamps: true });

clientSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Client', clientSchema);
