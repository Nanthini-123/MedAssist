import { sendSms } from "../utils/sms.js";

// 1. Booking confirmation
export function sendBookingConfirmation(phone, data) {
  return sendSms(
    phone,
    `Dear ${data.name}, your appointment for ${data.service} is confirmed.\n` +
    `Date: ${data.date}\nTime: ${data.time}\n` +
    `Doctor: ${data.doctor}\nClinic: ${data.clinic}\n` +
    `Location: ${data.map}\nReception: ${data.reception}\n` +
    `Wishing you good health.`
  );
}

// 2. Reschedule confirmation
export function sendRescheduleSms(phone, data) {
  return sendSms(
    phone,
    `Hello ${data.name}, your appointment has been rescheduled.\n` +
    `New Date: ${data.date}\nNew Time: ${data.time}\n` +
    `Doctor: ${data.doctor}\nClinic: ${data.clinic}\n` +
    `Location: ${data.map}\n` +
    `If this was not you, contact reception.`
  );
}

// 3. Cancellation SMS
export function sendCancelSms(phone, data) {
  return sendSms(
    phone,
    `Hello ${data.name}, your appointment for ${data.service} on ${data.date} at ${data.time} has been cancelled.\n` +
    `To rebook, reply BOOK.\nIf this was not you, contact reception.`
  );
}

// 4. 1-hour reminder
export function sendReminderSms(phone, data) {
  return sendSms(
    phone,
    `Reminder: Dear ${data.name}, your appointment is in 1 hour.\n` +
    `Time: ${data.time}\nClinic: ${data.clinic}\n` +
    `Location: ${data.map}\n` +
    `Please arrive on time.`
  );
}

// 5. No-show follow-up
export function sendNoShowSms(phone, data) {
  return sendSms(
    phone,
    `Hello ${data.name}, we noticed you missed your appointment today.\n` +
    `Reply RESCHEDULE to book a new time, or call reception if you need assistance.`
  );
}

// 6. Re-confirmation (for next day morning)
export function sendReconfirmSms(phone, data) {
  return sendSms(
    phone,
    `Dear ${data.name}, kindly confirm your appointment at ${data.time} .\n` +
    `Reply YES to confirm or NO to cancel.`
  );
}

// 7. Thank you SMS
export function sendThankYouSms(phone, data) {
  return sendSms(
    phone,
    `Thank you ${data.name} for visiting ${data.clinic} today.\n` +
    `We wish you a speedy recovery.\n` +
    `For help, call reception.`
  );
}