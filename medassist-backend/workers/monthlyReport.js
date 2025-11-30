// workers/monthlyReport.js
import pool from "../db.js";
import { sendBookingEmail } from "../utils/email.js";

export async function runMonthlyReport() {
  try {
    console.log("[monthly] running");

    const q = `
      SELECT
        COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now())) AS total_bookings,
        COUNT(*) FILTER (WHERE attendance_status='MISSED' AND date_trunc('month', updated_at) = date_trunc('month', now())) AS total_missed
      FROM bookings
    `;
    const r = await pool.query(q);
    const stats = r.rows[0];

    const html = `<p>Monthly report</p>
      <ul>
        <li>Total bookings this month: ${stats.total_bookings || 0}</li>
        <li>Total missed this month: ${stats.total_missed || 0}</li>
      </ul>`;

    const admins = (process.env.MONTHLY_REPORT_TO || "").split(",").map(s=>s.trim()).filter(Boolean);
    for (const admin of admins) {
      try {
        await sendBookingEmail({ to: admin, subject: "Monthly report", html });
      } catch(e){ console.error("[monthly] err", e?.message || e); }
    }

  } catch (err) {
    console.error("[monthly] failed:", err);
  }
}