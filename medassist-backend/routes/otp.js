import express from "express";
import dotenv from "dotenv";
import { sendSms } from "../utils/sms.js";
dotenv.config();

const router = express.Router();

// OTP settings
const OTP_EXP_MIN = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_MAX_PER_HOUR = Number(process.env.OTP_MAX_PER_HOUR || 5);

// In-memory OTP store
const otpStore = {};
// { phone: { otp, expiresAt, requests: [timestamps] } }

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Remove requests older than 1 hour
function cleanOldRequests(phone) {
  if (!otpStore[phone]) return;
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  otpStore[phone].requests = otpStore[phone].requests.filter(
    (ts) => ts > oneHourAgo
  );
}

// ===============================
// SEND OTP
// ===============================
router.post("/send", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    if (!otpStore[phone]) otpStore[phone] = { requests: [] };
    cleanOldRequests(phone);

    if (otpStore[phone].requests.length >= OTP_MAX_PER_HOUR) {
      return res.status(429).json({
        error: `OTP limit exceeded. Max ${OTP_MAX_PER_HOUR} per hour.`,
      });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_EXP_MIN * 60 * 1000;

    otpStore[phone].otp = otp;
    otpStore[phone].expiresAt = expiresAt;
    otpStore[phone].requests.push(Date.now());

    // Send via Quick SMS
    await sendSms({ phone, otp });

    return res.json({
      success: true,
      message: "OTP sent successfully. May take a few minutes to receive.",
    });
  } catch (err) {
    console.error("OTP SEND ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ===============================
// VERIFY OTP
// ===============================
router.post("/verify", (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    const record = otpStore[phone];
    if (!record || !record.otp) return res.status(400).json({ error: "No OTP found" });

    if (Date.now() > record.expiresAt) return res.status(400).json({ error: "OTP expired" });
    if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    delete otpStore[phone].otp;
    delete otpStore[phone].expiresAt;

    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP VERIFY ERROR:", err.message);
    return res.status(500).json({ error: "Server error verifying OTP" });
  }
});

export default router;