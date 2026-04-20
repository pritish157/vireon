import React, { useState, useEffect } from 'react';
import { AuthContext } from './authContext';
import api from '../utils/axios';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const persistUserSession = (nextUser) => {
        setUser(nextUser);
        localStorage.setItem('userInfo', JSON.stringify(nextUser));
        if (nextUser?.token) {
            localStorage.setItem('token', nextUser.token);
        }
    };

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            persistUserSession(data);
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) throw error.response.data;
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
                throw 'Cannot reach the API. If this site uses HTTPS, do not point VITE_API_URL at http://localhost (mixed content). Leave VITE_API_URL unset for local dev so calls use /api.';
            }
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const loginClient = async (email, password) => {
        try {
            const { data } = await api.post('/auth/client/login', { email, password });
            persistUserSession(data);
            return data;
        } catch (error) {
            if (error.response?.data?.needsVerification) throw error.response.data;
            if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
                throw 'Cannot reach the API. If this site uses HTTPS, do not point VITE_API_URL at http://localhost (mixed content). Leave VITE_API_URL unset for local dev so calls use /api.';
            }
            throw error.response?.data?.message || 'Client login failed';
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const registerClient = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/client/register', { name, email, password });
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Client registration failed';
        }
    };

    const verifyOTP = async (email, otp, accountType = 'user') => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp, accountType });
            persistUserSession(data);
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'OTP verification failed';
        }
    };

    const updateUserProfile = (updates) => {
        setUser((currentUser) => {
            if (!currentUser) {
                return currentUser;
            }

            const mergedUser = {
                ...currentUser,
                ...updates,
                token: updates?.token || currentUser.token
            };

            localStorage.setItem('userInfo', JSON.stringify(mergedUser));
            if (mergedUser.token) {
                localStorage.setItem('token', mergedUser.token);
            }

            return mergedUser;
        });
    };

    const logout = () => {
        try {
            const raw = localStorage.getItem('userInfo');
            if (raw) {
                const u = JSON.parse(raw);
                if (u?._id) {
                    sessionStorage.removeItem(`vireon-gps-login-${u._id}`);
                    sessionStorage.removeItem(`vireon-location-attempted-${u._id}`);
                }
            }
        } catch {
            /* ignore */
        }
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                loginClient,
                register,
                registerClient,
                verifyOTP,
                updateUserProfile,
                logout,
                loading
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
}
