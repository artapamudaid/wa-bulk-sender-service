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
  password: process.env.REDIS_PASS || undefined, // <— optional
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on("connect", () => console.log("✅ Redis connected"));
redisClient.on("error", (err) => console.error("❌ Redis error:", err));

// 🛡️ Helmet — Security headers
app.use(helmet());

// ⚡ Compression — Gzip responses
app.use(compression());

// 📥 Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🚦 Rate Limiter pakai Redis
const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maks 100 request per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many requests — try again later.",
  },
});

app.use(limiter);

// 🧠 Routes

app.get("/", (req, res) => {
  res.send("✅ WA Bulk Sender is running!");
});
app.use("/api", apiRouter);
app.get("/admin/queues", (req, res) => {
  res.send("📊 BullBoard dashboard (belum diimplementasi)");
});

app.listen(PORT, async () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
  logger.info(`📊 BullBoard dashboard: http://localhost:${PORT}/admin/queues`);
  await startScheduler();
});
