import express from "express";
import pool from "../db.js";
import { sendBookingEmail } from "../helpers/email.js";
import { sendSms } from "../utils/sms.js";
import { makeIcs } from "../helpers/utils.js";
import axios from "axios"; // for optional sheet push
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

/**
 * GET /api/operator/visitor?email=<email>
 * returns visitor context used by widget
 */
router.get("/visitor", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "email required" });
  try {
    const v = await pool.query("SELECT * FROM visitors WHERE email=$1", [email]);
    if (!v.rows.length) return res.status(404).json({ error: "visitor not found" });
    const visitor = v.rows[0];

    const bookings = await pool.query("SELECT * FROM bookings WHERE visitor_id=$1 ORDER BY created_at DESC", [visitor.id]);
    const notes = await pool.query("SELECT * FROM notes WHERE visitor_id=$1 ORDER BY created_at DESC", [visitor.id]);

    // load reports stub (if you store urls in a table, load from there; for now empty)
    const reports = []; // TODO: implement reports table or file storage

    // optional fields like lastMessages, symptoms, suggestedSpecialty, severity
    // if you store symptoms in bookings or elsewhere, fetch and add. For now placeholder:
    const lastMessages = null;
    const suggestedSpecialty = null;
    const severity = null;

    res.json({
      visitorName: visitor.name,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone,
      age: visitor.age,
      upcomingBookings: bookings.rows,
      notes: notes.rows,
      reports,
      lastMessages,
      suggestedSpecialty,
      severity
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/operator/add-note
 * body: { visitorEmail, noteText, operatorId }
 */
router.post("/add-note", async (req, res) => {
  const { visitorEmail, noteText, operatorId } = req.body;
  if (!visitorEmail || !noteText) return res.status(400).json({ error: "missing" });
  try {
    const v = await pool.query("SELECT id FROM visitors WHERE email=$1", [visitorEmail]);
    if (!v.rows.length) return res.status(404).json({ error: "visitor not found" });
    const vid = v.rows[0].id;
    const r = await pool.query(
      "INSERT INTO notes(visitor_id, operator_id, note, created_at) VALUES($1,$2,$3,NOW()) RETURNING *",
      [vid, operatorId || "operator", noteText]
    );
    res.json({ success: true, note: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/operator/cancel
 * body: { bookingId }
 */
router.post("/cancel", async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: "bookingId required" });
  try {
    const b = await pool.query("SELECT b.*, v.email, v.phone, v.name FROM bookings b JOIN visitors v ON b.visitor_id=v.id WHERE b.id=$1", [bookingId]);
    if (!b.rows.length) return res.status(404).json({ error: "booking not found" });
    const booking = b.rows[0];
    await pool.query("UPDATE bookings SET status='cancelled', updated_at=NOW() WHERE id=$1", [bookingId]);

    // Notify patient via email + SMS
    await sendBookingEmail({
      to: booking.email,
      visitorName: booking.name,
      doctorName: booking.doctor_name || booking.doctor_id,
      date: booking.timeslot.toISOString().split("T")[0],
      time: booking.timeslot.toISOString().split("T")[1].split(".")[0],
      bookingId
    });

    await sendSms({ phone: booking.phone, message: `Your appointment ${bookingId} has been cancelled.` });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/operator/resend-confirmation
 * body: { bookingId }
 */
router.post("/resend-confirmation", async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: "bookingId required" });
  try {
    const r = await pool.query("SELECT b.*, v.email, v.phone, v.name FROM bookings b JOIN visitors v ON b.visitor_id=v.id WHERE b.id=$1", [bookingId]);
    if (!r.rows.length) return res.status(404).json({ error: "booking not found" });
    const booking = r.rows[0];

    // Generate ICS again
    const startIso = booking.timeslot.toISOString();
    const endIso = new Date(new Date(startIso).getTime() + 30*60000).toISOString();
    const ics = makeIcs({ startIso, endIso, title:`${booking.service_type} with ${booking.doctor_name||booking.doctor_id}`, description: `Booking ${bookingId}` });

    await sendBookingEmail({
      to: booking.email,
      visitorName: booking.name,
      doctorName: booking.doctor_name || booking.doctor_id,
      date: startIso.split("T")[0],
      time: startIso.split("T")[1].split(".")[0],
      bookingId,
      ics
    });

    await sendSms({ phone: booking.phone, message: `Reminder: your appointment ${bookingId} is scheduled at ${startIso}` });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/operator/reschedule
 * body: { bookingId, newDate, newTime }
 */
router.post("/reschedule", async (req, res) => {
  const { bookingId, newDate, newTime } = req.body;
  if (!bookingId || !newDate || !newTime) return res.status(400).json({ error: "missing fields" });
  try {
    const r = await pool.query("SELECT b.*, v.email, v.phone, v.name FROM bookings b JOIN visitors v ON b.visitor_id=v.id WHERE b.id=$1", [bookingId]);
    if (!r.rows.length) return res.status(404).json({ error: "booking not found" });
    const booking = r.rows[0];
    const newIso = new Date(`${newDate}T${newTime}:00Z`).toISOString();
    await pool.query("UPDATE bookings SET timeslot=$1, status='rescheduled', updated_at=NOW() WHERE id=$2", [newIso, bookingId]);

    // notify
    await sendBookingEmail({
      to: booking.email,
      visitorName: booking.name,
      doctorName: booking.doctor_name || booking.doctor_id,
      date: newDate,
      time: newTime,
      bookingId
    });
    await sendSms({ phone: booking.phone, message: `Appointment ${bookingId} rescheduled to ${newDate} ${newTime}` });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;