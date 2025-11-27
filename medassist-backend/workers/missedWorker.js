import db from "../db.js";
import sendSMS from "../utils/sendSMS.js";

export async function runMissedCheck() {
  try {
    const now = new Date();

    // appointments 20–25 minutes in the past
    const start = new Date(now.getTime() - 25 * 60000);
    const end = new Date(now.getTime() - 20 * 60000);

    const bookings = await db.manyOrNone(
      `SELECT * FROM bookings
       WHERE appointment_datetime BETWEEN $1 AND $2`,
      [start, end]
    );

    for (const b of bookings) {
      const exists = await db.oneOrNone(
        `SELECT id FROM notifications_log 
        WHERE booking_id=$1 AND type='MISSED'`,
        [b.id]
      );

      if (exists) continue;

      const msg = `
Hi ${b.visitor_name}, 
We noticed you missed your appointment. 
Reply YES to reschedule or visit the chatbot to book again.
      `;

      await sendSMS(b.visitor_phone, msg);

      await db.none(
        `INSERT INTO notifications_log (booking_id, type)
         VALUES ($1, 'MISSED')`,
        [b.id]
      );

      console.log("Sent missed follow-up", b.id);
    }
  } catch (err) {
    console.log("Missed worker error:", err.message);
  }
}