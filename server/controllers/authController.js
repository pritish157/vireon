const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const OTP = require('../models/OTP');
const { env } = require('../config/env');
const { asyncHandler } = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const {
    OTP_ACTIONS,
    buildAuthPayload,
    comparePassword,
    generateResetToken,
    hashPassword,
    issueOtp,
    normalizeEmail,
    passwordValidationMessage,
    validateEmail,
    validatePassword
} = require('../services/authService');

const resetTokenExpiryMs = 15 * 60 * 1000;

const createPendingAccount = async ({ Model, name, email, password, role }) => {
    const normalizedEmail = normalizeEmail(email);
    const existingAccount = await Model.findOne({ email: normalizedEmail }).lean();

    if (existingAccount) {
        throw new AppError(409, `${role === 'client' ? 'Client' : 'User'} already exists`, {
            code: 'ACCOUNT_ALREADY_EXISTS'
        });
    }

    const hashedPassword = await hashPassword(password);

    return Model.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        isVerified: false
    });
};

const authenticateAccount = async ({ Model, email, password, role }) => {
    const normalizedEmail = normalizeEmail(email);
    const account = await Model.findOne({ email: normalizedEmail }).select('+password');

    if (!account) {
        throw new AppError(401, 'Invalid credentials', { code: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await comparePassword(password, account.password);
    if (!isMatch) {
        throw new AppError(401, 'Invalid credentials', { code: 'INVALID_CREDENTIALS' });
    }

    if (!account.isVerified && role !== 'admin') {
        await issueOtp({
            email: account.email,
            action: role === 'client' ? OTP_ACTIONS.CLIENT_ACCOUNT_VERIFICATION : OTP_ACTIONS.USER_ACCOUNT_VERIFICATION,
            templateType: 'account_verification'
        });

        throw new AppError(403, 'Account not verified', {
            code: 'ACCOUNT_NOT_VERIFIED',
            details: {
                needsVerification: true,
                email: account.email
            }
        });
    }

    return account;
};

exports.register = asyncHandler(async (req, res) => {
    const user = await createPendingAccount({
        Model: User,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: 'user'
    });

    await issueOtp({
        email: user.email,
        action: OTP_ACTIONS.USER_ACCOUNT_VERIFICATION,
        templateType: 'account_verification'
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: 'OTP sent to email. Please verify your account.',
        data: {
            email: user.email
        }
    });
});

exports.registerClient = asyncHandler(async (req, res) => {
    const client = await createPendingAccount({
        Model: Client,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: 'client'
    });

    await issueOtp({
        email: client.email,
        action: OTP_ACTIONS.CLIENT_ACCOUNT_VERIFICATION,
        templateType: 'account_verification'
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: 'Client registration created. OTP sent to email for verification.',
        data: {
            email: client.email
        }
    });
});

exports.login = asyncHandler(async (req, res) => {
    const user = await authenticateAccount({
        Model: User,
        email: req.body.email,
        password: req.body.password,
        role: 'user'
    });

    return sendSuccess(res, {
        message: 'Login successful',
        data: buildAuthPayload(user, user.role)
    });
});

exports.loginClient = asyncHandler(async (req, res) => {
    const client = await authenticateAccount({
        Model: Client,
        email: req.body.email,
        password: req.body.password,
        role: 'client'
    });

    return sendSuccess(res, {
        message: 'Client login successful',
        data: buildAuthPayload(client, 'client')
    });
});

exports.verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp, accountType } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const otpQuery = accountType === 'client'
        ? { email: normalizedEmail, otp, action: OTP_ACTIONS.CLIENT_ACCOUNT_VERIFICATION }
        : {
            email: normalizedEmail,
            otp,
            action: { $in: [OTP_ACTIONS.USER_ACCOUNT_VERIFICATION, OTP_ACTIONS.LEGACY_ACCOUNT_VERIFICATION] }
        };

    const validOtp = await OTP.findOne(otpQuery);
    if (!validOtp) {
        throw new AppError(400, 'Invalid or expired OTP', { code: 'OTP_INVALID' });
    }

    const Model = accountType === 'client' ? Client : User;
    const role = accountType === 'client' ? 'client' : undefined;

    const account = await Model.findOneAndUpdate(
        { email: normalizedEmail },
        { isVerified: true },
        { new: true }
    );

    if (!account) {
        throw new AppError(404, `${accountType === 'client' ? 'Client' : 'User'} account not found`, {
            code: 'ACCOUNT_NOT_FOUND'
        });
    }

    await OTP.deleteOne({ _id: validOtp._id });

    return sendSuccess(res, {
        message: 'OTP verified successfully',
        data: buildAuthPayload(account, role || account.role)
    });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
    const normalizedEmail = normalizeEmail(req.body.email);
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
        throw new AppError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    await issueOtp({
        email: normalizedEmail,
        action: OTP_ACTIONS.PASSWORD_RESET,
        templateType: 'password_reset'
    });

    return sendSuccess(res, {
        message: 'Password reset OTP sent successfully',
        data: {
            email: normalizedEmail
        }
    });
});

exports.verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const validOtp = await OTP.findOne({
        email: normalizedEmail,
        otp,
        action: OTP_ACTIONS.PASSWORD_RESET
    });

    if (!validOtp) {
        throw new AppError(400, 'Invalid or expired OTP', { code: 'OTP_INVALID' });
    }

    const resetToken = generateResetToken(normalizedEmail);
    await User.findOneAndUpdate(
        { email: normalizedEmail },
        {
            resetPasswordToken: resetToken,
            resetPasswordExpiry: new Date(Date.now() + resetTokenExpiryMs)
        }
    );

    await OTP.deleteOne({ _id: validOtp._id });

    return sendSuccess(res, {
        message: 'OTP verified. You can now reset your password.',
        data: {
            resetToken
        }
    });
});

exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!validateEmail(normalizedEmail)) {
        throw new AppError(400, 'Please provide a valid email address', { code: 'INVALID_EMAIL' });
    }

    if (!validatePassword(newPassword)) {
        throw new AppError(400, passwordValidationMessage, { code: 'INVALID_PASSWORD' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpiry');
    if (!user) {
        throw new AppError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    try {
        const decoded = jwt.verify(resetToken, env.JWT_SECRET);
        if (decoded.email !== normalizedEmail) {
            throw new Error('Email mismatch');
        }
    } catch {
        throw new AppError(400, 'Invalid or expired reset token', { code: 'RESET_TOKEN_INVALID' });
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== resetToken) {
        throw new AppError(400, 'Invalid or expired reset token', { code: 'RESET_TOKEN_INVALID' });
    }

    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
        throw new AppError(400, 'Reset token has expired', { code: 'RESET_TOKEN_EXPIRED' });
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    return sendSuccess(res, {
        message: 'Password reset successfully. You can now login with your new password.'
    });
});
