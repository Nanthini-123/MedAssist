import express from "express";
import { sendSms } from "../utils/sms.js";
import { reconfirmationMessage, oneHourReminder } from "../helpers/smsTemplate.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Trigger SMS manually via backend (can be hooked to cron)
router.post("/send-reminders", async (req, res) => {
  const { phone, name, date, time } = req.body;

  try {
    await sendSms(phone, oneHourReminder({ name, date, time, clinic: "MedAssist Clinic", map: "https://maps.google.com/?q=Your+Clinic" }));
    await sendSms(phone, reconfirmationMessage({ name, date, time }));
    res.json({ success: true, message: "Reminders sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to send reminders" });
  }
});

export default router;