import client from './client.js';

export const getProfile            = ()                          => client.get('/profile');
export const updateName            = (name)                      => client.patch('/profile/name', { name });

// Email change — 3 steps
export const requestEmailChange    = (newEmail, currentPassword) => client.post('/profile/email/request', { newEmail, currentPassword });
export const verifyCurrentEmailOtp = (otp)                       => client.post('/profile/email/verify-current', { otp });
export const verifyNewEmailOtp     = (otp)                       => client.post('/profile/email/verify-new', { otp });

// Phone — 2 steps (WhatsApp OTP)
export const requestPhoneOtp       = (phone)                     => client.post('/profile/phone/request', { phone });
export const verifyPhoneOtp        = (otp)                       => client.post('/profile/phone/verify', { otp });
