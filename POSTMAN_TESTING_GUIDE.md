# Postman Testing Guide - Forgot Password Flow

## Base URLs

- **Local Development**: `http://localhost:5000`
- **Production (Render)**: `https://your-backend-name.onrender.com`

All endpoints are prefixed with `/api`

---

## Step 1: Request Password Reset OTP

**Endpoint:** `POST /api/forgot-password`

### Request Setup:
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/forgot-password` (or your Render URL)
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "your-email@example.com"
  }
  ```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "If the email exists, an OTP has been sent."
}
```

### Notes:
- Always returns success (even if email doesn't exist) to prevent user enumeration
- Check your backend console logs to see if email was actually sent
- In development mode, the OTP is logged to console: `[AUTH] DEBUG - Generated OTP for email@example.com: 123456`
- Rate limited: Max 3 requests per hour per email/IP

---

## Step 2: Verify OTP and Get Reset Session Token

**Endpoint:** `POST /api/verify-reset-otp`

### Request Setup:
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/verify-reset-otp`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "your-email@example.com",
    "otp": "123456"
  }
  ```

### Expected Response (200 OK):
```json
{
  "success": true,
  "resetSessionToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

### Error Responses:
- **400 Bad Request**: Invalid or expired OTP
- **403 Forbidden**: Too many failed attempts (blocked for 15 minutes)

### Notes:
- OTP expires in 10 minutes
- Max 5 wrong attempts, then blocked for 15 minutes
- Save the `resetSessionToken` for the next step

---

## Step 3: Reset Password

**Endpoint:** `POST /api/reset-password`

### Request Setup:
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/reset-password`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "resetSessionToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "newPassword": "yourNewPassword123"
  }
  ```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### Error Responses:
- **400 Bad Request**: Invalid or expired reset token, or password too short (min 6 characters)

### Notes:
- Reset session token expires in 10 minutes
- Password must be at least 6 characters

---

## Debug Endpoint (Development Only)

**Endpoint:** `GET /api/debug-otp/:email`

### Request Setup:
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/debug-otp/your-email@example.com`

### Expected Response:
```json
{
  "success": true,
  "email": "your-email@example.com",
  "otpExpiresAt": "2024-01-15T10:30:00.000Z",
  "attempts": 0,
  "blockedUntil": null,
  "message": "Check your backend console logs for the OTP (it's logged when generated in dev mode)"
}
```

**Note:** This endpoint only works in development mode (`NODE_ENV !== 'production'`)

---

## Complete Testing Flow Example

### 1. Request OTP
```http
POST http://localhost:5000/api/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

### 2. Check Backend Logs
Look for:
- `[EMAIL] Attempting to send OTP email to: test@example.com`
- `[EMAIL] SMTP connection verified successfully`
- `[EMAIL] Password reset OTP sent successfully`
- `[AUTH] DEBUG - Generated OTP for test@example.com: 123456` (dev mode only)

### 3. Verify OTP
```http
POST http://localhost:5000/api/verify-reset-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

### 4. Reset Password
```http
POST http://localhost:5000/api/reset-password
Content-Type: application/json

{
  "resetSessionToken": "paste-token-from-step-3",
  "newPassword": "newSecurePassword123"
}
```

---

## Troubleshooting

### Email Not Received?

**First, check your email configuration:**
```http
GET http://localhost:5000/api/test-email-config
```

This will show you:
- Whether `SENDGRID_API_KEY` is set
- What `EMAIL_FROM` is configured
- Environment status

**Then check your backend logs** when requesting password reset. Look for:

✅ **Success logs:**
- `[EMAIL] SMTP connection verified successfully`
- `[EMAIL] Password reset OTP sent successfully`
- `[AUTH] OTP email sent successfully`

❌ **Error logs:**
- `[EMAIL] SENDGRID_API_KEY is not set`
- `[EMAIL] EMAIL_FROM is not set`
- `[EMAIL] Failed to send password reset OTP`
- `[EMAIL] Error code:` / `[EMAIL] Error message:`

**Common fixes:**

1. **SENDGRID_API_KEY not set**
   - Go to Render → Environment → Add `SENDGRID_API_KEY`
   - Value: Your SendGrid API key (starts with `SG.`)
   - Get it from: SendGrid Dashboard → Settings → API Keys → Create API Key

2. **EMAIL_FROM not set or not verified**
   - Go to Render → Environment → Add `EMAIL_FROM`
   - Value: A verified email in SendGrid (e.g., `noreply@yourdomain.com`)
   - Verify email in: SendGrid → Settings → Sender Authentication → Verify Single Sender

3. **SendGrid account not activated**
   - Check your email inbox for SendGrid activation email
   - Complete account setup

4. **API Key permissions**
   - Make sure API key has "Mail Send" permissions
   - Create a new API key if needed

5. **Check SendGrid Activity**
   - Go to SendGrid Dashboard → Activity
   - See if emails are being sent but blocked/bounced
   - Check spam folder in recipient email

### Rate Limit Errors?
- Wait 1 hour between requests (max 3 per hour)
- Or use a different email/IP for testing

### Invalid OTP Errors?
- OTP expires in 10 minutes
- Check backend logs for the correct OTP (dev mode)
- Make sure you're using the OTP from the most recent request

### Invalid Reset Token?
- Reset session token expires in 10 minutes
- Make sure you're using the token from step 2 (verify-reset-otp)
- Token can only be used once

