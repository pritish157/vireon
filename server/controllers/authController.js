const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password || '');
};

const passwordValidationMessage = 'Password must be at least 6 characters long and include both letters and numbers';
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ message: passwordValidationMessage });
        }

        if (name.trim().length < 2 || name.trim().length > 50) {
            return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user',
            isVerified: false
        });

        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: user.email, action: 'account_verification' });
        await OTP.create({ email: user.email, otp, action: 'account_verification' });
        await sendOTPEmail(user.email, otp, 'account_verification');

        res.status(201).json({
            message: 'OTP sent to email. Please verify.',
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
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
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();
            await OTP.findOneAndDelete({ email: user.email, action: 'account_verification' });
            await OTP.create({ email: user.email, otp, action: 'account_verification' });
            await sendOTPEmail(user.email, otp, 'account_verification');
            return res.status(403).json({ message: 'Account not verified', needsVerification: true, email: user.email });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
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
        const validOTP = await OTP.findOne({ email: normalizedEmail, otp, action: 'account_verification' });

        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const user = await User.findOneAndUpdate({ email: normalizedEmail }, { isVerified: true }, { new: true });
        await OTP.deleteOne({ _id: validOTP._id });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
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
        await OTP.findOneAndDelete({ email: normalizedEmail, action: 'password_reset' });
        await OTP.create({ email: normalizedEmail, otp, action: 'password_reset' });
        await sendOTPEmail(normalizedEmail, otp, 'password_reset');

        res.json({ message: 'OTP sent to your email', email: normalizedEmail });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
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
        const validOTP = await OTP.findOne({ email: normalizedEmail, otp, action: 'password_reset' });

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

        res.json({ message: 'OTP verified. You can now reset your password.', resetToken });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
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

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
