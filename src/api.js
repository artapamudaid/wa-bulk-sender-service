import express from "express";
import { pool } from "./db.js";
import { getQueue } from "./queue.js";
import logger from "./utils/logger.js";

const router = express.Router();

/** Middleware sederhana untuk static token */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || token !== process.env.STATIC_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};

/** Tambahkan ke queue WA */
router.post("/queue", authMiddleware, async (req, res) => {
  try {
    const { apikey, sender, receiver, message } = req.body;

    // Validasi input
    if (!apikey || !sender || !receiver || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Simpan ke database
    const insertQuery = `
      INSERT INTO wa_queue (apikey, sender, receiver, message, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [apikey, sender, receiver, message]);
    const jobData = result.rows[0];

    // Masukkan ke queue BullMQ
    const queue = getQueue(sender);
    await queue.add("send", jobData, {
      attempts: 3,          // retry otomatis
      backoff: 5000,        // delay antar retry
      removeOnComplete: true,
      removeOnFail: false
    });

    logger.info(`📩 Job added for sender ${sender} to receiver ${receiver}`);
    res.json({ success: true, data: jobData });
  } catch (err) {
    logger.error("❌ Error in /queue:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
