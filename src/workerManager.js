import { Worker } from "bullmq";
import { pool, getPendingCountForSender } from "./db.js";
import axios from "axios";
import CircuitBreaker from "opossum";
import { redisConnection } from "./redis.js";
import logger from "./utils/logger.js";

const activeWorkers = new Map();

/**
 * Circuit breaker setup
 */
const breakerOptions = {
  timeout: 5000, // 5 detik timeout
  errorThresholdPercentage: 50, // buka circuit jika 50% request gagal
  resetTimeout: 10000, // tunggu 10 detik sebelum mencoba lagi
};

// Fungsi utama untuk mengirim WA
const sendFn = async ({ apikey, sender, receiver, message }) => {
  const res = await axios.get(process.env.PRIMARY_API, {
    params: {
      api_key: apikey,
      sender,
      number: receiver,
      message,
    },
  });
  return res.data;
};

// Bungkus dengan CircuitBreaker
const breaker = new CircuitBreaker(sendFn, breakerOptions);

breaker.on("open", () => logger.warn("⚠️ Circuit open — pausing sends"));
breaker.on("halfOpen", () => logger.info("🔁 Circuit half-open — retrying"));
breaker.on("close", () => logger.info("✅ Circuit closed — resuming"));

/**
 * Fungsi untuk mulai worker per-sender
 */
export function startWorker(sender) {
  if (activeWorkers.has(sender)) return;

  const worker = new Worker(
    sender,
    async (job) => {
      const { id, receiver, apikey, message } = job.data;

      try {
        logger.info(`📤 [${sender}] Sending to ${receiver} ...`);

        // kirim pesan via API
        const result = await breaker.fire({ apikey, sender, receiver, message });

        // update status ke sent
        await pool.query(
          `UPDATE wa_queue SET status = 'sent', updated_at = NOW() WHERE id = $1`,
          [id]
        );

        logger.info(`✅ [${sender}] Sent to ${receiver}`);

        // cek sisa pesan pending
        const pendingCount = await getPendingCountForSender(sender);
        logger.info(`📊 [${sender}] Remaining pending: ${pendingCount}`);

        return result;
      } catch (err) {
        logger.error(`💥 [${sender}] Send failed for ${receiver}: ${err.message}`);

        // update status ke failed
        await pool.query(
          `UPDATE wa_queue SET status = 'failed' WHERE id = $1`,
          [id, err.message]
        );

        throw err;
      }
    },
    {  
      connection: redisConnection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`🎉 [${sender}] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`💥 [${sender}] Job ${job.id} failed: ${err.message}`);
  });

  activeWorkers.set(sender, worker);
}

/**
 * Ambil daftar worker aktif
 */
export function getActiveWorkers() {
  return Array.from(activeWorkers.keys());
}
