const mongoose = require('mongoose');
const { env } = require('./env');
const { logger } = require('./logger');

mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

const connectDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected', {
        database: mongoose.connection.name || mongoose.connection.db?.databaseName || null
    });
    return mongoose.connection;
};

const disconnectDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    }
};

const getDatabaseHealth = () => {
    const readyState = mongoose.connection.readyState;
    const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    return {
        connected: readyState === 1,
        readyState,
        state: stateMap[readyState] || 'unknown',
        name: mongoose.connection.name || mongoose.connection.db?.databaseName || null
    };
};

module.exports = {
    connectDatabase,
    disconnectDatabase,
    getDatabaseHealth
};
