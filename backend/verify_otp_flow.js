require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Client = require('./src/models/Client');
const Worker = require('./src/models/Worker');
const { normalizePhone } = require('./src/utils/whatsapp');

async function finalTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB Connected.');

    const testInputs = ['03228477611', '923228477611', '+92 322 8477611'];

    for (const input of testInputs) {
        console.log(`\n--- Testing Input: ${input} ---`);
        const last10 = input.replace(/\D/g, '').slice(-10);
        const phoneRegex = new RegExp(last10 + '$');

        const client = await Client.findOne({ phone: phoneRegex });
        console.log(`Lookup result for ${input}: ${client ? 'FOUND (' + client.name + ')' : 'NOT FOUND'}`);

        if (client) {
            const targetPhone = normalizePhone(input);
            console.log(`WhatsApp Delivery Number: ${targetPhone}`);
        }
    }

    await mongoose.connection.close();
}

finalTest().catch(console.error);
