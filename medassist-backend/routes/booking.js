// routes/booking.js
import express from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

// utils
import { sendSms } from "../utils/sms.js";
import { sendBookingEmail } from "../utils/email.js";
import { makeIcs } from "../helpers/utils.js";

const router = express.Router();

/* ---------------------------------------------------------
   CREATE BOOKING
--------------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const {
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorAge,
      doctorId,
      doctorName,
      slotId,
      serviceType,
      date,
      time,
      severity,
    } = req.body;

    if (!visitorName || !visitorPhone || !doctorId || !slotId)
      return res.status(400).json({ error: "Missing required fields" });

    // Visitor
    const vis = await pool.query(
      `INSERT INTO visitors(name,email,phone,age,created_at)
       VALUES($1,$2,$3,$4,NOW())
       ON CONFLICT (email) DO UPDATE
       SET name=EXCLUDED.name, phone=EXCLUDED.phone, age=EXCLUDED.age
       RETURNING id`,
      [visitorName, visitorEmail, visitorPhone, visitorAge]
    );
    const visitorId = vis.rows[0].id;

    // Doctor specialty
    const doc = await pool.query(`SELECT specialty FROM doctors WHERE id=$1`, [
      doctorId,
    ]);
    const specialty = doc.rows[0]?.specialty || "";

    // Slot type
    const slot = await pool.query(`SELECT slot_type FROM slots WHERE id=$1`, [
      slotId,
    ]);
    const slotType = slot.rows[0]?.slot_type || "";

    // Generate booking ID
    const bookingId = uuidv4();
    const timeslotIso = new Date(`${date}T${time}:00Z`).toISOString();
    const timeslotEnd = new Date(
      new Date(timeslotIso).getTime() + 30 * 60000
    ).toISOString();

    // Create booking
    await pool.query(
      `INSERT INTO bookings
      (id, visitor_id, doctor_id, doctor_name, thirdparty_booking_id,
       service_type, timeslot, status, severity,
       created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'booked',$8,NOW(),NOW())`,
      [
        bookingId,
        visitorId,
        doctorId,
        doctorName || doctorId,
        slotId,
        serviceType,
        timeslotIso,
        severity || "LOW",
      ]
    );

    // ICS file
    const ics = makeIcs({
      startIso: timeslotIso,
      endIso: timeslotEnd,
      title: `${serviceType} with ${doctorName}`,
    });

    // Send email
    if (visitorEmail) {
      await sendBookingEmail({
        to: visitorEmail,
        subject: `Appointment Confirmed with ${doctorName}`,
        html: `<b>Confirmed</b> on ${date} at ${time}`,
        attachments: [
          {
            filename: "appointment.ics",
            content: Buffer.from(ics).toString("base64"),
            type: "text/calendar",
          },
        ],
      });
    }

    // Send SMS
    await sendSms({
      phone: visitorPhone,
      message: `✔ Appointment Confirmed\nDoctor: ${doctorName}\n${date} at ${time}`,
    });

    // Google Sheet Webhook
    if (process.env.SHEETS_WEBHOOK_URL) {
      axios.post(process.env.SHEETS_WEBHOOK_URL, {
        bookingId,
        visitorName,
        visitorEmail,
        visitorPhone,
        doctorId,
        doctorName,
        specialty,
        serviceType,
        date,
        time,
        slotType,
        severity,
      });
    }

    return res.json({
  success: true,
  bookingId,

  // Patient Info
  visitorName,
  visitorPhone,
  visitorEmail,
  visitorAge,

  // Doctor Info
  doctorId,
  doctorName,
  specialty,

  // Timing
  date,
  time,
  slotType,
  serviceType,

  // Static Clinic Info
  clinicName: "Cliqtrix Health Clinic",
  clinicAddress: "No.5, Medavakkam, Chennai – 600100",
  clinicPhone: "+91 9876543210",
  clinicMapLink: process.env.CLINIC_MAP_LINK,

  // Booking
  status: "BOOKED"
});
  } catch (err) {
    console.error("BOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   GET ALL BOOKINGS
--------------------------------------------------------- */
router.get("/", async (req, res) => {
  const r = await pool.query(`SELECT * FROM bookings ORDER BY created_at DESC`);
  res.json(r.rows);
});

/* ---------------------------------------------------------
   GET BOOKING BY ID
--------------------------------------------------------- */
router.get("/:id", async (req, res) => {
  const r = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [
    req.params.id,
  ]);
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json(r.rows[0]);
});

/* ---------------------------------------------------------
   MARK ATTEND
--------------------------------------------------------- */
router.patch("/:id/attend", async (req, res) => {
  const r = await pool.query(
    `UPDATE bookings SET attendance_status='PRESENT', status='completed', updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [req.params.id]
  );

  if (r.rowCount === 0)
    return res.status(404).json({ error: "Booking not found" });

  res.json({ message: "Attendance marked PRESENT", booking: r.rows[0] });
});

/* ---------------------------------------------------------
   CANCEL BOOKING
--------------------------------------------------------- */
router.patch("/:id/cancel", async (req, res) => {
  const r = await pool.query(
    `UPDATE bookings SET status='cancelled', updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [req.params.id]
  );

  if (r.rowCount === 0)
    return res.status(404).json({ error: "Booking not found" });

  res.json({ message: "Booking cancelled", booking: r.rows[0] });
});

/* ---------------------------------------------------------
   RESCHEDULE BOOKING
--------------------------------------------------------- */
router.patch("/:id/reschedule", async (req, res) => {
  const { date, time, slotId } = req.body;

  const newTimeslot = new Date(`${date}T${time}:00Z`).toISOString();

  const r = await pool.query(
    `UPDATE bookings SET timeslot=$1, thirdparty_booking_id=$2, status='rescheduled', updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [newTimeslot, slotId, req.params.id]
  );

  if (r.rowCount === 0)
    return res.status(404).json({ error: "Booking not found" });

  res.json({ message: "Booking rescheduled", booking: r.rows[0] });
});

export default router;