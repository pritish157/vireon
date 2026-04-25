const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { saveUserLocation } = require('../controllers/userController');
const { validate } = require('../middleware/validate');
const { saveUserLocationSchema } = require('../validators/userValidators');

router.put('/location', protect, validate(saveUserLocationSchema), saveUserLocation);

module.exports = router;
