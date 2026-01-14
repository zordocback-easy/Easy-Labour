const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  // Disable buffering so that queries fail immediately if not connected
  mongoose.set('bufferCommands', false);

  mongoose.connection.on('connected', () => {
    console.log('[DB] MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 5000 // Timeout early if server is not reached
  });

  return mongoose.connection;
}

module.exports = { connectDB };