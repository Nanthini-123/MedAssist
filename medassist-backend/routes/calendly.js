import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/book", async (req, res) => {
  try {
    const { name, email, phone, age, event_type, start_time } = req.body;

    const response = await axios.post(
      "https://api.calendly.com/scheduled_events",
      {
        event_type,
        invitee: {
          name,
          email,
          phone,
          custom_answers: [
            { question: "Age", answer: age }
          ],
          start_time,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Calendly booking error:", error.response?.data || error);
    res.status(500).json({ success: false });
  }
});

export default router;