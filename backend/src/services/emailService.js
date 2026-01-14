const nodemailer = require('nodemailer');

// Create SendGrid SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

/**
 * Sends a password reset OTP email via SendGrid
 * @param {string} to - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 * @returns {Promise<void>}
 */
async function sendResetOtpEmail(to, otp) {
  const fromEmail = process.env.EMAIL_FROM || 'noreply@example.com';
  
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY environment variable is not set');
  }

  const mailOptions = {
    from: fromEmail,
    to: to,
    subject: 'Password Reset OTP',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Password Reset</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">You requested to reset your password. Use the following OTP code to verify your identity:</p>
            <div style="background: #f5f5f5; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;"><strong>⏰ This code expires in 10 minutes.</strong></p>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #999; margin: 0;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Password Reset OTP

You requested to reset your password. Use the following OTP code to verify your identity:

${otp}

This code expires in 10 minutes.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

This is an automated message. Please do not reply to this email.
    `.trim()
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Password reset OTP sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('[EMAIL] Failed to send password reset OTP:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendResetOtpEmail
};

