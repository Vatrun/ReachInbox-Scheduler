import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  databaseUrl: requireEnv("DATABASE_URL"),

  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: parseInt(process.env.REDIS_PORT || "6379", 10),

  minDelayBetweenEmailsMs: parseInt(
    process.env.MIN_DELAY_BETWEEN_EMAILS_MS || "2000",
    10
  ),
  maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || "100", 10),
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
};