const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const { env } = require('../config/env');
const { sendOTPEmail } = require('../utils/email');
const { OTP_ACTIONS } = require('../utils/otpActions');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const validatePassword = (password) => /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password || '');

const passwordValidationMessage = 'Password must be at least 6 characters long and include both letters and numbers';

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateAuthToken = ({ id, role }) =>
    jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const generateResetToken = (email) =>
    jwt.sign({ email: normalizeEmail(email) }, env.JWT_SECRET, { expiresIn: env.RESET_TOKEN_EXPIRES_IN });

const hashPassword = async (password) => bcrypt.hash(password, 12);

const comparePassword = async (plainTextPassword, hashedPassword) => bcrypt.compare(plainTextPassword, hashedPassword);

const issueOtp = async ({ email, action, templateType }) => {
    const normalizedEmail = normalizeEmail(email);
    const otp = generateOtp();

    await OTP.findOneAndDelete({ email: normalizedEmail, action });
    await OTP.create({ email: normalizedEmail, otp, action });
    await sendOTPEmail(normalizedEmail, otp, templateType);

    return otp;
};

const verifyOtpRecord = (email, otp, action) =>
    OTP.findOne({
        email: normalizeEmail(email),
        otp,
        action
    });

const buildAuthPayload = (account, role = account.role) => ({
    _id: account.id,
    name: account.name,
    email: account.email,
    role,
    latitude: account.latitude ?? null,
    longitude: account.longitude ?? null,
    city: account.city || '',
    district: account.district || '',
    stateCode: account.stateCode || '',
    state: account.state || '',
    country: account.country || 'India',
    token: generateAuthToken({ id: account.id, role })
});

module.exports = {
    OTP_ACTIONS,
    buildAuthPayload,
    comparePassword,
    generateResetToken,
    hashPassword,
    issueOtp,
    normalizeEmail,
    passwordValidationMessage,
    validateEmail,
    validatePassword,
    verifyOtpRecord
};
