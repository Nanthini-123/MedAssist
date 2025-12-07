export function bookingConfirmation(data) {
  return `Dear ${data.name}, your appointment for ${data.service} is confirmed.
Date: ${data.date}
Time: ${data.time}
Doctor: ${data.doctor}
Clinic: ${data.clinic}
Location: ${data.map}
To view or manage your appointment, use the chatbot.
For any assistance, call: ${data.reception}`;
}

export function appointmentRescheduled(data) {
  return `Hello ${data.name}, your appointment has been rescheduled.
New Date: ${data.date}
New Time: ${data.time}
Doctor: ${data.doctor}
Clinic: ${data.clinic}
Location: ${data.map}
You can view/reschedule/cancel via the chatbot.
If this change was not made by you, contact: ${data.reception}`;
}

export function appointmentCancelled(data) {
  return `Hello ${data.name}, your appointment for ${data.service} on ${data.date} at ${data.time} has been cancelled.
You can book a new appointment via the chatbot.`;
}

export function oneHourReminder(data) {
  return `Reminder: Dear ${data.name}, your appointment is in 1 hour.
Time: ${data.time}
Clinic: ${data.clinic}
Location: ${data.map}
Manage your appointment via the chatbot.`;
}

export function noShowFollowUp(data) {
  return `Hello ${data.name}, we noticed you missed your appointment.
You can reschedule easily via the chatbot.`;
}

export function reconfirmationMessage(data) {
  return `Dear ${data.name}, please confirm your appointment tomorrow at ${data.time}.
Reply YES or NO in the chatbot to confirm.`;
}

export function thankYouMessage(data) {
  return `Thank you ${data.name} for visiting ${data.clinic} today.
We hope you are well. You can provide feedback or book another appointment via the chatbot.`;
}