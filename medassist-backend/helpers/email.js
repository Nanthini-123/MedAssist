// backend/helpers/email.js
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendBookingEmail({ to, subject, text, html, attachments }) {
  const msg = {
    to,
    from: process.env.SENDGRID_SENDER_EMAIL,
    subject,
    text,
    html,
    attachments // optional array of { content: base64, filename, type, disposition }
  };
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err) {
    console.error("sendBookingEmail error:", err.response?.body || err.message);
    throw err;
  }
}