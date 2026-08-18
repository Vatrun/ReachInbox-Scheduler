import { redisConnection } from "../config/redis";
import { env } from "../config/env";

const ONE_HOUR_MS = 60 * 60 * 1000;

// sliding window per sender, keyed by send timestamps in a redis sorted set
export async function canSendNow(senderId: number): Promise<boolean> {
  const key = `rate-limit:sender:${senderId}`;
  const now = Date.now();
  const windowStart = now - ONE_HOUR_MS;

  await redisConnection.zremrangebyscore(key, 0, windowStart);

  const count = await redisConnection.zcard(key);

  return count < env.maxEmailsPerHour;
}

export async function recordSend(senderId: number): Promise<void> {
  const key = `rate-limit:sender:${senderId}`;
  const now = Date.now();

  // random suffix so two sends in the same millisecond don't clash
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

  await redisConnection.zadd(key, now, member);
  await redisConnection.expire(key, 60 * 60); // drop the key after an idle hour
}

// ms until the oldest entry rolls out of the window
export async function msUntilCapacityFrees(senderId: number): Promise<number> {
  const key = `rate-limit:sender:${senderId}`;
  const oldest = await redisConnection.zrange(key, "0", "0", "WITHSCORES");

  if (oldest.length < 2) return 0;

  const oldestTimestamp = parseInt(oldest[1], 10);
  const freesAt = oldestTimestamp + ONE_HOUR_MS;
  return Math.max(0, freesAt - Date.now());
}