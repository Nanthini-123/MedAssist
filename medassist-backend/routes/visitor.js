import express from "express";
import { pool } from "../db.js";
const router = express.Router();

// GET /api/visitor-context?email=...
router.get("/", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email required" });
  try {
    const v = await pool.query("SELECT * FROM visitors WHERE email=$1", [email]);
    if (!v.rows.length) return res.status(404).json({ error: "visitor not found" });
    const visitor = v.rows[0];
    const bookings = await pool.query("SELECT * FROM bookings WHERE visitor_id=$1 ORDER BY created_at DESC", [visitor.id]);
    const notes = await pool.query("SELECT * FROM notes WHERE visitor_id=$1 ORDER BY created_at DESC", [visitor.id]);
    res.json({
      visitorName: visitor.name,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone,
      upcomingBookings: bookings.rows,
      notes: notes.rows
    });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// POST /api/notes
router.post("/notes", async (req, res) => {
  const { visitorEmail, noteText, operatorId } = req.body;
  if (!visitorEmail || !noteText) return res.status(400).json({ error: "missing" });
  try {
    const v = await pool.query("SELECT id FROM visitors WHERE email=$1", [visitorEmail]);
    if (!v.rows.length) return res.status(404).json({ error: "visitor not found" });
    const vid = v.rows[0].id;
    const r = await pool.query("INSERT INTO notes(visitor_id,operator_id,note,created_at) VALUES($1,$2,$3,NOW()) RETURNING *", [vid, operatorId, noteText]);
    res.json({ success: true, note: r.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

export default router;