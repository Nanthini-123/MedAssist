import pool from "../db.js";

export async function autoCancelNoShow() {
  await pool.query(
    `UPDATE bookings
     SET status = 'cancelled'
     WHERE attendance_status = 'NO_SHOW'
     AND followup_sent = TRUE
     AND status = 'booked'
     AND timeslot < NOW() - INTERVAL '24 hours'`
  );
}