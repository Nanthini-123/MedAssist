// medassist-backend/utils/email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configure transporter (Gmail example, can use any SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email in .env
    pass: process.env.EMAIL_PASS, // App password or real password
  },
});

/**
 * sendEmail({ to, subject, text })
 * Unified function to send any email
 */
export async function sendEmail({ to, subject, text }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}:`, info.response);
    return info;
  } catch (err) {
    console.error("sendEmail error:", err);
    throw err;
  }
}

// Optional: For backward compatibility with booking emails
export async function sendBookingEmail({ to, subject, text }) {
  return sendEmail({ to, subject, text });
}

// Optional: Generic email alias
export async function sendGenericEmail({ to, subject, text }) {
  return sendEmail({ to, subject, text });
}

// Default export (so old imports like `import sendEmail from '../utils/email.js'` work)
export default sendEmail;