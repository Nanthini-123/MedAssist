// worker/statusWatcher.js
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();
import { sendStatusMessage } from "../utils/notify.js";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Bookings!A:Z";

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

let lastRows = null;

export async function statusWatcher() {
  try {
    const sheets = getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });
    const rows = resp.data.values || [];

    if (!lastRows) { lastRows = rows; return; }

    const max = Math.max(lastRows.length, rows.length);
    for (let i = 1; i < max; i++) { // start at 1 to skip header if present
      const oldRow = lastRows[i] || [];
      const newRow = rows[i] || [];
      const oldStatus = (oldRow[6] || "").toString().trim().toUpperCase();
      const newStatus = (newRow[6] || "").toString().trim().toUpperCase();

      if (oldStatus !== newStatus && newStatus) {
        const phone = (newRow[2] || newRow[3] || "").toString().replace(/\D/g, "");
        const name = newRow[0] || "";
        if (phone) {
          try {
            await sendStatusMessage(phone, name, newStatus);
          } catch (e) {
            console.error("statusWatcher notify error:", e.message || e);
          }
        }
      }
    }

    lastRows = rows;
  } catch (err) {
    console.error("statusWatcher error:", err.message || err);
  }
}