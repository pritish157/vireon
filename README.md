# Vireon - Full-Stack Event Booking Platform

Vireon is a full-stack MERN event booking application with OTP-protected bookings, Razorpay checkout for paid events, and an admin dashboard for managing events, bookings, and refunds.

## Features
- **User Authentication**: Secure login and registration with JWT and bcrypt.
- **2FA OTP Verification**:
  - Mandatory email OTP to activate an account on registration or delayed login attempts.
  - Mandatory email OTP to finalize event booking.
- **Role-Based Access**:
  - **Admin**: Create, edit, and delete events, review bookings, and trigger Razorpay refunds.
  - **User**: Browse events, complete OTP-protected bookings, pay for paid events through Razorpay Checkout, view a personal dashboard, and cancel eligible bookings.
- **Event Management**: Create free and paid events with detailed descriptions, external image URLs, dates, categories, and seating capacity.
- **Smart Booking System**:
  - Mandatory OTP to authorize a booking request.
  - Free events confirm immediately after OTP verification.
  - Paid events create a Razorpay order and confirm only after payment verification.
  - Seat availability is validated during both booking and payment confirmation.
- **Admin Analytics Dashboard**: Track revenue, paid clients, booking status, and refunds from the admin panel.
- **Email Notifications**: Automated email delivery for OTPs and successful bookings.
- **UI**: Built with React, Tailwind CSS, and Vite.

## Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
You will also need a MongoDB database such as [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).

### 1. Environment Variables
Copy `server/.env.example` to `server/.env` and fill in the required values:

```env
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=supersecretjwtkey_vireon
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
PORT=5000
```

For `EMAIL_PASS`, use a Gmail App Password if you are using Gmail with 2FA enabled.

If your frontend and backend are deployed on different origins, copy `client/.env.example` to `client/.env` and set:

```env
VITE_API_URL=https://your-backend.example.com/api
```

If both are served from the same origin behind a reverse proxy, you can omit `VITE_API_URL` and keep the frontend default of `/api`.

### 2. Install Dependencies
From the project root:

```bash
npm install
npm run install:all
```

### 3. Run in Development
From the project root:

```bash
npm run dev
```

This starts:
- the backend on `http://localhost:5000`
- the frontend on a Vite dev port, typically `http://localhost:5173`

### 4. Local Production-Style Smoke Test
Build the frontend:

```bash
npm run build
```

Then run:

```bash
npm run start
```

This starts the backend with `node server.js` and the frontend with `vite preview`.

## Payment Testing

- Test mode works with Razorpay `rzp_test_...` credentials.
- Use `success@razorpay` in the Razorpay UPI field to simulate a successful UPI payment.
- Use `failure@razorpay` to simulate a failed UPI payment.
- Razorpay test mode does not charge real money.

## Deployment Notes

- Set `FRONTEND_URL` on the backend to the deployed frontend origin so CORS allows browser requests.
- If the frontend is deployed separately from the backend, set `VITE_API_URL` in the client build environment.
- Rotate any previously exposed secrets before deploying.
