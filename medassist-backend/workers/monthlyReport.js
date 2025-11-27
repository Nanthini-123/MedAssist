import db from "../db.js";
import sendEmail from "../utils/sendEmail.js";

export async function runMonthlyReport() {
  try {
    const bookings = await db.manyOrNone(`
      SELECT * FROM bookings
      WHERE date_trunc('month', appointment_datetime) = date_trunc('month', CURRENT_DATE)
    `);

    const total = bookings.length;

    const bySpeciality = {};
    bookings.forEach(b => {
      if (!bySpeciality[b.speciality]) bySpeciality[b.speciality] = 0;
      bySpeciality[b.speciality]++;
    });

    let report = `Monthly Summary Report\n\nTotal Bookings: ${total}\n\nBreakdown:\n`;

    for (const sp in bySpeciality) {
      report += `${sp}: ${bySpeciality[sp]}\n`;
    }

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "MedAssist Monthly Summary",
      text: report
    });

    console.log("Monthly summary sent");
  } catch (error) {
    console.log("Monthly report error:", error.message);
  }
}