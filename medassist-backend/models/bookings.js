// models/bookings.js
import { pool } from "../db.js";

export async function createBooking({ visitor_id, doctor_id, thirdparty_booking_id, service_type, timeslot }) {
  const { rows } = await pool.query(
    `INSERT INTO bookings (visitor_id, doctor_id, thirdparty_booking_id, service_type, timeslot) 
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
     [visitor_id, doctor_id, thirdparty_booking_id, service_type, timeslot]
  );
  return rows[0];
}

export async function getBookingsByVisitorId(visitor_id) {
  const { rows } = await pool.query(`SELECT * FROM bookings WHERE visitor_id=$1 ORDER BY created_at DESC`, [visitor_id]);
  return rows;
}

export async function updateBookingStatus(bookingId, status, newTimeslot = null) {
  const { rows } = await pool.query(
    `UPDATE bookings SET status=$1, timeslot=COALESCE($3,timeslot), updated_at=now() WHERE id=$2 RETURNING *`,
    [status, bookingId, newTimeslot]
  );
  return rows[0];
}