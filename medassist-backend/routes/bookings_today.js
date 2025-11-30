// routes/bookings_today.js
import express from "express";
import pool from "../db.js";
const router = express.Router();

router.get("/today", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.id, b.visitor_id, b.doctor_id, b.doctor_name, b.timeslot,
              v.name as visitor_name, v.phone as visitor_phone
       FROM bookings b
       JOIN visitors v ON v.id = b.visitor_id
       WHERE date_trunc('day', b.timeslot) = date_trunc('day', NOW())
       ORDER BY b.timeslot ASC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error("bookings/today error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;