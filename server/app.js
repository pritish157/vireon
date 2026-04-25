const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const { env } = require('./config/env');
const { buildCorsOptions } = require('./config/cors');
const { logger } = require('./config/logger');
const { getDatabaseHealth } = require('./config/database');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/apiResponse');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const clientEventRoutes = require('./routes/clientEvents');
const userRoutes = require('./routes/users');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.isProduction);

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(compression());
app.use(morgan(env.isProduction ? 'combined' : 'dev', { stream: logger.stream }));
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: env.BODY_LIMIT }));
app.use(mongoSanitize());

app.get('/api/health', (req, res) => {
    sendSuccess(res, {
        message: 'Service healthy',
        data: {
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
            database: getDatabaseHealth()
        }
    });
});

app.get('/api/health/db', (req, res) => {
    const database = getDatabaseHealth();
    const statusCode = database.connected ? 200 : 503;

    sendSuccess(res, {
        statusCode,
        message: database.connected ? 'Database healthy' : 'Database unavailable',
        data: {
            status: database.connected ? 'OK' : 'SERVICE_UNAVAILABLE',
            timestamp: new Date().toISOString(),
            database
        }
    });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/client/events', clientEventRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
