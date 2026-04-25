import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import AppLoadingFallback from './components/AppLoadingFallback';

const Home = lazy(() => import('./pages/Home'));
const EventsScreen = lazy(() => import('./pages/EventsScreen'));
const BookingsScreen = lazy(() => import('./pages/BookingsScreen'));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ClientLogin = lazy(() => import('./pages/ClientLogin'));
const ClientRegister = lazy(() => import('./pages/ClientRegister'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));

function AppRoutes() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <Navbar />
            <main className="container mx-auto flex-grow px-4 pb-28 pt-4 sm:px-6 md:py-8 md:pb-8 lg:px-8">
                <Suspense fallback={<AppLoadingFallback />}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                        >
                            <Routes location={location}>
                                <Route path="/" element={<Home />} />
                                <Route path="/events" element={<EventsScreen />} />
                                <Route path="/bookings" element={<BookingsScreen />} />
                                <Route path="/profile" element={<ProfileScreen />} />
                                <Route path="/events/:id" element={<EventDetail />} />
                                <Route path="/event/:id" element={<EventDetail />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/client/login" element={<ClientLogin />} />
                                <Route path="/client/register" element={<ClientRegister />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/dashboard" element={<UserDashboard />} />
                                <Route path="/client/dashboard" element={<ClientDashboard />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/payment-success" element={<PaymentSuccess />} />
                                <Route path="/payment-failed" element={<PaymentFailed />} />
                                <Route path="/terms" element={<Terms />} />
                                <Route path="/privacy" element={<Privacy />} />
                                <Route path="/refund-policy" element={<RefundPolicy />} />
                                <Route path="*" element={<h1 className="text-3xl font-bold text-center mt-20">404 - Page Not Found</h1>} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </Suspense>
            </main>
            <MobileBottomNav />
        </div>
    );
}

function App() {
    return (
        <Router
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <AppRoutes />
        </Router>
    );
}

export default App;
