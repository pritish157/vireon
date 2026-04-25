const { AppError } = require('../utils/appError');

const notFound = (req, res, next) => {
    next(new AppError(404, `Route not found: ${req.originalUrl}`, { code: 'ROUTE_NOT_FOUND' }));
};

module.exports = { notFound };
