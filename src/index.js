import express from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import compression from "compression";
import helmet from "helmet";
import { startScheduler } from "./scheduler.js";
import logger from "./utils/logger.js";
import apiRouter from "./api.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASS || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Security & basic middlewares
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global limiter (untuk semua route KECUALI /api/queue)
const globalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many requests — try again later.",
  },
});

// Queue limiter (lebih longgar & dimaksimalkan)
const queueLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 1000,
  max: 50,
  message: "Too many queue requests",
});

// CARA BENAR:
// 1️⃣ /api/queue → HANYA kena queueLimiter
app.use("/api/queue", queueLimiter);

// 2️⃣ Semua route API lainnya
app.use("/api", apiRouter);

// 3️⃣ Route Home
app.get("/", (req, res) => {
  res.send("✅ WA Bulk Sender is running!");
});

// 4️⃣ Admin dashboard
app.get("/admin/queues", (req, res) => {
  res.send("📊 BullBoard dashboard (belum diimplementasi)");
});

// 5️⃣ Global limiter → dipasang paling akhir
app.use(globalLimiter);

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
  logger.info(`📊 BullBoard dashboard: http://localhost:${PORT}/admin/queues`);
  await startScheduler();
});
