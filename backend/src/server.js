require('dotenv').config();
const { createApp, seedPackages, seedAdmin } = require('./app');
const { connectDB } = require('./config/db');

async function main() {
  const port = process.env.PORT || 5000;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('[SERVER] CRITICAL: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  console.log('[SERVER] Connecting to MongoDB...');
  try {
    await connectDB(mongoUri);
    console.log('[SERVER] Database connection established');

    // Seed essential data
    await seedPackages();
    await seedAdmin();

    const app = createApp();
    app.listen(port, () => {
      console.log(`[SERVER] EASY backend running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('[SERVER] Startup failed:', err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[SERVER] Unhandled error:', err);
  process.exit(1);
});
