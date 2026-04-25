const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    isVerified: { type: Boolean, default: false, index: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    city: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    stateCode: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpiry: { type: Date, default: null, select: false }
}, { timestamps: true });

userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
