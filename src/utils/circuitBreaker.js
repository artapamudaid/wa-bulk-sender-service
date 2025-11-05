import CircuitBreaker from "opossum";
import axios from "axios";
import logger from "./logger.js";

const breakerOptions = { timeout: 5000, errorThresholdPercentage: 50, resetTimeout: 10000 };
const sendFn = async ({ apikey, sender, receiver, message }) => {
  const res = await axios.get(process.env.PRIMARY_API, { params: { api_key: apikey, sender, number: receiver, message } });
  return res.data;
};
const breaker = new CircuitBreaker(sendFn, breakerOptions);
breaker.on("open", () => logger.warn("⚠️ Circuit open — pausing sends"));
breaker.on("halfOpen", () => logger.info("🔁 Circuit half-open — retrying"));
breaker.on("close", () => logger.info("✅ Circuit closed — resuming"));
export const sendMessageWithBreaker = async (data) => {
  try {
    return await breaker.fire(data);
  } catch (err) {
    logger.error(`Send failed for ${data.receiver}: ${err.message}`);
    throw err;
  }
};