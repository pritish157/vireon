const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const escapeHtml = (value) =>
    String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
        <h2>Hi ${userName}!</h2>
        <p>Your booking for the event <strong>${eventTitle}</strong> is successfully confirmed.</p>
        <p>Thank you for choosing Vireon.</p>
      `
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to', userEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    try {
        const title = type === 'account_verification' ? 'Verify your Vireon Account' : type === 'password_reset' ? 'Reset your Vireon Password' : 'Vireon Booking Verification';
        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Vireon account.'
            : type === 'password_reset'
            ? 'Please use the following OTP to reset your Vireon password.'
            : 'Please use the following OTP to verify and confirm your event booking.';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #111;">${title}</h2>
                    <p style="color: #555; font-size: 16px;">${msg}</p>
                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                        ${otp}
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${userEmail} for ${type}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
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
    try {
        if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
            return;
        }

        const isEditRequest = requestType === 'edit';
        const subject = isEditRequest
            ? `Client Event Edit Approval Required: ${eventTitle}`
            : `Client Event Registration Approval Required: ${eventTitle}`;
        const actionLabel = isEditRequest ? 'edit approval' : 'registration approval';

        const mailOptions = {
            from: process.env.EMAIL_USER,
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
                        <li><strong>Action:</strong> ${actionLabel}</li>
                    </ul>
                    ${isEditRequest && editRequestReason
                        ? `<p style="color: #333;"><strong>Client Requested Changes:</strong></p>
                           <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; color:#222;">
                               ${escapeHtml(editRequestReason)}
                           </div>`
                        : ''}
                    <p style="color: #666;">
                        Please review this request in the Vireon admin dashboard.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Client event request email sent to admins (${adminEmails.length} recipients)`);
    } catch (error) {
        console.error('Error sending client event approval email:', error);
    }
};

const sendClientEventDecisionEmail = async ({
    clientEmail,
    clientName,
    eventTitle,
    requestType,
    action,
    reviewNote = ''
}) => {
    try {
        if (!clientEmail) {
            return;
        }

        const isApproved = action === 'approve';
        const typeLabel = requestType === 'edit' ? 'event edit request' : 'event registration request';
        const subject = isApproved
            ? `Your ${typeLabel} was approved: ${eventTitle}`
            : `Your ${typeLabel} was rejected: ${eventTitle}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: clientEmail,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #111;">Hi ${escapeHtml(clientName || 'there')},</h2>
                    <p style="color: #444;">
                        Your ${escapeHtml(typeLabel)} for <strong>${escapeHtml(eventTitle)}</strong> has been
                        <strong style="color:${isApproved ? '#15803d' : '#b91c1c'};">${isApproved ? 'approved' : 'rejected'}</strong>.
                    </p>
                    ${reviewNote
                        ? `<p style="color:#333;"><strong>Admin Note:</strong> ${escapeHtml(reviewNote)}</p>`
                        : ''}
                    <p style="color: #666;">
                        ${isApproved
                            ? 'The approved changes are now reflected in Vireon.'
                            : 'You can submit a new request with updated details in your client dashboard.'}
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Client request decision email sent to ${clientEmail}`);
    } catch (error) {
        console.error('Error sending client request decision email:', error);
    }
};

module.exports = { sendBookingEmail, sendOTPEmail, sendClientEventApprovalEmail, sendClientEventDecisionEmail };
