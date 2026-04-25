const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { logger } = require('../config/logger');

let transporter;

const getTransporter = () => {
    if (transporter) {
        return transporter;
    }

    if (!env.EMAIL_USER || !env.EMAIL_PASS) {
        logger.warn('Email credentials are not configured. Email sending will be skipped.');
        return null;
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASS
        }
    });

    return transporter;
};

const escapeHtml = (value) =>
    String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const sendMail = async (mailOptions) => {
    const activeTransporter = getTransporter();
    if (!activeTransporter) {
        return;
    }

    try {
        await activeTransporter.sendMail({
            from: env.EMAIL_FROM || env.EMAIL_USER,
            ...mailOptions
        });
    } catch (error) {
        logger.error('Email send failed', {
            message: error.message,
            subject: mailOptions.subject,
            to: mailOptions.to
        });
    }
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    await sendMail({
        to: userEmail,
        subject: `Booking Confirmed: ${eventTitle}`,
        html: `
            <h2>Hi ${escapeHtml(userName)}!</h2>
            <p>Your booking for the event <strong>${escapeHtml(eventTitle)}</strong> is successfully confirmed.</p>
            <p>Thank you for choosing Vireon.</p>
        `
    });
};

const sendOTPEmail = async (userEmail, otp, type) => {
    const title =
        type === 'account_verification'
            ? 'Verify your Vireon Account'
            : type === 'password_reset'
                ? 'Reset your Vireon Password'
                : 'Vireon Booking Verification';

    const message =
        type === 'account_verification'
            ? 'Please use the following OTP to verify your new Vireon account.'
            : type === 'password_reset'
                ? 'Please use the following OTP to reset your Vireon password.'
                : 'Please use the following OTP to verify and confirm your event booking.';

    await sendMail({
        to: userEmail,
        subject: title,
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <h2 style="color: #111;">${escapeHtml(title)}</h2>
                <p style="color: #555; font-size: 16px;">${escapeHtml(message)}</p>
                <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                    ${escapeHtml(otp)}
                </div>
                <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
            </div>
        `
    });
};

const sendClientEventApprovalEmail = async ({
    adminEmails,
    clientName,
    clientEmail,
    requestType,
    eventTitle,
    requestId,
    editRequestReason = ''
}) => {
    if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
        return;
    }

    const isEditRequest = requestType === 'edit';
    const subject = isEditRequest
        ? `Client Event Edit Approval Required: ${eventTitle}`
        : `Client Event Registration Approval Required: ${eventTitle}`;

    await sendMail({
        to: adminEmails.join(','),
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #111;">Client Event ${isEditRequest ? 'Edit' : 'Registration'} Request</h2>
                <p style="color: #444;">
                    A client has submitted an event ${isEditRequest ? 'edit' : 'registration'} request and it needs admin review.
                </p>
                <ul style="color: #333;">
                    <li><strong>Client:</strong> ${escapeHtml(clientName)}</li>
                    <li><strong>Email:</strong> ${escapeHtml(clientEmail)}</li>
                    <li><strong>Event:</strong> ${escapeHtml(eventTitle)}</li>
                    <li><strong>Request ID:</strong> ${escapeHtml(requestId)}</li>
                </ul>
                ${isEditRequest && editRequestReason
                    ? `<p style="color: #333;"><strong>Client Requested Changes:</strong></p>
                       <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; color:#222;">
                           ${escapeHtml(editRequestReason)}
                       </div>`
                    : ''}
            </div>
        `
    });
};

const sendClientEventDecisionEmail = async ({
    clientEmail,
    clientName,
    eventTitle,
    requestType,
    action,
    reviewNote = ''
}) => {
    if (!clientEmail) {
        return;
    }

    const isApproved = action === 'approve';
    const typeLabel = requestType === 'edit' ? 'event edit request' : 'event registration request';

    await sendMail({
        to: clientEmail,
        subject: isApproved
            ? `Your ${typeLabel} was approved: ${eventTitle}`
            : `Your ${typeLabel} was rejected: ${eventTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #111;">Hi ${escapeHtml(clientName || 'there')},</h2>
                <p style="color: #444;">
                    Your ${escapeHtml(typeLabel)} for <strong>${escapeHtml(eventTitle)}</strong> has been
                    <strong style="color:${isApproved ? '#15803d' : '#b91c1c'};">${isApproved ? 'approved' : 'rejected'}</strong>.
                </p>
                ${reviewNote ? `<p style="color:#333;"><strong>Admin Note:</strong> ${escapeHtml(reviewNote)}</p>` : ''}
            </div>
        `
    });
};

module.exports = {
    sendBookingEmail,
    sendOTPEmail,
    sendClientEventApprovalEmail,
    sendClientEventDecisionEmail
};
