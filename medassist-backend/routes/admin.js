import express from "express";
import pool from "../db.js";
const router = express.Router();

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    // bookings per last 14 days
    const bookings = await pool.query(`
      SELECT date_trunc('day', created_at) as day, count(*) as cnt
      FROM bookings
      WHERE created_at > NOW() - interval '14 days'
      GROUP BY 1 ORDER BY 1;
    `);
    // severity counts
    const severity = await pool.query(`
      SELECT severity, count(*) as cnt FROM bookings GROUP BY severity;
    `);
    res.json({ bookings: bookings.rows, severity: severity.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

export default router;