const { ZodError } = require('zod');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { AppError } = require('../utils/appError');

const errorHandler = (error, req, res, next) => {
    let normalizedError = error;

    if (error instanceof ZodError) {
        normalizedError = new AppError(400, 'Validation failed', {
            code: 'VALIDATION_ERROR',
            details: error.flatten()
        });
    }

    if (!(normalizedError instanceof AppError)) {
        normalizedError = new AppError(500, 'Internal server error', {
            code: 'INTERNAL_SERVER_ERROR',
            details: env.isDevelopment ? { stack: error.stack, message: error.message } : null,
            isOperational: false
        });
    }

    const statusCode = normalizedError.statusCode || 500;
    const response = {
        success: false,
        message: normalizedError.message,
        data: null,
        error: {
            code: normalizedError.code || 'INTERNAL_SERVER_ERROR'
        }
    };

    if (normalizedError.details) {
        response.error.details = normalizedError.details;
    }

    if (env.isDevelopment && error.stack) {
        response.error.stack = error.stack;
    }

    logger.error(normalizedError.message, {
        code: normalizedError.code,
        statusCode,
        path: req.originalUrl,
        method: req.method,
        stack: error.stack
    });

    res.status(statusCode).json(response);
};

module.exports = { errorHandler };
