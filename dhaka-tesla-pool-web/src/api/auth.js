import client from './client.js';

export const login = (email, password) => client.post('/auth/login', { email, password });
export const register = (name, email, password) => client.post('/auth/register', { name, email, password });
export const logout = () => client.post('/auth/logout');
export const getMe = () => client.get('/auth/me');

// Email verification (after signup)
export const verifyEmail = (otp) => client.post('/auth/verify-email', { otp });
export const resendVerification = () => client.post('/auth/resend-verification');

// Password reset
export const forgotPassword = (email) => client.post('/auth/forgot-password', { email });
export const resetPassword = (email, otp, newPassword) => client.post('/auth/reset-password', { email, otp, newPassword });
