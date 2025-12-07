// routes/visitor.js
import express from "express";
import pool from "../db.js";
const router = express.Router();

/**
 * POST /api/visitors
 * Create a new visitor
 */
router.post("/", async (req, res) => {
  const { name, phone, age, gender, email } = req.body;
  if (!name || !phone) return res.status(400).json({ error: "name & phone required" });

  try {
    const result = await pool.query(
      `INSERT INTO visitors (name, phone, age, gender, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, phone, age || null, gender || null, email || null]
    );

    res.json({ success: true, visitor: result.rows[0] });
  } catch (err) {
    console.error("Create Visitor error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/visitors/:id
 * Fetch visitor by ID
 */
router.get("/:id", async (req, res) => {
  const  id  = req.params.id.trim();

  try {
    const v = await pool.query("SELECT * FROM visitors WHERE id=$1", [id]);
    if (!v.rows.length) return res.status(404).json({ error: "visitor not found" });

    const visitor = v.rows[0];
    const bookings = await pool.query(
      "SELECT * FROM bookings WHERE visitor_id=$1 ORDER BY created_at DESC",
      [id]
    );
    const notes = await pool.query(
      "SELECT * FROM notes WHERE visitor_id=$1 ORDER BY created_at DESC",
      [id]
    );

    res.json({
      success: true,
      visitor,
      upcomingBookings: bookings.rows,
      notes: notes.rows
    });
  } catch (err) {
    console.error("Get Visitor error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/visitors/:id/notes
 * Add a note to a visitor
 */
router.post("/:id/notes", async (req, res) => {
  const  id  = req.params.id.trim();
  const { noteText, operatorId } = req.body;
  if (!noteText) return res.status(400).json({ error: "noteText required" });

  try {
    const r = await pool.query(
      "INSERT INTO notes(visitor_id, operator_id, note, created_at) VALUES($1, $2, $3, NOW()) RETURNING *",
      [id, operatorId || null, noteText]
    );
    res.json({ success: true, note: r.rows[0] });
  } catch (err) {
    console.error("Add Note error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/visitors/phone/:phone
 * Fetch visitor by phone number
 */
router.get("/phone/:phone", async (req, res) => {
  const phone = req.params.phone.trim();
  try {
    const v = await pool.query("SELECT * FROM visitors WHERE phone=$1", [phone]);
    if (!v.rows.length) return res.status(404).json({ error: "visitor not found" });

    const visitor = v.rows[0];
    const bookings = await pool.query(
      "SELECT * FROM bookings WHERE visitor_id=$1 ORDER BY created_at DESC",
      [visitor.id]
    );
    const notes = await pool.query(
      "SELECT * FROM notes WHERE visitor_id=$1 ORDER BY created_at DESC",
      [visitor.id]
    );

    res.json({
      success: true,
      visitor,
      upcomingBookings: bookings.rows,
      notes: notes.rows
    });
  } catch (err) {
    console.error("Get Visitor by phone error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;