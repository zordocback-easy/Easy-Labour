const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const { signToken, cookieOptions } = require('../utils/jwt');
const router = express.Router();
const { sendResetOtpEmail } = require('../services/emailService');
const crypto = require('crypto');

// Rate limiter for forgot-password to prevent abuse (3 per hour per IP)
const forgotPasswordLimiter = require('express-rate-limit')({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

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

// 1. Forgot Password - Send OTP via Email (SendGrid)
router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Always return generic success to prevent user enumeration
    // But only process if user exists
    if (!user) {
      console.log(`[AUTH] Forgot password attempt for non-existent email: ${normalizedEmail}`);
      return res.json({ 
        success: true, 
        message: 'If the email exists, an OTP has been sent.' 
      });
    }

    // Check if user is blocked (too many failed attempts)
    const now = new Date();
    if (user.resetOtpBlockedUntil && user.resetOtpBlockedUntil > now) {
      const minutesLeft = Math.ceil((user.resetOtpBlockedUntil - now) / 60000);
      return res.status(429).json({ 
        success: false, 
        error: `Too many failed attempts. Please try again in ${minutesLeft} minute(s).` 
      });
    }

    // Rate limit per email: max 3 requests per hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (user.forgotPasswordLastRequestAt && user.forgotPasswordLastRequestAt > oneHourAgo) {
      // Check request count
      if (user.forgotPasswordRequestCount >= 3) {
        return res.status(429).json({ 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        });
      }
      user.forgotPasswordRequestCount += 1;
    } else {
      // Reset counter if more than an hour has passed
      user.forgotPasswordRequestCount = 1;
    }
    user.forgotPasswordLastRequestAt = now;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await User.hashPassword(otp);

    // Store hashed OTP with 10-minute expiry
    user.resetOtpHash = otpHash;
    user.resetOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    user.resetOtpAttempts = 0;
    user.resetOtpBlockedUntil = null; // Clear any previous block
    await user.save();

    try {
      // Send OTP via SendGrid
      await sendResetOtpEmail(normalizedEmail, otp);
      return res.json({ 
        success: true, 
        message: 'If the email exists, an OTP has been sent.' 
      });
    } catch (err) {
      console.error('[AUTH] Email send failed:', err.message);
      // Don't reveal email send failure to prevent enumeration
      return res.json({ 
        success: true, 
        message: 'If the email exists, an OTP has been sent.' 
      });
    }
  } catch (err) {
    return next(err);
  }
});

// 2. Verify Reset OTP - Exchange for Reset Session Token
router.post('/verify-reset-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Check if OTP has expired
    const now = new Date();
    if (user.resetOtpExpiresAt < now) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Check if user is blocked
    if (user.resetOtpBlockedUntil && user.resetOtpBlockedUntil > now) {
      const minutesLeft = Math.ceil((user.resetOtpBlockedUntil - now) / 60000);
      return res.status(403).json({ 
        success: false, 
        error: `Too many failed attempts. Please try again in ${minutesLeft} minute(s).` 
      });
    }

    // Check attempt limit (max 5 wrong tries)
    if (user.resetOtpAttempts >= 5) {
      // Block for 15 minutes
      user.resetOtpBlockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
      await user.save();
      return res.status(403).json({ 
        success: false, 
        error: 'Too many failed attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.resetOtpHash);
    if (!isMatch) {
      user.resetOtpAttempts += 1;
      await user.save();
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    // OTP is valid - Create reset session token
    const resetSessionToken = crypto.randomBytes(32).toString('hex');
    const resetSessionTokenHash = crypto.createHash('sha256').update(resetSessionToken).digest('hex');

    // Store reset session token with 10-minute expiry
    user.resetSessionTokenHash = resetSessionTokenHash;
    user.resetSessionExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    
    // Clear OTP data
    user.resetOtpHash = null;
    user.resetOtpExpiresAt = null;
    user.resetOtpAttempts = 0;
    user.resetOtpBlockedUntil = null;
    
    await user.save();

    return res.json({ 
      success: true, 
      resetSessionToken 
    });
  } catch (err) {
    return next(err);
  }
});

// 3. Reset Password - Using Reset Session Token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { resetSessionToken, newPassword } = req.body;
    if (!resetSessionToken || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(resetSessionToken).digest('hex');

    // Find user by reset session token hash
    const user = await User.findOne({ 
      resetSessionTokenHash: tokenHash,
      resetSessionExpiresAt: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    // Update password
    user.passwordHash = await User.hashPassword(newPassword);
    
    // Invalidate reset session
    user.resetSessionTokenHash = null;
    user.resetSessionExpiresAt = null;
    
    await user.save();

    return res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
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
