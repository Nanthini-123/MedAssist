import pool from "../db.js";
import sendEmail from "../utils/email.js";

export async function sendDailySummary() {
  const summary = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE attendance_status = 'ATTENDED') AS attended,
      COUNT(*) FILTER (WHERE attendance_status = 'CANCELLED') AS cancelled,
      COUNT(*) FILTER (WHERE attendance_status = 'NO_SHOW') AS missed
    FROM bookings
    WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day';
  `);

  const s = summary.rows[0];

  const body = `
Daily Summary Report (Yesterday):

Total bookings: ${s.total}
Attended: ${s.attended}
Cancelled: ${s.cancelled}
Missed: ${s.missed}
  `;

  await sendEmail("admin@clinic.com", "Daily Summary Report", body);
}