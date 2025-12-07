// workers/missed.js
import pool from "../db.js";
import { sendSms } from "../utils/sms.js";
import { sendBookingEmail } from "../utils/email.js";

export async function runMissedWorker() {
  try {
    console.log("[missed] running");

    const q = `
      SELECT b.*, v.phone, v.email
      FROM bookings b
      JOIN visitors v ON v.id = b.visitor_id
      WHERE b.status = 'booked'
        AND b.attendance_status = 'PENDING'
        AND b.timeslot < NOW() - INTERVAL '15 minutes'
    `;
    const r = await pool.query(q);

    for (const row of r.rows) {
      const phone = row.phone;
      const email = row.email;
      const doctorName = row.doctor_name || row.doctor_id;
      const timeslot = new Date(row.timeslot).toISOString().replace("T", " ").split(".")[0];

      // mark missed in DB
      await pool.query(
        `UPDATE bookings SET status='missed', attendance_status='MISSED', updated_at=NOW() WHERE id = $1`,
        [row.id]
      );

      // send missed message with CTA to reschedule
      const sms = `You missed your appointment with ${doctorName} on ${timeslot}. Reply YES to reschedule or visit the clinic to reschedule.`;
      if (phone) {
        try { await sendSms({ phone, message: sms }); } catch (e) { console.error("[missed] sms err", e?.message || e); }
      }

      if (email) {
        try {
          await sendBookingEmail({
            to: email,
            subject: `Missed appointment with ${doctorName}`,
            text: `You missed your appointment on ${timeslot}. Reply YES to reschedule.`,
          });
        } catch (e) { console.error("[missed] email err", e?.message || e); }
      }

      // mark followup_sent=false so followup worker will send follow-up
      await pool.query(`UPDATE bookings SET followup_sent = false WHERE id = $1`, [row.id]);
    }

  } catch (err) {
    console.error("[missed] failed:", err);
  }
}