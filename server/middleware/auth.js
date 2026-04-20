const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.role === 'client'
                ? await Client.findById(decoded.id).select('-password')
                : await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const client = (req, res, next) => {
    if (req.user && req.user.role === 'client') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a client account' });
    }
};

module.exports = { protect, admin, client };
