import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

const CALENDLY_BASE = "https://api.calendly.com";

router.get("/", async (req, res) => {
  const { doctorId, date } = req.query;
  // If Calendly configured, query available timeslots for user (doctor)
  if (process.env.CALENDLY_TOKEN && doctorId) {
    try {
      const userUri = process.env.CALENDLY_USER_URI || `https://api.calendly.com/users/${doctorId}`;
      // simple approach: fetch scheduled events for day and return free slots placeholder
      // For demo we return sample times if Calendly is not fully wired
      // Proper: use Calendly availability endpoints /scheduled_events /event_types /availability
      const sample = [
        { slotId: `${date}T09:00:00Z`, startTime: `${date}T09:00:00Z`, endTime: `${date}T09:30:00Z` },
        { slotId: `${date}T10:00:00Z`, startTime: `${date}T10:00:00Z`, endTime: `${date}T10:30:00Z` },
        { slotId: `${date}T11:00:00Z`, startTime: `${date}T11:00:00Z`, endTime: `${date}T11:30:00Z` }
      ];
      return res.json(sample);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    // fallback demo slots
    const sample = [
      { slotId: `${date}T09:00:00Z`, startTime: `${date}T09:00:00Z`, endTime: `${date}T09:30:00Z` },
      { slotId: `${date}T10:00:00Z`, startTime: `${date}T10:00:00Z`, endTime: `${date}T10:30:00Z` }
    ];
    return res.json(sample);
  }
});

export default router;