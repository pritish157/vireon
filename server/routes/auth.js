const express = require('express');
const router = express.Router();
const {
    register,
    registerClient,
    login,
    loginClient,
    verifyOTP,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword
} = require('../controllers/authController');

router.post('/register', register);
router.post('/client/register', registerClient);
router.post('/login', login);
router.post('/client/login', loginClient);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
