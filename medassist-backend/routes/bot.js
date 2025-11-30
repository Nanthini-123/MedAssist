// routes/bot.js
// Chatbot webhook endpoint for SalesIQ / any chat provider.
// Handles simple replies like: YES / CANCEL / STATUS / HELP
// - YES -> reschedule the latest MISSED booking to the next available slot for same doctor
// - CANCEL -> cancel the latest MISSED booking
// - STATUS -> return latest booking status
// - HELP -> return supported commands
//
// Assumptions:
// - pool from ../db.js (pg Pool) exists
// - sendSms in ../utils/sms.js exists
// - sendBookingEmail in ../utils/email.js exists
// - slots table has columns: id, doctor_id, date (date), time (time or text), status ('available'|'booked'), slot_type
// - visitors table has phone numbers stored in same format the bot sends (we attempt simple normalization)
// - bookings table contains: id, visitor_id, doctor_id, timeslot, status, attendance_status, thirdparty_booking_id, reschedule_count
//
// Usage: POST /api/bot/webhook
// Body: { phone: "919876543210", message: "YES" }

import express from "express";
import pool from "../db.js";
import { sendSms } from "../utils/sms.js";
import { sendBookingEmail } from "../utils/email.js";
import axios from "axios";

const router = express.Router();

function normalizePhone(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  // remove spaces, dashes, parentheses, leading +
  s = s.replace(/[ \-\(\)\.]/g, "").replace(/^\+/, "");
  // if 10 digits assume India and prefix 91 (change if you want)
  if (/^[0-9]{10}$/.test(s)) {
    s = "91" + s;
  }
  return s;
}

function messageIntent(text) {
  if (!text) return "unknown";
  const t = text.trim().toLowerCase();
  if (["yes", "y", "ok", "sure", "reschedule", "resched"].includes(t)) return "yes";
  if (["cancel", "c", "no", "nah"].includes(t)) return "cancel";
  if (["status", "my booking", "details", "info"].some(k => t.includes(k))) return "status";
  if (["help", "hi", "hello"].some(k => t.includes(k))) return "help";
  // allow "reschedule to <date/time>" in future - basic detection
  if (t.startsWith("reschedule") || t.includes("reschedule")) return "reschedule_request";
  return "unknown";
}

async function getLatestMissedOrRecentBookingByPhone(phone) {
  // Prefer a MISSED booking (to handle replies to missed SMS). If none found, return latest booking.
  const q = `
    SELECT b.*, v.id as visitor_id, v.name as visitor_name, v.email as visitor_email, v.phone as visitor_phone
    FROM bookings b
    JOIN visitors v ON v.id = b.visitor_id
    WHERE v.phone = $1
    ORDER BY
      (CASE WHEN b.attendance_status = 'MISSED' THEN 0 ELSE 1 END), -- MISSED first
      b.created_at DESC
    LIMIT 1
  `;
  const r = await pool.query(q, [phone]);
  return r.rows[0] || null;
}

