// medassist-backend/routes/booking.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { pool } from "../db.js";
import { sendBookingEmail } from "../helpers/email.js";
import { sendSmsPlain } from "../helpers/sms.js";
import { makeIcs } from "../helpers/utils.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { createBooking } from "../controllers/bookingController.js";


const router = express.Router();
router.post("/create", createBooking);

/**
 * POST /api/book
 */
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
      severity
    } = req.body;

    if (!visitorName || !visitorPhone || !doctorId || !slotId)
      return res.status(400).json({ error: "missing fields" });

    // visitor create/update
    const vis = await pool.query(
      `INSERT INTO visitors(name,email,phone,age,created_at)
       VALUES($1,$2,$3,$4,NOW())
       ON CONFLICT (email) DO UPDATE
       SET name=EXCLUDED.name, phone=EXCLUDED.phone, age=EXCLUDED.age
       RETURNING id,email`,
      [visitorName, visitorEmail, visitorPhone, visitorAge]
    );
    const visitorId = vis.rows[0].id;

    // booking
    const bookingId = uuidv4();
    const timeslotIso = new Date(`${date}T${time}:00Z`).toISOString();
    const timeslotEnd = new Date(new Date(timeslotIso).getTime() + 30 * 60000).toISOString();

    await pool.query(
      `INSERT INTO bookings
       (id, visitor_id, doctor_id, doctor_name, thirdparty_booking_id,
        service_type, timeslot, status, severity, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'booked',$8,NOW(),NOW())`,
      [
        bookingId,
        visitorId,
        doctorId,
        doctorName || doctorId,
        slotId,
        serviceType,
        timeslotIso,
        severity || "LOW"
      ]
    );

    // ICS
    const ics = makeIcs({
      startIso: timeslotIso,
      endIso: timeslotEnd,
      title: `${serviceType} with ${doctorName || doctorId}`,
      description: `MedAssist booking ${bookingId}`
    });

    // EMAIL
    if (visitorEmail) {
      await sendBookingEmail({
        to: visitorEmail,
        visitorName,
        doctorName: doctorName || doctorId,
        date,
        time,
        bookingId,
        ics,
        mapsLink: process.env.CLINIC_MAP_LINK,
        clinicPhone: process.env.CLINIC_PHONE
      });
    }

    // SMS
    if (visitorPhone) {
      await sendSmsPlain({
        phone: visitorPhone,
        message: `✔ Appointment Confirmed
${date} at ${time}
Doctor: ${doctorName || doctorId}
Maps: ${process.env.CLINIC_MAP_LINK}
Reception: ${process.env.CLINIC_PHONE}`
      });
    }

    // Google Sheet webhook (optional)
    if (process.env.SHEETS_WEBHOOK_URL) {
      axios
        .post(
          process.env.SHEETS_WEBHOOK_URL,
          {
            bookingId,
            visitorName,
            visitorEmail,
            visitorPhone,
            doctorId,
            doctorName,
            serviceType,
            date,
            time
          },
          { timeout: 5000 }
        )
        .catch(() => {});
    }

    // log
    await pool.query(
      `INSERT INTO notifications_log
       (booking_id,type,to_contact,payload,created_at)
       VALUES($1,$2,$3,$4,NOW())`,
      [bookingId, "booking_confirm", visitorPhone || visitorEmail, JSON.stringify({ bookingId })]
    );

    // fetch clinic info
    let clinic = {
      name: "",
      address: "",
      maps_link: process.env.CLINIC_MAP_LINK,
      reception_phone: process.env.CLINIC_PHONE
    };

    try {
      const c = await fetch(
        `${process.env.BASE_URL || "http://localhost:10000"}/api/clinic`
      );
      clinic = await c.json();
    } catch (e) {}

    res.json({ success: true, bookingId, clinic });
  } catch (err) {
    console.error("BOOK ERROR", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;