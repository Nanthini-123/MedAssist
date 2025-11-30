// utils/sheet.js
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Bookings!A:Z"; // default

function sheetsClient(readonly = false) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: [readonly ? "https://www.googleapis.com/auth/spreadsheets.readonly" : "https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function getAllRows() {
  const sheets = sheetsClient(true);
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });
  return resp.data.values || [];
}

async function findRowIndexByPhone(phone) {
  const rows = await getAllRows();
  const normalized = String(phone).replace(/\D/g, "").replace(/^91/, ""); // compare by last 10 digits
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    const cellPhone = String(r[2] || "").replace(/\D/g, "").replace(/^91/, "");
    if (cellPhone === normalized) return i + 1; // 1-based sheet row
  }
  return -1;
}

/**
 * Update status & who updated it in sheet (STATUS -> col G, UPDATED_BY -> col H)
 * Adjust indices if your sheet columns differ.
 */
export async function updateStatusInSheet(phone, status, updatedBy = "SYSTEM") {
  const sheets = sheetsClient(false);
  const row = await findRowIndexByPhone(phone);
  if (row === -1) throw new Error("Phone not found in sheet");

  const statusCell = `Bookings!G${row}`; // STATUS column
  const updatedByCell = `Bookings!H${row}`; // UPDATED_BY column

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    resource: {
      valueInputOption: "RAW",
      data: [
        { range: statusCell, values: [[status]] },
        { range: updatedByCell, values: [[updatedBy]] },
      ],
    },
  });

  return { row };
}

/**
 * Append a booking row (rowData = array with columns matching sheet)
 */
export async function addToSheet(rowData) {
  const sheets = sheetsClient(false);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: "RAW",
    resource: { values: [rowData] },
  });
}

/**
 * Read rows (for worker)
 */
export async function readRowsForWatcher() {
  return await getAllRows();
}