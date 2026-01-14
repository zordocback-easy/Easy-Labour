require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB Connected.');

    const recentUsers = await User.find({
        resetPasswordOTPLastSentAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // Last 1 hour
    }).select('email resetPasswordOTPLastSentAt resetPasswordOTPAttempts');

    console.log(`Found ${recentUsers.length} users with OTPs sent in the last hour:`);
    recentUsers.forEach(u => {
        console.log(`- Email: ${u.email}, SentAt: ${u.resetPasswordOTPLastSentAt}, Attempts: ${u.resetPasswordOTPAttempts}`);
    });

    await mongoose.connection.close();
}

checkDB().catch(console.error);
