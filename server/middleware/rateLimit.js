const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const defaultOptions = {
    standardHeaders: true,
    legacyHeaders: false
};

const apiLimiter = rateLimit({
    ...defaultOptions,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        data: null,
        error: { code: 'RATE_LIMIT_EXCEEDED' }
    }
});

const authLimiter = rateLimit({
    ...defaultOptions,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        data: null,
        error: { code: 'AUTH_RATE_LIMIT_EXCEEDED' }
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};
