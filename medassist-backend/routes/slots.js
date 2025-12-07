import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const doctorURL = req.query.url;  // get the Calendly link sent by bot

    if (!doctorURL) {
      return res.status(400).json({ error: "Doctor URL missing" });
    }

    // Example: https://calendly.com/derma/consult-30min
    const parts = doctorURL.split("/");
    const eventSlug = parts[parts.length - 1];  

    // Get event type UUID
    const eventTypeRes = await axios.get(
      `https://api.calendly.com/event_types?slug=${eventSlug}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`
        }
      }
    );

    const eventTypeUUID = eventTypeRes.data.collection[0].uri.split("/").pop();

    // Fetch available slots
    const slotsRes = await axios.get(
      `https://api.calendly.com/event_type_available_times?event_type_uuid=${eventTypeUUID}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`
        }
      }
    );

    res.json(slotsRes.data);

  } catch (error) {
    console.error("❌ Error fetching slots:", error.response?.data || error);
    res.status(500).json({ error: "Slots fetch failed" });
  }
});

export default router;