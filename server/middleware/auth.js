const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const { env } = require('../config/env');
const { asyncHandler } = require('./asyncHandler');
const { AppError } = require('../utils/appError');

const resolveAuthenticatedAccount = async ({ id, role }) => {
    if (role === 'client') {
        return Client.findById(id).lean();
    }
    return User.findById(id).lean();
};

const protect = asyncHandler(async (req, res, next) => {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
        throw new AppError(401, 'Not authorized, no token', { code: 'AUTH_TOKEN_MISSING' });
    }

    const token = authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const account = await resolveAuthenticatedAccount(decoded);

        if (!account) {
            throw new AppError(401, 'Not authorized, account not found', { code: 'AUTH_ACCOUNT_NOT_FOUND' });
        }

        req.user = {
            ...account,
            id: String(account._id)
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(401, 'Not authorized, token failed', { code: 'AUTH_TOKEN_INVALID' });
    }
});

const admin = (req, res, next) => {
    if (req.user?.role === 'admin') {
        return next();
    }
    return next(new AppError(403, 'Not authorized as an admin', { code: 'ADMIN_REQUIRED' }));
};

const client = (req, res, next) => {
    if (req.user?.role === 'client') {
        return next();
    }
    return next(new AppError(403, 'Not authorized as a client account', { code: 'CLIENT_REQUIRED' }));
};

module.exports = { protect, admin, client };
