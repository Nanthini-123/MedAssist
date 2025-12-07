// utils/salesiq.js
import fetch from "node-fetch";

export async function sendStatusMessage(phone, name, status) {
  let message = "";

  if (status === "PRESENT") {
    message = `Thank you ${name}! We are happy to serve you today. Wishing you good health ❤️`;
  }

  if (status === "ABSENT") {
    message = `Hi ${name}, we noticed you missed your appointment today. If you want, you can reschedule anytime.`;
  }

  if (status === "CANCELLED") {
    message = `Hi ${name}, your appointment has been cancelled successfully. Let us know if you'd like to book again.`;
  }

  if (!message) return;

  await fetch("https://salesiq.zoho.in/api/sendmessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      message,
    }),
  });
}