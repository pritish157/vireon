const User = require('../models/User');
const Client = require('../models/Client');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const OTP_ACTIONS = {
    LEGACY_ACCOUNT_VERIFICATION: 'account_verification',
    USER_ACCOUNT_VERIFICATION: 'account_verification_user',
    CLIENT_ACCOUNT_VERIFICATION: 'account_verification_client',
    PASSWORD_RESET: 'password_reset'
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password || '');

const passwordValidationMessage = 'Password must be at least 6 characters long and include both letters and numbers';
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

const ensureBaseRegistrationPayload = ({ name, email, password }, res) => {
    if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email, and password are required' });
        return null;
    }

    if (!validateEmail(email)) {
        res.status(400).json({ message: 'Please provide a valid email address' });
        return null;
    }

    if (!validatePassword(password)) {
        res.status(400).json({ message: passwordValidationMessage });
        return null;
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
        res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
        return null;
    }

    return {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password
    };
};

const sendVerificationOTP = async (email, action) => {
    const otp = generateOTP();
    await OTP.findOneAndDelete({ email, action });
    await OTP.create({ email, otp, action });
    await sendOTPEmail(email, otp, 'account_verification');
};

const issueAuthResponse = (res, account, role) => res.json({
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
    token: generateToken(account.id, role)
});

exports.register = async (req, res) => {
    try {
        const payload = ensureBaseRegistrationPayload(req.body, res);
        if (!payload) {
            return;
        }

        const existingUser = await User.findOne({ email: payload.email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(payload.password, salt);

        const user = await User.create({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: 'user',
            isVerified: false
        });

        await sendVerificationOTP(user.email, OTP_ACTIONS.USER_ACCOUNT_VERIFICATION);

        return res.status(201).json({
            message: 'OTP sent to email. Please verify.',
            email: user.email
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.registerClient = async (req, res) => {
    try {
        const payload = ensureBaseRegistrationPayload(req.body, res);
        if (!payload) {
            return;
        }

        const existingClient = await Client.findOne({ email: payload.email });
        if (existingClient) {
            return res.status(400).json({ message: 'Client already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(payload.password, salt);

        const client = await Client.create({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            isVerified: false
        });

        await sendVerificationOTP(client.email, OTP_ACTIONS.CLIENT_ACCOUNT_VERIFICATION);

        return res.status(201).json({
            message: 'Client registration submitted. OTP sent to email. Please verify.',
            email: client.email
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified && user.role !== 'admin') {
            await sendVerificationOTP(user.email, OTP_ACTIONS.USER_ACCOUNT_VERIFICATION);
            return res.status(403).json({
                message: 'Account not verified',
                needsVerification: true,
                email: user.email
            });
        }

        return issueAuthResponse(res, user, user.role);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.loginClient = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const client = await Client.findOne({ email: normalizedEmail });
        if (!client) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, client.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!client.isVerified) {
            await sendVerificationOTP(client.email, OTP_ACTIONS.CLIENT_ACCOUNT_VERIFICATION);
            return res.status(403).json({
                message: 'Account not verified',
                needsVerification: true,
                email: client.email
            });
        }

        return issueAuthResponse(res, client, 'client');
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, accountType = 'user' } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        if (!['user', 'client'].includes(accountType)) {
            return res.status(400).json({ message: "accountType must be either 'user' or 'client'" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'OTP must be 6 digits' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const otpQuery = accountType === 'client'
            ? { email: normalizedEmail, otp, action: OTP_ACTIONS.CLIENT_ACCOUNT_VERIFICATION }
            : {
                email: normalizedEmail,
                otp,
                action: { $in: [OTP_ACTIONS.USER_ACCOUNT_VERIFICATION, OTP_ACTIONS.LEGACY_ACCOUNT_VERIFICATION] }
            };

        const validOTP = await OTP.findOne(otpQuery);
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (accountType === 'client') {
            const client = await Client.findOneAndUpdate(
                { email: normalizedEmail },
                { isVerified: true },
                { new: true }
            );
            if (!client) {
                return res.status(404).json({ message: 'Client account not found' });
            }

            await OTP.deleteOne({ _id: validOTP._id });
            return issueAuthResponse(res, client, 'client');
        }

        const user = await User.findOneAndUpdate(
            { email: normalizedEmail },
            { isVerified: true },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User account not found' });
        }

        await OTP.deleteOne({ _id: validOTP._id });
        return issueAuthResponse(res, user, user.role);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: normalizedEmail, action: OTP_ACTIONS.PASSWORD_RESET });
        await OTP.create({ email: normalizedEmail, otp, action: OTP_ACTIONS.PASSWORD_RESET });
        await sendOTPEmail(normalizedEmail, otp, 'password_reset');

        return res.json({ message: 'OTP sent to your email', email: normalizedEmail });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'OTP must be 6 digits' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const validOTP = await OTP.findOne({
            email: normalizedEmail,
            otp,
            action: OTP_ACTIONS.PASSWORD_RESET
        });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const resetToken = jwt.sign({ email: normalizedEmail }, process.env.JWT_SECRET, { expiresIn: '15m' });
        await User.findOneAndUpdate(
            { email: normalizedEmail },
            {
                resetPasswordToken: resetToken,
                resetPasswordExpiry: new Date(Date.now() + 15 * 60 * 1000)
            }
        );

        await OTP.deleteOne({ _id: validOTP._id });

        return res.json({ message: 'OTP verified. You can now reset your password.', resetToken });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ message: 'Email, reset token, and new password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ message: passwordValidationMessage });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        try {
            const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
            if (decoded.email !== normalizedEmail) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }
        } catch (error) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (!user.resetPasswordToken || user.resetPasswordToken !== resetToken) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (user.resetPasswordExpiry < new Date()) {
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findOneAndUpdate(
            { email: normalizedEmail },
            {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiry: null
            }
        );

        return res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
