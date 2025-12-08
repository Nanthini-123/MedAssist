import express from "express";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const otpStore = {}; // In-memory store

// Generate random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// -------- Send OTP --------
router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required" });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 5) * 60000);
    otpStore[email] = { otp, expiresAt };

    const msg = {
      to: email,
      from: { 
        email: process.env.SENDGRID_FROM_EMAIL, 
        name: process.env.SENDGRID_FROM_NAME 
      },
      subject: "Your MedAssist OTP",
      text: `Your OTP is: ${otp}. It will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
    };

    await sgMail.send(msg);

    res.json({ success: true, message: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err.response ? err.response.body : err);
    res.status(500).json({ success: false, error: err.response ? err.response.body : err.message });
  }
});

// -------- Verify OTP --------
router.post("/verify", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: "Email and OTP are required" });

    const record = otpStore[email];
    if (!record) return res.status(400).json({ success: false, error: "No OTP found for this email" });

    if (new Date() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ success: false, error: "OTP expired" });
    }

    if (otp !== record.otp) return res.status(400).json({ success: false, error: "Invalid OTP" });

    delete otpStore[email]; // OTP verified
    res.json({ success: true, message: "OTP verified successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;