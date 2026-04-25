const sendSuccess = (res, { statusCode = 200, message = 'OK', data = null, pagination = null } = {}) => {
    const payload = {
        success: true,
        message,
        data,
        error: null
    };

    if (pagination) {
        payload.pagination = pagination;
    }

    return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess };
