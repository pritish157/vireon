const { app } = require('./app');
const { env } = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { logger } = require('./config/logger');

let server;

const startServer = async () => {
    try {
        await connectDatabase();

        server = app.listen(env.PORT, () => {
            logger.info(`Server running on port ${env.PORT}`, {
                environment: env.NODE_ENV
            });
        });

        server.on('error', (error) => {
            logger.error('Server failed to start', { message: error.message, code: error.code });
            process.exit(1);
        });
    } catch (error) {
        logger.error('Bootstrap failed', { message: error.message, stack: error.stack });
        process.exit(1);
    }
};

const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully.`);

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
            });
        }
        await disconnectDatabase();
        process.exit(0);
    } catch (error) {
        logger.error('Graceful shutdown failed', { message: error.message, stack: error.stack });
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