async function findNextAvailableSlotForDoctor(client, doctorId) {
  // We use FOR UPDATE SKIP LOCKED to avoid race conditions (concurrent bots).
  // This assumes slots.date + slots.time exist (or slots.timeslot/timestamp). Adjust if your schema differs.
  // We'll try to pick the earliest available slot in future.
  const q = `
    SELECT id, date, time, slot_type
    FROM slots
    WHERE doctor_id = $1
      AND status = 'available'
      AND (date + time::interval) >= NOW()   -- ensure future (if stored as date + time)
    ORDER BY date ASC, time ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;

  // Note: If your slots schema stores a single timestamp column 'timeslot', replace the query accordingly.
  const res = await client.query(q, [doctorId]);
  return res.rows[0] || null;
}

async function reserveSlotAndRescheduleBooking(client, bookingId, slot) {
  // slot: { id, date, time } — we'll build a new ISO timeslot from date+time
  // Make sure slot fields match your DB (date is date, time is text or time)
  // Example created ISO: new Date(`${slot.date.toISOString().slice(0,10)}T${slot.time}:00Z`)
  const dateStr = slot.date instanceof Date
    ? slot.date.toISOString().slice(0,10)
    : String(slot.date);

  // slot.time might be '09:00:00' or '09:00'
  const timeStr = String(slot.time).length === 5 ? `${slot.time}:00` : String(slot.time);

  const newTimeslotIso = new Date(`${dateStr}T${timeStr}Z`).toISOString();

  // Mark slot booked and update booking
  await client.query(`UPDATE slots SET status='booked' WHERE id = $1`, [slot.id]);

  await client.query(
    `UPDATE bookings
     SET timeslot = $1, status = 'rescheduled', attendance_status = 'PENDING', reschedule_count = COALESCE(reschedule_count,0)+1, updated_at = NOW()
     WHERE id = $2`,
    [newTimeslotIso, bookingId]
  );

  return newTimeslotIso;
}

router.post("/webhook", async (req, res) => {
  try {
    const { phone: rawPhone, message } = req.body;
    if (!rawPhone || !message) return res.status(400).json({ error: "phone & message required" });

    const phone = normalizePhone(rawPhone);
    if (!phone) return res.status(400).json({ error: "invalid phone" });

    const intent = messageIntent(message);

    // fetch latest booking (prefer MISSED)
    const booking = await getLatestMissedOrRecentBookingByPhone(phone);
    if (!booking) {
      // nothing to act upon
      await sendSms({ phone, message: "No related booking found. Reply HELP for options." }).catch(()=>{});
      return res.json({ success: true, info: "no booking found" });
    }

    // Handlers
    if (intent === "help") {
      const helpText = `I can help with:
- YES -> Reschedule your missed appointment to the next available slot
- CANCEL -> Cancel your missed appointment
- STATUS -> Get your current booking details
Reply YES to reschedule or CANCEL to cancel.`;
      await sendSms({ phone, message: helpText }).catch(()=>{});
      return res.json({ success: true, info: "help sent" });
    }

    if (intent === "status") {
      const timeslotStr = booking.timeslot ? new Date(booking.timeslot).toLocaleString() : "N/A";
      const statusMsg = `Booking ${booking.id}: ${booking.service_type || ""} with ${booking.doctor_name || booking.doctor_id}
Date/time: ${timeslotStr}
Status: ${booking.status || ""}, Attendance: ${booking.attendance_status || ""}`;
      await sendSms({ phone, message: statusMsg }).catch(()=>{});
      return res.json({ success: true, info: "status sent" });
    }

    if (intent === "cancel") {
      // Cancel the found booking
      await pool.query(`UPDATE bookings SET status='cancelled', updated_at=NOW() WHERE id = $1`, [booking.id]);
      await sendSms({ phone, message: `Your appointment ${booking.id} has been cancelled.` }).catch(()=>{});
      // notify sheets
      if (process.env.SHEETS_WEBHOOK_URL) {
        axios.post(process.env.SHEETS_WEBHOOK_URL, { action: "cancel", bookingId: booking.id }).catch(()=>{});
      }
      return res.json({ success: true, action: "cancelled" });
    }

    if (intent === "yes" || intent === "reschedule_request") {
      // Reschedule flow: transactional reservation of next available slot for same doctor
      const conn = await pool.connect();
      try {
        await conn.query("BEGIN");

        // find next available slot (transactional)
        const slot = await findNextAvailableSlotForDoctor(conn, booking.doctor_id);
        if (!slot) {
          // no slots
          await conn.query("ROLLBACK");
          const noSlotMsg = "Sorry, no available slots right now. An operator will contact you shortly.";
          await sendSms({ phone, message: noSlotMsg }).catch(()=>{});
          return res.json({ success: false, error: "no slots available" });
        }

        // reserve slot and update booking
        const newTimeslotIso = await reserveSlotAndRescheduleBooking(conn, booking.id, slot);

        // commit
        await conn.query("COMMIT");

        // notify user
        const niceTime = new Date(newTimeslotIso).toLocaleString();
        const confirmMsg = `Your appointment has been rescheduled to ${niceTime}. Booking ID: ${booking.id}`;
        await sendSms({ phone, message: confirmMsg }).catch(()=>{});
        if (booking.visitor_email) {
          await sendBookingEmail({
            to: booking.visitor_email,
            subject: "Appointment Rescheduled",
            text: `Your appointment has been rescheduled to ${niceTime}.`,
            html: `<p>Your appointment has been rescheduled to <b>${niceTime}</b>.</p>`
          }).catch(()=>{});
        }

        // notify sheets webhook about reschedule
        if (process.env.SHEETS_WEBHOOK_URL) {
          axios.post(process.env.SHEETS_WEBHOOK_URL, {
            action: "reschedule",
            bookingId: booking.id,
            newTimeslot: newTimeslotIso
          }).catch(()=>{});
        }

        return res.json({ success: true, action: "rescheduled", newTimeslot: newTimeslotIso });
      } catch (err) {
        await conn.query("ROLLBACK").catch(()=>{});
        console.error("[bot reschedule] error", err);
        // fallback: inform user
        await sendSms({ phone, message: "Sorry, reschedule failed. An operator will contact you." }).catch(()=>{});
        return res.status(500).json({ error: "reschedule_failed" });
      } finally {
        conn.release();
      }
    }

    // default unknown replies: echo or instruct
    await sendSms({ phone, message: "Sorry I didn't understand. Reply HELP for options." }).catch(()=>{});
    return res.json({ success: true, info: "unknown intent" });

  } catch (err) {
    console.error("[bot webhook] error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;