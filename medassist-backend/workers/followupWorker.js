// workers/followup.js
import pool from "../db.js";
import { sendSms } from "../utils/sms.js";
import { sendBookingEmail } from "../utils/email.js";

export async function runFollowupWorker() {
  try {
    console.log("[followup] running");

    const q = `
      SELECT b.*, v.phone, v.email, v.name
      FROM bookings b
      JOIN visitors v ON v.id = b.visitor_id
      WHERE b.attendance_status = 'MISSED'
        AND b.followup_sent = false
    `;
    const r = await pool.query(q);

    for (const row of r.rows) {
      const phone = row.phone;
      const email = row.email;
      const doctorName = row.doctor_name || row.doctor_id;

      const sms = `We noticed you missed your appointment with ${doctorName}. Reply YES to reschedule or call reception.`;
      if (phone) {
        try { await sendSms({ phone, message: sms }); } catch (e) { console.error("[followup] sms err", e?.message || e); }
      }

      if (email) {
        try {
          await sendBookingEmail({
            to: email,
            subject: `Missed appointment follow-up`,
            text: `We noticed you missed your appointment with ${doctorName}. Reply YES to reschedule.`,
          });
        } catch (e) { console.error("[followup] email err", e?.message || e); }
      }

      await pool.query(`UPDATE bookings SET followup_sent = true WHERE id = $1`, [row.id]);
    }

  } catch (err) {
    console.error("[followup] failed:", err);
  }
}