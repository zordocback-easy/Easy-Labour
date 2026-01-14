const axios = require('axios');

/**
 * Normalizes phone numbers to Meta API requirements:
 * - Removes non-digits
 * - Replaces leading '0' with '92'
 * - Removes leading '+'
 * - Ensures final digits start with '92'
 */
const normalizePhone = (phone) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('92')) {
    cleaned = '92' + cleaned;
  }
  // If it was already 92... but shorter than expected or something, 
  // we just ensure it's digits only and starts with 92.
  return cleaned;
};

/**
 * Sends a plain text OTP via WhatsApp using Meta WhatsApp Cloud API.
 * @param {string} phone - Recipient phone number
 * @param {string} otp - The One-Time Password
 */
const sendWhatsAppOTP = async (phone, otp) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error('[WHATSAPP] Missing configuration in environment variables');
    throw new Error('WhatsApp service not configured');
  }

  const cleanPhone = normalizePhone(phone);
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
    console.error('[WHATSAPP API ERROR]', JSON.stringify(errorData, null, 2));

    // Unmask the real error for the backend to handle/log
    const metaMessage = error.response?.data?.error?.message || error.message;
    throw new Error(`WhatsApp API Error: ${metaMessage}`);
  }
};

module.exports = { sendWhatsAppOTP, normalizePhone };
