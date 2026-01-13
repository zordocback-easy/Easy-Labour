const axios = require('axios');

/**
 * Sends a plain text OTP via WhatsApp using Meta WhatsApp Cloud API.
 * @param {string} phone - Recipient phone number in international format (e.g., 923001234567)
 * @param {string} otp - The One-Time Password
 */
const sendWhatsAppOTP = async (phone, otp) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error('[WHATSAPP] Missing configuration in environment variables');
    throw new Error('WhatsApp service not configured');
  }

  // Basic phone number cleaning: remove '+', spaces, dashes
  const cleanPhone = phone.replace(/\D/g, '');

  // Use API v22.0
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'text',
    text: {
      body: `Easy Labour OTP: ${otp}\nValid for 5 minutes.\nDo not share this code.`
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('[WHATSAPP ERROR]', JSON.stringify(errorData, null, 2));
    throw new Error('Failed to send WhatsApp message');
  }
};

module.exports = sendWhatsAppOTP;
