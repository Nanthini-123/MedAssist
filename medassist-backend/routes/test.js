import express from "express";
import pool from "../db.js";
import { sendSms } from "../utils/sms.js";
import { updateStatusInSheet } from "../utils/googlesheets.js";   // ✅ FIXED
import { sendAttendanceNotification } from "../utils/notify.js";
import { statusWatcher } from "../workers/statusWatcher.js";   // also FIXED

const router = express.Router();

router.get("/all", async (req, res) => {
  const output = {
    success: true,
    checks: {},
    errors: []
  };

  try {
    // 1. DB CHECK
    try {
      await pool.query("SELECT NOW()");
      output.checks.database = "OK";
    } catch (err) {
      output.errors.push("Database error: " + err.message);
    }

    // 2. BOOKINGS TODAY CHECK
    try {
      const bookings = await pool.query(
        `SELECT id, visitor_id FROM bookings 
         WHERE CAST(created_at AS DATE) = CURRENT_DATE LIMIT 1;`
      );
      output.checks.bookings_today =
        bookings.rows.length > 0 ? "OK (data exists)" : "OK (no bookings today)";
    } catch (err) {
      output.errors.push("Bookings Today API failed: " + err.message);
    }

    // 3. STATUS UPDATE CHECK (FAKE UPDATE)
    try {
      await updateStatusInSheet("9999999999", "PRESENT", "TESTER"); // ✅ FIXED
      output.checks.sheet_update = "OK";
    } catch (err) {
      output.errors.push("Google Sheet update failed: " + err.message);
    }

    // 4. SMS CHECK
    try {
      await sendSms({
        phone: process.env.TEST_PHONE,
        message: "MedAssist Test SMS: Backend Working"
      });
      output.checks.sms = "OK";
    } catch (err) {
      output.errors.push("SMS failed: " + err.message);
    }

    // 5. EMAIL CHECK (OPTIONAL)
    try {
      await sendAttendanceNotification(
        "TEST-NAME",
        process.env.TEST_PHONE,
        "PRESENT"
      );
      output.checks.email = "OK";
    } catch (err) {
      output.errors.push("Email failed (optional): " + err.message);
    }

    // 6. WORKER CHECK — RUN ONCE
    try {
      await statusWatcher();
      output.checks.worker = "OK";
    } catch (err) {
      output.errors.push("Worker failed: " + err.message);
    }

    // 7. BOT CHECK
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/api/bot/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: process.env.TEST_PHONE,
          message: "STATUS"
        })
      });
      output.checks.bot_webhook =
        response.ok ? "OK" : "FAILED (Check bot route)";
    } catch (err) {
      output.errors.push("Bot Webhook error: " + err.message);
    }

    // 8. ENV CHECK
    output.checks.env = {
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      MSG91_AUTH_KEY: !!process.env.MSG91_AUTH_KEY,
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
      BACKEND_URL: !!process.env.BACKEND_URL,
      DATABASE_URL: !!process.env.DATABASE_URL
    };

    res.json(output);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;