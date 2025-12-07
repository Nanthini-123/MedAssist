import express from "express";
import axios from "axios";

const router = express.Router();

// This will store latest booking per phone
let latestBooking = {};  
// { "9876543210": {name, doctor, date, time} }

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    const phone = data.payload?.invitee?.text_reminder_number;
    const name = data.payload?.invitee?.name;
    const email = data.payload?.invitee?.email;
    const eventStart = data.payload?.event?.start_time;
    const eventName = data.payload?.event?.name;

    if (!phone) return res.status(200).send("No phone");

    latestBooking[phone] = {
      name,
      doctor: eventName,
      date: eventStart.split("T")[0],
      time: eventStart.split("T")[1].split("Z")[0]
    };

    // SEND SMS
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "v3",
        sender_id: "TXTIND",
        message: `Booking Confirmed!\nDoctor: ${eventName}\nDate: ${latestBooking[phone].date}\nTime: ${latestBooking[phone].time}`,
        language: "english",
        flash: 0,
        numbers: phone
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY
        }
      }
    );

    res.status(200).send("Webhook processed");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = req.body?.payload;

    const appointmentID = payload?.invitee?.uuid;
    const cancelUrl = payload?.invitee?.cancel_url;
    const rescheduleUrl = payload?.invitee?.reschedule_url;

    console.log("NEW CALENDLY BOOKING:");
    console.log({ appointmentID, cancelUrl, rescheduleUrl });

    // Save to DB (MongoDB, Firebase, MySQL — whatever you use)
    // Example:
    // await Appointment.create({ appointmentID, cancelUrl, rescheduleUrl });

    res.status(200).send("OK");
  } catch (e) {
    console.error(e);
    res.status(500).send("Webhook error");
  }
});
export default router;