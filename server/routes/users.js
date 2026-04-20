const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { saveUserLocation } = require('../controllers/userController');

router.put('/location', protect, saveUserLocation);

module.exports = router;
