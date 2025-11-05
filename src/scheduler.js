import { getActiveSenders } from "./db.js";
import { startWorker, getActiveWorkers } from "./workerManager.js";
import logger from "./utils/logger.js";

export const startScheduler = async () => {
  logger.info("⏳ Scheduler started for auto-spawn workers");

  setInterval(async () => {
    try {
      const senders = await getActiveSenders();
      const active = getActiveWorkers();

      for (const sender of senders) {
        if (!active.includes(sender)) {
          startWorker(sender);
        }
      }
    } catch (err) {
      logger.error("💥 Scheduler error:", err);
    }
  }, process.env.CHECK_INTERVAL_SECONDS * 1000);
};
