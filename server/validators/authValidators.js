const { z } = require('zod');

const emailSchema = z.string().trim().email('Please provide a valid email address');
const passwordSchema = z
    .string()
    .min(6)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, 'Password must be at least 6 characters long and include both letters and numbers');

const registerSchema = {
    body: z.object({
        name: z.string().trim().min(2).max(50),
        email: emailSchema,
        password: passwordSchema
    })
};

const loginSchema = {
    body: z.object({
        email: emailSchema,
        password: z.string().min(1)
    })
};

const verifyOtpSchema = {
    body: z.object({
        email: emailSchema,
        otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
        accountType: z.enum(['user', 'client']).optional().default('user')
    })
};

const forgotPasswordSchema = {
    body: z.object({
        email: emailSchema
    })
};

const resetPasswordSchema = {
    body: z.object({
        email: emailSchema,
        resetToken: z.string().min(1),
        newPassword: passwordSchema
    })
};

module.exports = {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    verifyOtpSchema
};
