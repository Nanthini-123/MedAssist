// workers/dailySummary.js
import pool from "../db.js";
import { sendBookingEmail } from "../utils/email.js";

export async function runDailySummary() {
  try {
    console.log("[daily] running");

    const todayStart = `date_trunc('day', now())`;
    const q = `
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${todayStart}) AS total_bookings,
        COUNT(*) FILTER (WHERE attendance_status = 'PRESENT' AND updated_at >= ${todayStart}) AS total_attended,
        COUNT(*) FILTER (WHERE attendance_status = 'MISSED' AND updated_at >= ${todayStart}) AS total_missed,
        COUNT(*) FILTER (WHERE status = 'rescheduled' AND updated_at >= ${todayStart}) AS total_rescheduled
      FROM bookings
    `;
    const r = await pool.query(q);
    const stats = r.rows[0];

    const html = `<p>Daily summary</p>
      <ul>
        <li>Total bookings: ${stats.total_bookings || 0}</li>
        <li>Total attended: ${stats.total_attended || 0}</li>
        <li>Total missed: ${stats.total_missed || 0}</li>
        <li>Total rescheduled: ${stats.total_rescheduled || 0}</li>
      </ul>`;

    // send to admin emails (from ENV comma-separated)
    const admins = (process.env.DAILY_REPORT_TO || "").split(",").map(s=>s.trim()).filter(Boolean);
    for (const admin of admins) {
      try {
        await sendBookingEmail({ to: admin, subject: "Daily summary", html });
      } catch (e) { console.error("[daily] send err", e?.message || e); }
    }

  } catch (err) {
    console.error("[daily] failed:", err);
  }
}