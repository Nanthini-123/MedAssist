import { google } from "googleapis";

export async function writeLeadToSheet(lead) {
  try {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          lead.name,
          lead.phone,
          lead.symptoms,
          lead.severity,
          lead.date,
          lead.status
        ]]
      }
    });

    return true;
  } catch (err) {
    console.log("SHEETS ERROR:", err);
    return false;
  }
}