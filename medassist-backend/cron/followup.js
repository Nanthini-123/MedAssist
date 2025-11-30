import pool from "../db.js";
import sendSMS from "../utils/sms.js";

export async function runNoShowFollowup() {
  const res = await pool.query(
    `SELECT b.id, v.phone, v.name
     FROM bookings b
     JOIN visitors v ON b.visitor_id = v.id
     WHERE b.attendance_status = 'NO_SHOW'
     AND b.followup_sent = FALSE
     AND b.timeslot < NOW() - INTERVAL '1 hour'`
  );

  for (let r of res.rows) {
    const msg = `Hi ${r.name}, you missed your appointment today.

Would you like to reschedule your appointment?

👉 Reschedule: https://yourfrontend.com/reschedule/${r.id}

If you do not reschedule in 24 hours, the system will auto-cancel your booking.`;

    await sendSMS(r.phone, msg);

    // mark follow-up sent
    await pool.query(
      `UPDATE bookings SET followup_sent = TRUE WHERE id = $1`,
      [r.id]
    );

    // log the notification
    await pool.query(
      `INSERT INTO notifications_log (booking_id, type, to_contact, channel, payload)
       VALUES ($1, 'no_show_followup', $2, 'sms', $3)`,
      [r.id, r.phone, { message: msg }]
    );
  }
}