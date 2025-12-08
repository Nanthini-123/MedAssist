import express from "express";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// In-memory OTP store (DB-free)
const otpStore = {};

// Generate random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// -------------------- Send OTP --------------------
router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    // Generate OTP and expiration
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + (Number(process.env.OTP_EXPIRY_MINUTES) || 5) * 60000);
    otpStore[email] = { otp, expiresAt };

    // Send email via SendGrid
    await sgMail.send({
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME || "MedAssist"
      },
      subject: "Your MedAssist OTP",
      text: `Your OTP is: ${otp}. It will expire in ${Number(process.env.OTP_EXPIRY_MINUTES) || 5} minutes.`,
      html: `<p>Your OTP is: <b>${otp}</b></p><p>It will expire in ${Number(process.env.OTP_EXPIRY_MINUTES) || 5} minutes.</p>`
    });

    // Return OTP for testing / Zoho SalesIQ Plug output
    res.json({ success: true, otp });

  } catch (err) {
    console.error("SEND OTP ERROR:", err.response ? err.response.body : err);
    res.status(500).json({ success: false, error: err.response ? err.response.body : err.message });
  }
});

// -------------------- Verify OTP --------------------
router.post("/verify", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: "Email and OTP required" });

    const record = otpStore[email];
    if (!record) return res.status(400).json({ success: false, error: "No OTP found for this email" });

    // Check expiration
    if (new Date() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ success: false, error: "OTP expired" });
    }

    // Check correctness
    if (otp !== record.otp) return res.status(400).json({ success: false, error: "Invalid OTP" });

    // Success
    delete otpStore[email]; // OTP verified and removed
    res.json({ success: true, message: "OTP verified successfully" });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;