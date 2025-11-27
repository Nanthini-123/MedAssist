// workers/followupWorker.js
import { pool } from "../db.js";
import { sendSmsPlain } from "../helpers/sms.js";

export async function runFollowupWorker() {
  try {
    console.log("Follow-up worker running...");

    // 1. Define time window: yesterday 00:00 → yesterday 23:59
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(now.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(now);
    yesterdayEnd.setDate(now.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // 2. FETCH missed OR null attendance
    const result = await pool.query(
      `SELECT *
       FROM bookings
       WHERE attendance_status != 'ATTENDED'
       AND attendance_status != 'CANCELLED'
       AND timeslot BETWEEN $1 AND $2`,
      [yesterdayStart.toISOString(), yesterdayEnd.toISOString()]
    );

    const bookings = result.rows;

    console.log("Found:", bookings.length, "bookings");

    // 3. For each booking → send follow-up SMS
    for (const b of bookings) {
      const phone = b.visitor_phone;

      if (!phone) continue;

      const msg = `Hi ${b.visitor_name}, we noticed you couldn't attend your appointment yesterday.\nTap to reschedule: https://yourclinic.com/reschedule/${b.id}`;

      await sendSmsPlain({ phone, message: msg });

      console.log("Sent follow-up to:", phone);

      // log
      await pool.query(
        "INSERT INTO notifications_log(booking_id,type,to_contact,payload,created_at) VALUES($1,$2,$3,$4,NOW())",
        [b.id, "followup", phone, JSON.stringify({ missed: true })]
      );
    }

    console.log("Follow-up worker finished.");
  } catch (err) {
    console.error("FOLLOWUP WORKER ERROR:", err.message);
  }
}