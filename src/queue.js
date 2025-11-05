// src/queue.js
import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

const queues = new Map();

export function getQueue(sender) {
  if (!queues.has(sender)) {
    queues.set(sender, new Queue(sender, { 
        connection: redisConnection,
        limiter: {
            max: 100,         
            duration: 60000,
        },
    }));
  }
  return queues.get(sender);
}
