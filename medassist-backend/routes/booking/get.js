
import express from "express";
const router = express.Router();
router.post("/get", (req, res) => {
  const phone = req.body.phone;
  const booking = latestBooking[phone];

  if (!booking) return res.json({ status: "no_booking" });

  res.json({
    status: "success",
    ...booking
  });
});
// GET appointments by phone number
router.get("/get-appointments", async (req, res) => {
  try {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ error: "Phone missing" });

    const response = await axios.get(
      `https://api.calendly.com/scheduled_events?invitee_email=${phone}@example.com`,
      { headers: { Authorization: `Bearer ${process.env.CALENDLY_API_KEY}` } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error);
    res.status(500).json({ error: "Fetch failed" });
  }
});

router.post("/cancel", async (req, res) => {
  try {
    const eventUri = req.body.event_uri;

    const response = await axios.post(
      `https://api.calendly.com/scheduled_events/${eventUri}/cancellation`,
      { reason: "Cancelled by patient" },
      { headers: { Authorization: `Bearer ${process.env.CALENDLY_API_KEY}` } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Cancel failed" });
  }
});
export default router;