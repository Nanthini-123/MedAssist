import pool from "../db.js";
import { sendSms } from "../utils/sms.js";

export async function runNoShowFollowup() {
  const res = await pool.query(
    `SELECT b.id, v.phone, v.name
     FROM bookings b
     JOIN visitors v ON b.visitor_id = v.id
     WHERE b.attendance_status = 'NO_SHOW'
     AND b.followup_sent IS NOT TRUE
     AND b.timeslot < NOW() - INTERVAL '1 hour'`
  );

  for (let r of res.rows) {
    const msg = `Hi ${r.name}, you missed your appointment today. Click to reschedule: https://yourapp.com/reschedule/${r.id}`;
    await sendSms({ phone: r.phone, message: msg }); // ✅ use named export

    await pool.query(
      `UPDATE bookings SET followup_sent = TRUE WHERE id = $1`,
      [r.id]
    );
  }
}