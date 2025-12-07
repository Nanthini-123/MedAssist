import { addToSheet } from "../utils/googlesheets.js";
import { addToHubspot } from "../utils/hubspot.js";

export async function createBooking(req, res) {
  const { name, phone, symptoms, timeslot } = req.body;

  const b = await pool.query(
    `INSERT INTO bookings(name, phone, symptoms, timeslot)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, phone, symptoms, timeslot]
  );

  // push to google sheet
  addToSheet([name, phone, symptoms, timeslot]);

  // push to hubspot
  addToHubspot(name, phone, symptoms);

  res.json({ message: "Booking created", data: b.rows[0] });
}