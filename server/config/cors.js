const { env } = require('./env');

const isLocalBrowserOrigin = (origin) => {
    if (!origin) return false;

    try {
        const url = new URL(origin);
        return ['localhost', '127.0.0.1'].includes(url.hostname);
    } catch {
        return false;
    }
};

const buildCorsOptions = () => ({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const allowedByConfig = env.allowedOrigins.includes(origin);
        const allowedByLocalDev = !env.isProduction && isLocalBrowserOrigin(origin);

        if (allowedByConfig || allowedByLocalDev) {
            return callback(null, true);
        }

        return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true
});

module.exports = { buildCorsOptions };
