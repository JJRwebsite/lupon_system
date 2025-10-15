const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a reusable transporter using SMTP
// Supports Gmail (with App Password) or any SMTP provider via env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP credentials not configured. Skipping send.');
    return { mocked: true };
  }
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `Lupon Barangay Office <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return info;
}

function maskEmail(email) {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const maskedUser = user.length <= 2 ? user[0] + '*' : user[0] + '*'.repeat(Math.max(1, user.length - 2)) + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

async function sendVerificationCode(email, code, minutes = 10) {
  const subject = 'Verify your email - Lupon System';
  const text = `Your verification code is ${code}. It will expire in ${minutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Verify your email</h2>
      <p>Use the verification code below to complete your registration. This code will expire in <strong>${minutes} minutes</strong>.</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 12px 16px; background:#f3f4f6; display:inline-block; border-radius: 8px;">${code}</div>
      <p style="margin-top:16px; color:#6b7280;">If you did not request this, you can ignore this email.</p>
    </div>
  `;
  return sendMail({ to: email, subject, text, html });
}

module.exports = {
  sendMail,
  sendVerificationCode,
  maskEmail,
};
