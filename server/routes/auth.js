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
const { validate } = require('../middleware/validate');
const {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    verifyOtpSchema
} = require('../validators/authValidators');

router.post('/register', validate(registerSchema), register);
router.post('/client/register', validate(registerSchema), registerClient);
router.post('/login', validate(loginSchema), login);
router.post('/client/login', validate(loginSchema), loginClient);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-forgot-password-otp', validate(verifyOtpSchema), verifyForgotPasswordOTP);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
