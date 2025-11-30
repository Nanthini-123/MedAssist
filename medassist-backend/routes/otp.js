// medassist-backend/routes/otp.js
import express from "express";
import pool from "../db.js";
import { sendSms, sendWhatsAppMessage } from "../utils/sms.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const OTP_EXP_MIN = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_MAX_PER_HOUR = Number(process.env.OTP_MAX_PER_HOUR || 3);

// POST /api/send-otp
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "phone required" });

  try {
    const now = new Date();

    // Check if OTP already exists for this phone
    const r = await pool.query("SELECT * FROM otps WHERE phone=$1", [phone]);
    let otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expires = new Date(Date.now() + OTP_EXP_MIN * 60000);

    if (r.rows.length) {
      const row = r.rows[0];
      // Reset count if last_sent_at > 1 hour
      if (row.last_sent_at && (now - new Date(row.last_sent_at)) / (1000 * 60 * 60) >= 1) {
        await pool.query(
          "UPDATE otps SET send_count_hour=1, otp_code=$1, expires_at=$2, last_sent_at=$3 WHERE phone=$4",
          [otp, expires, now, phone]
        );
      } else {
        // Rate limiting
        if (row.send_count_hour >= OTP_MAX_PER_HOUR)
          return res.status(429).json({ error: "OTP rate limit exceeded" });
        await pool.query(
          "UPDATE otps SET send_count_hour=send_count_hour+1, otp_code=$1, expires_at=$2, last_sent_at=$3 WHERE phone=$4",
          [otp, expires, now, phone]
        );
      }
    } else {
      await pool.query(
        "INSERT INTO otps(phone, otp_code, expires_at, send_count_hour, last_sent_at) VALUES($1,$2,$3,1,$4)",
        [phone, otp, expires, now]
      );
    }

    // Send OTP via SMS (primary)
    await sendSms({ phone, message: `Your MedAssist OTP is ${otp}` });

    // Send OTP via WhatsApp (template placeholder)
    await sendWhatsAppMessage({
      phone,
      templateName: "otp_template",
      templateParams: [otp],
      message: `Your MedAssist OTP is ${otp}`, // fallback text
    });

    res.json({
      success: true,
      demoOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/verify-otp
router.post("/verify-otp", async (req, res) => {
  const { phone, code, name, email, age } = req.body;
  if (!phone || !code) return res.status(400).json({ error: "phone & code required" });

  try {
    const r = await pool.query("SELECT * FROM otps WHERE phone=$1", [phone]);
    if (!r.rows.length) return res.status(400).json({ verified: false, error: "no otp" });

    const row = r.rows[0];
    if (row.otp_code !== code) return res.status(400).json({ verified: false, error: "invalid" });
    if (new Date() > new Date(row.expires_at))
      return res.status(400).json({ verified: false, error: "expired" });

    // Create or update visitor
    const v = await pool.query(
      `INSERT INTO visitors(name,email,phone,age,created_at) VALUES($1,$2,$3,$4,NOW())
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, age=EXCLUDED.age
       RETURNING id`,
      [name, email, phone, age]
    );

    const visitorId = v.rows[0].id;
    res.json({ verified: true, visitorId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ verified: false, error: err.message });
  }
});

export default router;