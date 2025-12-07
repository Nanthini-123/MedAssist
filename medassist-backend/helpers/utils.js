export function makeIcs({ startIso, endIso, title='Appointment', description='MedAssist appointment', location='Online' }) {
  // very simple ICS string
  const start = startIso.replace(/[-:]/g,"").split(".")[0] + "Z";
  const end = endIso.replace(/[-:]/g,"").split(".")[0] + "Z";
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MedAssist//EN
BEGIN:VEVENT
UID:${Date.now()}@medassist.ai
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
}