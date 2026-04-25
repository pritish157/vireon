const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const stringToBoolean = z.preprocess((value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
    }
    return value;
}, z.boolean());

const stringToNumber = (defaultValue) =>
    z.preprocess((value) => {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
    }, z.number());

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: stringToNumber(5000).default(5000),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('30d'),
    RESET_TOKEN_EXPIRES_IN: z.string().default('15m'),
    FRONTEND_URL: z.string().optional().default(''),
    ADDITIONAL_CORS_ORIGINS: z.string().optional().default(''),
    EMAIL_USER: z.string().optional().default(''),
    EMAIL_PASS: z.string().optional().default(''),
    EMAIL_FROM: z.string().optional().default(''),
    ADMIN_EMAIL: z.string().optional().default(''),
    RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: z.string().optional().default(''),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
    BODY_LIMIT: z.string().default('1mb'),
    RATE_LIMIT_WINDOW_MS: stringToNumber(15 * 60 * 1000).default(15 * 60 * 1000),
    RATE_LIMIT_MAX: stringToNumber(200).default(200),
    AUTH_RATE_LIMIT_MAX: stringToNumber(25).default(25),
    SEED_DATABASE: stringToBoolean.default(false)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
}

const env = parsed.data;

const splitOrigins = (value) =>
    String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

env.allowedOrigins = [
    ...splitOrigins(env.FRONTEND_URL),
    ...splitOrigins(env.ADDITIONAL_CORS_ORIGINS)
];

env.isProduction = env.NODE_ENV === 'production';
env.isDevelopment = env.NODE_ENV === 'development';
env.isTest = env.NODE_ENV === 'test';

module.exports = { env };
