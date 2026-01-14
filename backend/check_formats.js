require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Client = require('./src/models/Client');
const Worker = require('./src/models/Worker');

async function checkFormats() {
    await mongoose.connect(process.env.MONGODB_URI);

    const clients = await Client.find().limit(5).select('phone name');
    const workers = await Worker.find().limit(5).select('phone whatsapp name');

    console.log('--- Client Phone Formats ---');
    clients.forEach(c => console.log(`Name: ${c.name}, Phone: ${c.phone}`));

    console.log('\n--- Worker Phone Formats ---');
    workers.forEach(w => console.log(`Name: ${w.name}, Phone: ${w.phone}, WhatsApp: ${w.whatsapp}`));

    await mongoose.connection.close();
}

checkFormats().catch(console.error);
