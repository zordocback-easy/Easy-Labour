const express = require('express');
const { z } = require('zod');
const User = require('../models/User');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const { signToken, cookieOptions } = require('../utils/jwt');
const sendEmail = require('../utils/email');

const router = express.Router();

router.get('/test-ping', (req, res) => {
  console.log('[AUTH] Ping received');
  res.json({ success: true, message: 'pong' });
});

const registerClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(5, 'Phone number is required'),
  city: z.string().min(1, 'City is required'),
  locality: z.string().optional().default('')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

function setAuthCookie(res, token) {
  const cookieName = process.env.COOKIE_NAME || 'easy_token';
  res.cookie(cookieName, token, cookieOptions());
}

router.post('/register-client', async (req, res, next) => {
  try {
    let data;
    try {
      data = registerClientSchema.parse(req.body);
    } catch (zodError) {
      if (zodError.errors && Array.isArray(zodError.errors)) {
        const firstError = zodError.errors[0];
        const errorMessage = firstError.message || 'Validation failed';
        return res.status(400).json({
          success: false,
          error: errorMessage,
          field: firstError.path?.[0] || null
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid input. Please check your form and try again.'
      });
    }

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });

    const client = await Client.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      locality: data.locality
    });

    const passwordHash = await User.hashPassword(data.password);
    const user = await User.create({
      email: data.email,
      passwordHash,
      role: 'client',
      client: client._id
    });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    return res.json({ success: true, user: { id: user._id, role: user.role, profileId: client._id } });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    let loginData;
    try {
      loginData = loginSchema.parse(req.body);
    } catch (zodError) {
      if (zodError.errors && Array.isArray(zodError.errors)) {
        const firstError = zodError.errors[0];
        const errorMessage = firstError.message || 'Validation failed';
        return res.status(400).json({
          success: false,
          error: errorMessage,
          field: firstError.path?.[0] || null
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid input. Please check your form and try again.'
      });
    }

    const { email, password } = loginData;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    // for frontend convenience
    let profileId = null;
    if (user.role === 'worker') profileId = user.worker;
    if (user.role === 'client') profileId = user.client;

    return res.json({ success: true, user: { id: user._id, email: user.email, role: user.role, profileId } });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', async (req, res) => {
  const cookieName = process.env.COOKIE_NAME || 'easy_token';
  // Clear cookie with all possible paths to ensure it's deleted
  res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', path: '/' });
  res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', path: '/login' });
  return res.json({ success: true });
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res, next) => {
  try {
    console.log('[AUTH] Forgot password request received');
    const { email } = req.body;
    console.log('[AUTH] Email provided:', email);

    if (!email) {
      console.log('[AUTH] Error: Email is missing');
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    console.log('[AUTH] Searching for user:', email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('[AUTH] Error: User not found for email:', email);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('[AUTH] Generating OTP for user:', user._id);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = otpExpiry;

    console.log('[AUTH] Saving user with OTP...');
    await user.save();
    console.log('[AUTH] User saved successfully');

    try {
      console.log('[AUTH] Attempting to send email...');
      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset OTP - Easy',
        message: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
            <p style="text-align: center; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} Easy App. All rights reserved.</p>
          </div>
        `
      });
      console.log('[AUTH] Email sent successfully');
      return res.json({ success: true, message: 'OTP sent to email' });
    } catch (err) {
      console.error('[AUTH] Email send error:', err.message);
      user.resetPasswordOTP = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({
        success: false,
        error: 'Failed to send email. Please try again later.',
        debugDetails: err.message
      });
    }
  } catch (err) {
    return next(err);
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP are required' });

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    return res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    return next(err);
  }
});

// Reset Password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ success: false, error: 'All fields are required' });

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Update password
    user.passwordHash = await User.hashPassword(password);
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    return next(err);
  }
});

// Google OAuth Routes
const passport = require('../config/passport-config');

// Initiate Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Callback
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  async (req, res) => {
    try {
      // User is authenticated via Passport
      const user = req.user;

      // Generate JWT token
      const token = signToken({ sub: user._id.toString(), role: user.role });
      setAuthCookie(res, token);

      // Redirect to frontend with success
      // Redirect to frontend with success
      const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
      // Favor a non-localhost URL if multiple are present
      const frontendUrl = origins.find(o => !o.includes('localhost')) || origins[0];
      res.redirect(`${frontendUrl}/?google_auth=success`);
    } catch (err) {
      console.error('[GOOGLE AUTH] Callback error:', err);
      const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
      const frontendUrl = origins.find(o => !o.includes('localhost')) || origins[0];
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
);

module.exports = router;
