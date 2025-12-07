// utils/ics.js
export function createICS({ summary = "Appointment", description = "", location = "", start, end, organizerEmail = "no-reply@medassist.ai" }) {
  const dtStart = new Date(start).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtEnd = new Date(end).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return (
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MedAssist//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@medassist.ai
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
ORGANIZER:MAILTO:${organizerEmail}
END:VEVENT
END:VCALENDAR`
  );
}