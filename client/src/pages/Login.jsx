import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const validateForm = () => {
        if (!showOTP) {
            if (!emailRegex.test(email.trim())) {
                return 'Please enter a valid email address.';
            }
            if (password.trim().length < 6) {
                return 'Password must be at least 6 characters long.';
            }
            return '';
        }

        if (!emailRegex.test(email.trim())) {
            return 'Please enter a valid email address.';
        }
        if (!/^\d{6}$/.test(otp.trim())) {
            return 'OTP must be exactly 6 digits.';
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                const data = await login(email.trim(), password);
                if (data.role === 'admin') navigate('/admin');
                else if (data.role === 'client') navigate('/client/dashboard');
                else navigate('/dashboard');
            } else {
                const data = await verifyOTP(email.trim(), otp.trim(), 'user');
                if (data.role === 'admin') navigate('/admin');
                else if (data.role === 'client') navigate('/client/dashboard');
                else navigate('/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                setError('Account not verified. A new OTP has been sent to your email.');
            } else {
                const msg = typeof err === 'string' ? err : err?.message || 'Sign in failed';
                const hint =
                    /invalid credentials/i.test(msg)
                        ? ' Check that you are on the right login page (admin/user vs client) and that your password is correct.'
                        : '';
                setError(`${msg}${hint}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-500">Sign in to your Vireon account</p>
                <p className="text-gray-400 text-xs mt-2 max-w-sm mx-auto">
                    Admins and attendees use this page. Event organizers (clients) should use{' '}
                    <Link to="/client/login" className="text-gray-600 font-semibold hover:underline">client login</Link>
                    .
                </p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center shadow-inner border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {!showOTP ? (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-800"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code (OTP)</label>
                        <input
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold tracking-widest text-center text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength="6"
                        />
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black focus:ring-4 focus:ring-gray-200 transition shadow-md"
                >
                    {loading ? 'Processing...' : (showOTP ? 'Verify OTP & Log In' : 'Sign In')}
                </button>
            </form>

            <div className="text-center mt-6">
                <Link to="/forgot-password" className="text-gray-600 hover:text-gray-900 font-semibold text-sm">Forgot Password?</Link>
            </div>

            <p className="text-center mt-8 text-gray-600">
                Don't have an account? <Link to="/register" className="text-gray-900 font-bold hover:underline">Sign up</Link>
            </p>
            <p className="text-center mt-2 text-gray-500 text-sm">
                Event organizer? <Link to="/client/login" className="text-gray-800 font-semibold hover:underline">Client login</Link>
            </p>
        </div>
    );
};

export default Login;
