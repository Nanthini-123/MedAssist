// medassist-backend/utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * Send an email
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} text - email text content
 * @param {string} html - email HTML content (optional)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // e.g., "smtp.msg91.com" or your SMTP host
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false, // true if using 465
      auth: {
        user: process.env.EMAIL_USER, // your SMTP username
        pass: process.env.EMAIL_PASS, // your SMTP password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM, // e.g., "MedAssist <no-reply@medassist.com>"
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

// ✅ Default export for worker imports
export default sendEmail;

// Optional: also keep named export if needed elsewhere
export { sendEmail };