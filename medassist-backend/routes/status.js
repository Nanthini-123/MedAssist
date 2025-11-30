// routes/status.js
import express from "express";
import pool from "../db.js";
import { updateStatusInSheet } from "../utils/googlesheets.js";
import { sendStatusMessage } from "../utils/notify.js";

const router = express.Router();

/**
 * POST /status/updateStatus
 * body: { phone, status, updatedBy }
 */
router.post("/updateStatus", async (req, res) => {
  try {
    const { phone, status, updatedBy } = req.body;
    if (!phone || !status) return res.status(400).json({ error: "phone & status required" });

    // update Google Sheet
    const out = await updateStatusInSheet(phone, status, updatedBy || "OPERATOR");

    // update DB attendance_status (best-effort: find today's booking)
    try {
      await pool.query(
        `UPDATE bookings
         SET attendance_status = $1, updated_at = NOW()
         WHERE visitor_id = (SELECT id FROM visitors WHERE phone = $2 OR phone = $3)
           AND date_trunc('day', timeslot) = date_trunc('day', NOW())`,
        [status === "PRESENT" ? "PRESENT" : status === "ABSENT" ? "ABSENT" : status === "CANCELLED" ? "CANCELLED" : status, phone, phone.replace(/^\+/, "")]
      );
    } catch (dbErr) {
      console.warn("DB attendance update failed (non-fatal):", dbErr.message || dbErr);
    }

    // read name from sheet row for nicer notification (optional attempt)
    let name = null;
    try {
      // we can read the sheet via updateStatusInSheet result (it gives row),
      // but simpler: reuse sheet read to get name (index 0)
      // quick read:
      // (call readRows in sheet util, not provided here to keep file smaller)
    } catch (e) {}

    // Send polite message to patient
    try {
      await sendStatusMessage(phone, status); // notify with status; notify module composes polite message
    } catch (e) {
      console.warn("notify fail:", e.message || e);
    }

    res.json({ success: true, row: out.row });
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;