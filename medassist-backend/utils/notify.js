// utils/notify.js
import fetch from "node-fetch";
import { sendSms } from "./sms.js"; // your existing SMS util

/** --------------------------------------------------
 *  BASE FUNCTION: Used by everything else
 * --------------------------------------------------*/
export async function sendStatusMessage(phone, nameOrStatus, statusIfAny) {
  // Flexible signature:
  // sendStatusMessage(phone, status)
  // sendStatusMessage(phone, name, status)
  let name = null, status = null;

  if (statusIfAny !== undefined) {
    name = nameOrStatus;
    status = statusIfAny;
  } else {
    status = nameOrStatus;
  }

  status = String(status).toUpperCase();

  let message = "";

  if (status === "PRESENT") {
    message = `Thank you${name ? " " + name : ""} for visiting us today. Wishing you good health!`;
  } 
  else if (status === "ABSENT") {
    message = `You missed your appointment today. If you'd like to reschedule, reply YES or contact reception.`;
  } 
  else if (status === "CANCELLED") {
    message = `Your appointment has been cancelled. If you want to rebook, reply BOOK or contact reception.`;
  } 
  else if (status === "RESCHEDULED") {
    message = `Your appointment has been rescheduled. Please check your updated booking details.`;
  } 
  else {
    message = `Update: ${status}`;
  }

  // Try SalesIQ webhook first
  if (process.env.SALESIQ_WEBHOOK_URL) {
    try {
      await fetch(process.env.SALESIQ_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });

      return;
    } catch (err) {
      console.warn("SalesIQ webhook failed, falling back to SMS:", err.message);
    }
  }

  // Fallback to SMS
  await sendSms({ phone: phone.replace(/^\+/, ""), message });
}

/** --------------------------------------------------
 *  REQUIRED EXPORTS (BACKEND EXPECTS THESE)
 * --------------------------------------------------*/

export async function sendAttendanceNotification(phone, name, status) {
  return sendStatusMessage(phone, name, status);
}

export async function sendBookingNotification(phone, bookingData) {
  const msg = `Your appointment is confirmed.\nDoctor: ${bookingData.doctor}\nTime: ${bookingData.time}\nClinic: ${bookingData.clinic}`;
  return sendSms({ phone, message: msg });
}

export async function sendCancellationNotification(phone, bookingId) {
  const msg = `Your appointment (ID: ${bookingId}) has been cancelled.`;
  return sendSms({ phone, message: msg });
}

export async function sendRescheduleNotification(phone, newData) {
  const msg = `Your appointment has been rescheduled.\nNew time: ${newData.time}`;
  return sendSms({ phone, message: msg });
}