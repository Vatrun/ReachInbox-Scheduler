import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const EMAIL_QUEUE_NAME = "email-sending";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600 * 24,
    },
    removeOnFail: false,
  },
});