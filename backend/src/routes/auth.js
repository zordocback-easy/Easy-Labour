const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const { signToken, cookieOptions } = require('../utils/jwt');
const sendWhatsAppOTP = require('../utils/whatsapp');

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
    const user = await User.findOne({ email: email.toLowerCase() }).populate('worker client');

    if (!user) {
      console.log('[AUTH] Error: User not found for email:', email);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log('[AUTH] Generating OTP for user:', user._id);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await User.hashPassword(otp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Rate limiting: check if last OTP was sent less than 1 minute ago
    if (user.resetPasswordExpires && (user.resetPasswordExpires.getTime() - Date.now() > 4 * 60 * 1000)) {
      return res.status(429).json({ success: false, error: 'Please wait before requesting another OTP' });
    }

    user.resetPasswordOTP = otpHash;
    user.resetPasswordExpires = otpExpiry;

    console.log('[AUTH] Saving user with hashed OTP...');
    await user.save();
    console.log('[AUTH] User saved successfully');

    try {
      let phone = null;
      if (user.role === 'worker' && user.worker) {
        phone = user.worker.whatsapp || user.worker.phone;
      } else if (user.role === 'client' && user.client) {
        phone = user.client.phone;
      }

      if (!phone) {
        console.log('[AUTH] Error: No phone number found for user:', user._id);
        return res.status(400).json({ success: false, error: 'No phone number found for this account. Please contact support.' });
      }

      console.log('[AUTH] Attempting to send WhatsApp OTP to:', phone);
      await sendWhatsAppOTP(phone, otp);
      console.log('[AUTH] WhatsApp OTP sent successfully');
      return res.json({ success: true, message: 'OTP sent to your WhatsApp' });
    } catch (err) {
      console.error('[AUTH] WhatsApp send error:', err.message);
      user.resetPasswordOTP = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again later.',
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
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user || !user.resetPasswordOTP) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isMatch) {
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
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user || !user.resetPasswordOTP) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isMatch) {
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


// in backend/src/routes/auth.js

router.get("/auth/google/callback", (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });

    // send token to frontend so frontend can set cookie on its own domain
    return res.redirect(`${frontendUrl}/oauth/google?token=${encodeURIComponent(token)}`);
  })(req, res, next);
});

module.exports = router;
