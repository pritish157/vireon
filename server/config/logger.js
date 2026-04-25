const { createLogger, format, transports } = require('winston');
const { env } = require('./env');

const logger = createLogger({
    level: env.LOG_LEVEL,
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const serializedMeta = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${stack || message}${serializedMeta}`;
        })
    ),
    transports: [new transports.Console()]
});

logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

module.exports = { logger };
