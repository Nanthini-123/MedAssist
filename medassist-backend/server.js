// =========================
//       BASIC SETUP
// =========================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js"; // make sure the path is correct
dotenv.config();

import cron from "node-cron";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));


// =========================
//        ROUTES
// =========================
import otpRoutes from "./routes/otp.js";
import analyzeRoutes from "./routes/analyze.js";
import availabilityRoutes from "./routes/availability.js";
import bookingRoutes from "./routes/booking.js";
import visitorRoutes from "./routes/visitor.js";
import slotsRouter from "./routes/slots.js";
import otpRouter from "./routes/otp.js";
import calendlyRouter from "./routes/calendly.js";

import operatorRoutes from "./routes/operator.js";
import operatorLeadsRoutes from "./routes/operator_leads.js";
import templatesRoutes from "./routes/templates.js";

import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import clinicRoutes from "./routes/clinic.js";

import attendanceRoutes from "./routes/attendance.js";
import bookingsTodayRoutes from "./routes/bookings_today.js";

import statusRoutes from "./routes/status.js";
import botRoutes from "./routes/bot.js";
import testRoutes from "./routes/test.js";
import aiRoutes from "./routes/ai.js"; // make sure path is correct



// =========================
//      WORKERS IMPORTS
// =========================
import { runReminderWorker } from "./workers/reminderworker.js";
import { runMissedWorker } from "./workers/missedWorker.js";
import { runFollowupWorker } from "./workers/followupWorker.js";
import { runDailySummary } from "./workers/dailySummary.js";
import { runMonthlyReport } from "./workers/monthlyReport.js";

import { runNoShowFollowup } from "./cron/noShowFollowup.js";
import { autoCancelNoShow } from "./cron/autocancel.js";
import { sendDailySummary } from "./cron/dailySummary.js";



// =========================
//      MOUNT ROUTES
// =========================
app.use("/api/otp", otpRoutes);
app.use("/api/ai", analyzeRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/slots", slotsRouter);
app.use("/api/otp", otpRouter);
app.use("/api/calendly", calendlyRouter);


app.use("/api/operator", operatorRoutes);
app.use("/api/operator/leads", operatorLeadsRoutes);
app.use("/api/operator/templates", templatesRoutes);

app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clinic", clinicRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/api/bookings-today", bookingsTodayRoutes);

app.use("/status", statusRoutes);
app.use("/api/bot", botRoutes);
app.use("/api/test", testRoutes);
app.use("/api/ai", aiRoutes);
app.get("/", (req, res) => res.send("MedAssist backend running"));


// =========================
//     START WORKERS
// =========================


// Run lightweight workers every minute
setInterval(() => { runReminderWorker().catch(console.error); }, 60000);
setInterval(() => { runMissedWorker().catch(console.error); }, 60000);
setInterval(() => { runFollowupWorker().catch(console.error); }, 60000);

// No-show followups every 10 minutes
cron.schedule("*/10 * * * *", () => {
  runNoShowFollowup().catch(console.error);
});

// Auto-cancel at midnight
cron.schedule("0 0 * * *", () => {
  autoCancelNoShow().catch(console.error);
});

// Daily summary at 7AM
cron.schedule("0 7 * * *", () => {
  sendDailySummary().catch(console.error);
});

// Monthly report on 1st at 7AM
cron.schedule("0 7 1 * *", () => {
  runMonthlyReport().catch(console.error);
});

// =========================
//      TEST DATABASE ROUTE
// =========================
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error("DB CONNECTION ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================
//      START SERVER
// =========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🔥 MedAssist backend running on PORT ${PORT}`)
);