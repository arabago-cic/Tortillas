import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cron from "node-cron";
import { initWebPush } from "./services/push";
import { sendDailyNotification } from "./services/email";

import authRoutes from "./routes/auth";
import membersRoutes from "./routes/members";
import scheduleRoutes from "./routes/schedule";
import notificationsRoutes from "./routes/notifications";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize web push
initWebPush();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/notifications", notificationsRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Daily email notification: weekdays at 8:00 AM
cron.schedule("0 8 * * 1-5", () => {
  console.log("[Cron] Ejecutando notificación diaria de tortillas...");
  void sendDailyNotification();
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Tortilla Calendar server running on port ${PORT}`);
  console.log("Cron programado: emails a las 8:00 AM de lunes a viernes");
});

export default app;
