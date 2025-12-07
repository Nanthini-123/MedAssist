// workers/reminder.js
import pool from "../db.js";
import { sendSms } from "../utils/sms.js";
import { sendBookingEmail } from "../utils/email.js";

export async function runReminderWorker() {
  try {
    console.log("[reminder] running");

    // select bookings roughly 1 hour ahead which are still booked and not reminded
    const q = `
      SELECT b.*, v.phone, v.email
      FROM bookings b
      JOIN visitors v ON v.id = b.visitor_id
      WHERE b.status = 'booked'
        AND b.reminded = false
        AND b.timeslot BETWEEN NOW() + INTERVAL '59 minutes' AND NOW() + INTERVAL '61 minutes'
    `;
    const r = await pool.query(q);

    for (const row of r.rows) {
      const phone = row.phone;
      const email = row.email;
      const doctorName = row.doctor_name || row.doctor_id;
      const timeslot = new Date(row.timeslot).toISOString().replace("T", " ").split(".")[0];

      const sms = `Reminder: Your appointment with ${doctorName} is in 1 hour (${timeslot}).`;
      if (phone) {
        try { await sendSms({ phone, message: sms }); } catch (e) { console.error("[reminder] sms error", e?.message || e); }
      }

      if (email) {
        try {
          await sendBookingEmail({
            to: email,
            subject: `Reminder: Appointment in 1 hour`,
            text: `Your appointment with ${doctorName} is in 1 hour (${timeslot}).`
          });
        } catch (e) { console.error("[reminder] email err", e?.message || e); }
      }

      // mark reminded
      await pool.query(`UPDATE bookings SET reminded = true WHERE id = $1`, [row.id]);
    }

  } catch (err) {
    console.error("[reminder] failed:", err);
  }
}