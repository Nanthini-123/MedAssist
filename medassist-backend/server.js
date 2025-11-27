import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// ROUTES
import otpRoutes from "./routes/otp.js";
import analyzeRoutes from "./routes/analyze.js";
import availabilityRoutes from "./routes/availability.js";
import bookingRoutes from "./routes/booking.js";
import visitorRoutes from "./routes/visitor.js";
import operatorRoutes from "./routes/operator.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import operatorLeadsRoutes from "./routes/operator_leads.js";
import templatesRoutes from "./routes/templates.js";
import clinicRoutes from "./routes/clinic.js";
import { startReminderWorker } from "./workers/reminderworker.js";
import attendanceRoutes from "./routes/attendance.js";
import { runNoShowFollowup } from "./cron/noShowFollowup.js";
import cron from "node-cron";
import { runNoShowFollowup } from "./cron/followup.js";
import { autoCancelNoShow } from "./cron/autocancel.js";
import { sendDailySummary } from "./cron/dailySummary.js";
import bookingRoutes from "./routes/bookings.js";

startReminderWorker();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ROUTES MOUNTED
app.use("/api", otpRoutes);
app.use("/api/analyze-symptoms", analyzeRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/book", bookingRoutes);
app.use("/api/visitor-context", visitorRoutes);

app.use("/api/operator", operatorRoutes);           // operator main actions
app.use("/api/operator/leads", operatorLeadsRoutes); // operator create lead
app.use("/api/operator/templates", templatesRoutes); // operator message templates
app.use("/api/upload", uploadRoutes);  
app.use("/api/admin", adminRoutes);                  // dashboards
app.use("/api/app.use", clinicRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/bookings", bookingRoutes);
app.get("/", (req, res) => res.send("MedAssist backend running"));

startReminderWorker();

import { runReminderCheck } from "./workers/reminderworker.js";

setInterval(() => {
  runReminderCheck();
}, 60000); // every 60 seconds

import { runMissedCheck } from "./workers/missedWorker.js";

setInterval(() => {
  runMissedCheck();
}, 60000);

import { runMonthlyReport } from "./workers/monthlyReport.js";

setInterval(() => {
  const now = new Date();
  if (now.getDate() === 1 && now.getHours() === 9) {
    runMonthlyReport();
  }
}, 3600000); // check once per hour

import cron from "node-cron";
import { runFollowupWorker } from "./workers/followupWorker.js";

// run every day at 7PM
cron.schedule("0 19 * * *", () => {
  runFollowupWorker();
});

setInterval(() => {
  runNoShowFollowup();
}, 1000 * 60 * 10); // runs every 10 minutes

// every 10 minutes → send followups
cron.schedule("*/10 * * * *", () => {
  runNoShowFollowup();
});

// daily at midnight → auto-cancel
cron.schedule("0 0 * * *", () => {
  autoCancelNoShow();
});

// every morning 7 AM
cron.schedule("0 7 * * *", () => {
  sendDailySummary();
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));