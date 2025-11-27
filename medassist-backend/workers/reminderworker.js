// backend/workers/reminderWorker.js
import cron from "node-cron";
import { pool } from "../db.js";
import { sendBookingEmail } from "../helpers/email.js";
import { sendSms, sendWhatsAppMessage } from "../helpers/sms.js"; // you have these helpers
import fetch from "node-fetch";

/**
 * Sends a reminder 1 hour before appointment time.
 *
 * Logic:
 * - Every minute: find bookings with status='booked' and timeslot between now + 59 min and now + 61 min
 * - For each booking, check notifications_log to ensure we haven't already sent type 'reminder_1hr'
 * - Send email + SMS + WhatsApp (if available) and log entries
 *
 * NOTE: Adjust the time window if your server timezone or DB timezone differs.
 */

// Helper to get bookings ~1 hour ahead
async function findBookingsOneHourAhead() {
  // Use TIMESTAMP WITH TIME ZONE in DB for correct time math
  const sql = `
    SELECT b.id AS booking_id, b.timeslot, b.service_type, b.doctor_id, b.thirdparty_booking_id, v.name as visitor_name, v.email as visitor_email, v.phone as visitor_phone
    FROM bookings b
    JOIN visitors v ON v.id = b.visitor_id
    WHERE b.status = 'booked'
      AND b.timeslot BETWEEN (NOW() + interval '59 minutes') AND (NOW() + interval '61 minutes')
  `;
  const res = await pool.query(sql);
  return res.rows;
}

async function alreadySent(bookingId, type) {
  const q = `SELECT 1 FROM notifications_log WHERE booking_id=$1 AND type=$2 LIMIT 1`;
  const r = await pool.query(q, [bookingId, type]);
  return r.rows.length > 0;
}

async function logNotification({ bookingId, type, to, channel, payload }) {
  await pool.query(
    `INSERT INTO notifications_log (booking_id, type, to_contact, channel, payload, created_at)
     VALUES ($1,$2,$3,$4,$5,NOW())`,
    [bookingId, type, to, channel, payload || {}]
  );
}

async function processReminderForBooking(booking) {
  const type = "reminder_1hr";
  const already = await alreadySent(booking.booking_id, type);
  if (already) {
    // already sent — skip
    return;
  }

  const toEmail = booking.visitor_email;
  const toPhone = booking.visitor_phone;

  // Compose message
  const dateStr = new Date(booking.timeslot).toLocaleString();
  const emailSubject = `Reminder: Appointment in 1 hour — ${booking.service_type}`;
  const emailHtml = `
    <p>Hi ${booking.visitor_name || "there"},</p>
    <p>This is a reminder that your appointment "<strong>${booking.service_type}</strong>" is scheduled at <strong>${dateStr}</strong> (in ~1 hour).</p>
    <p>If you need to reschedule, reply here or contact reception.</p>
    <p>Thanks,<br/>MedAssist Team</p>
  `;
  const smsText = `Reminder: Your appointment (${booking.service_type}) is at ${dateStr} — in ~1 hour. Reply to reschedule.`;

  try {
    // Send email (if email helper exists)
    if (toEmail && process.env.SENDGRID_API_KEY) {
      await sendBookingEmail({
        to: toEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailHtml.replace(/<\/?[^>]+(>|$)/g, "") // plain text fallback
      });
      await logNotification({ bookingId: booking.booking_id, type, to: toEmail, channel: "email", payload: { subject: emailSubject } });
    }

    // Send SMS (if helper exists)
    if (toPhone && process.env.MSG91_AUTH_KEY) {
      await sendSms({
        phone: toPhone,
        message: smsText
      });
      await logNotification({ bookingId: booking.booking_id, type, to: toPhone, channel: "sms", payload: { text: smsText } });
    }

    // Send WhatsApp (if helper exists and configured)
    if (toPhone && process.env.MSG91_AUTH_KEY && typeof sendWhatsAppMessage === "function") {
      try {
        await sendWhatsAppMessage({
          phone: toPhone,
          message: smsText
        });
        await logNotification({ bookingId: booking.booking_id, type, to: toPhone, channel: "whatsapp", payload: { text: smsText } });
      } catch (e) {
        // not fatal — log error server-side
        console.warn("WhatsApp send failed", e.message || e);
      }
    }
  } catch (err) {
    console.error("Reminder send error for booking", booking.booking_id, err);
  }
}

// Cron job: run every minute
export function startReminderWorker() {
  // Run immediately once, then schedule every minute
  const handler = async () => {
    try {
      const bookings = await findBookingsOneHourAhead();
      if (!bookings.length) return;
      for (const b of bookings) {
        await processReminderForBooking(b);
      }
    } catch (err) {
      console.error("Reminder worker error:", err);
    }
  };

  // run at startup
  handler().catch(console.error);

  // schedule every minute
  cron.schedule("* * * * *", () => {
    handler().catch(console.error);
  });

  console.log("Reminder worker started (runs every minute)");
}
// DOCTOR REMINDER (1 hr before)
const docMsg = `
Doctor Reminder:
You have an appointment with ${b.visitor_name}
Time: ${b.appointment_time}
Symptoms: ${b.symptoms}
Phone: ${b.visitor_phone}
`;
await sendSMS(process.env.DOCTOR_PHONE, docMsg);

await db.none(
  `INSERT INTO notifications_log (booking_id, type)
   VALUES ($1, 'DOCTOR_REMINDER')`,
  [b.id]
);