import express from "express";
import pool from "../db.js";

const router = express.Router();

// receptionist updates attendance
router.post("/update", async (req, res) => {
  try {
    const { booking_id, status } = req.body;

    if (!["ATTENDED", "CANCELLED", "NO_SHOW"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET attendance_status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, booking_id]
    );

    res.json({ success: true, booking: result.rows[0] });
  } catch (err) {
    console.error("Attendance update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;