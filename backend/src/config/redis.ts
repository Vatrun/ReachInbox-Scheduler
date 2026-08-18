import IORedis from "ioredis";
import { env } from "./env";

export const redisConnection = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null, // required by BullMQ
});

redisConnection.on("connect", () => {
  console.log("Connected to Redis");
});

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err);
});