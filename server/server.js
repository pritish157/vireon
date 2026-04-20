const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const clientEventRoutes = require('./routes/clientEvents');
const userRoutes = require('./routes/users');

const app = express();
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADDITIONAL_CORS_ORIGINS,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
]
    .filter(Boolean)
    .flatMap((origin) => origin.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);

/** Vite (or other local tools) may use any port; NODE_ENV is often "production" while still developing locally. */
const isLocalBrowserOrigin = (origin) => {
    if (!origin) return false;
    try {
        const { protocol, hostname } = new URL(origin);
        if (protocol !== 'http:' && protocol !== 'https:') return false;
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        return false;
    }
};

// Security middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || isLocalBrowserOrigin(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Limit payload size

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/client/events', clientEventRoutes);
app.use('/api/users', userRoutes);

const getDatabaseHealth = () => {
    const readyState = mongoose.connection.readyState;
    const state =
        { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }[readyState] || 'unknown';

    return {
        connected: readyState === 1,
        readyState,
        state,
        name: mongoose.connection.name || mongoose.connection.db?.databaseName || null
    };
};

// Health check (HTTP + process; includes Mongo driver state)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: getDatabaseHealth()
    });
});

// Strict DB readiness (503 until MongoDB is connected — for probes / smoke tests)
app.get('/api/health/db', (req, res) => {
    const database = getDatabaseHealth();
    if (!database.connected) {
        return res.status(503).json({
            status: 'SERVICE_UNAVAILABLE',
            timestamp: new Date().toISOString(),
            database
        });
    }

    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        message: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      process.exit(1);
  });

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the other process or set PORT in .env.`);
    } else {
        console.error('❌ Server failed to start:', err.message);
    }
    process.exit(1);
});
