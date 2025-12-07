import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { services } from "./services.js";
import { sendSms } from "../utils/sms.js";
import {
  bookingConfirmation,
  appointmentRescheduled,
  appointmentCancelled,
  oneHourReminder,
  noShowFollowUp,
  reconfirmationMessage,
  thankYouMessage
} from "../helpers/smsTemplate.js";
dotenv.config();
const router = express.Router();

// GET services
router.get("/services", (req, res) => {
  res.json({ success: true, services });
});

// GET available slots for a service
router.get("/slots/:serviceId", async (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const service = services.find(s => s.id === serviceId);
    if (!service) return res.status(404).json({ error: "Service not found" });

    const response = await axios.get(
      `${service.calendlyEventType}/event_type_available_times`,
      {
        headers: { Authorization: `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}` }
      }
    );

    res.json({ success: true, slots: response.data.collection || [] });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

// BOOK appointment
router.post("/book", async (req, res) => {
  try {
    const { serviceId, slotUri, name, email, phone } = req.body;
    if (!serviceId || !slotUri || !name || !email || !phone)
      return res.status(400).json({ error: "All fields are required" });

    const service = services.find(s => s.id === Number(serviceId));

    // Send to Calendly (emails handled by Calendly)
    const payload = { invitee: { name, email, sms_number: phone }, event: slotUri };
    const calendlyRes = await axios.post(
      "https://api.calendly.com/scheduled_events",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const appointment = calendlyRes.data;
    const date = appointment.start_time.split("T")[0];
    const time = appointment.start_time.split("T")[1].substring(0, 5);

    // Send SMS confirmation
    await sendSms(phone, bookingConfirmation({
      name,
      service: service.name,
      date,
      time,
      doctor: service.doctor || "Assigned Doctor",
      clinic: "MedAssist Clinic",
      map: "https://maps.google.com/?q=Your+Clinic",
      reception: "+91-XXXXXXXXXX"
    }));

    res.json({ success: true, message: "Booked & SMS sent", appointment });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Booking failed" });
  }
});

// WEBHOOK: Calendly event updates → send SMS
router.post("/calendly-webhook", async (req, res) => {
  try {
    const event = req.body;
    const invitee = event.payload?.invitee;
    const phone = invitee?.sms_number;
    const name = invitee?.name;
    const status = event.payload?.status;

    if (!phone) return res.json({ success: true });

    const date = event.payload?.start_time?.split("T")[0] || "N/A";
    const time = event.payload?.start_time?.split("T")[1]?.substring(0, 5) || "N/A";

    switch (status) {
      case "rescheduled":
        await sendSms(phone, appointmentRescheduled({ name, date, time, doctor: "Assigned Doctor", clinic: "MedAssist Clinic", map: "https://maps.google.com/?q=Your+Clinic", reception: "+91-XXXXXXXXXX" }));
        break;
      case "canceled":
        await sendSms(phone, appointmentCancelled({ name, service: "Your Service", date, time }));
        break;
      case "no_show":
        await sendSms(phone, noShowFollowUp({ name }));
        break;
      case "completed":
        await sendSms(phone, thankYouMessage({ name, clinic: "MedAssist Clinic" }));
        break;
    }

    res.json({ success: true });
  } catch (e) {
    console.error("Webhook error:", e.message);
    res.json({ success: true });
  }
});

export default router;