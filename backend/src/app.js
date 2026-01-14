const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport-config');

const { connectDB } = require('./config/db');
const User = require('./models/User');
const Package = require('./models/Package');

const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const clientRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');
const paymentRoutes = require('./routes/payments');
const sessionRoutes = require('./routes/session');
const reviewRoutes = require('./routes/reviews');

async function seedPackages() {
  const defaults = [
    {
      name: 'basic',
      price: 2000,
      duration: 30,
      rank: 1,
      features: [
        'Profile listing in your category',
        'Limited visibility',
        'Basic analytics'
      ]
    },
    {
      name: 'standard',
      price: 3000,
      duration: 30,
      rank: 2,
      features: [
        'Higher ranking in listings',
        'More profile exposure',
        'Call/WhatsApp click tracking'
      ]
    },
    {
      name: 'premium',
      price: 10000,
      duration: 30,
      rank: 3,
      features: [
        'Top rank in listings',
        'Featured placement',
        'Full analytics'
      ]
    }
  ];

  for (const p of defaults) {
    await Package.updateOne({ name: p.name }, { $set: p }, { upsert: true });
  }
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@easy.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await User.findOne({ email });
  if (existing) return;
  const passwordHash = await User.hashPassword(password);
  await User.create({ email, passwordHash, role: 'admin' });
  console.log(`Seeded admin user: ${email} / ${password}`);
}

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan('dev'));
  app.use(cookieParser());

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Session configuration for Passport
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'lol-easy-lol',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.use(
    cors({
      origin: origin.split(',').map((s) => s.trim()),
      credentials: true
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  const uploadRoot = process.env.UPLOAD_DIR || 'uploads';
  app.use('/uploads', express.static(uploadRoot));

  app.get('/health', (req, res) => res.json({ ok: true }));

  // Mount routes under /api to match frontend calls
  app.use('/api', authRoutes);
  app.use('/api', sessionRoutes);
  app.use('/api', workerRoutes);
  app.use('/api', clientRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', statsRoutes);
  app.use('/api', paymentRoutes);
  app.use('/api', reviewRoutes);

  app.use(errorHandler);

  return app;
}

const app = createApp();
module.exports = { app, createApp, seedPackages, seedAdmin };