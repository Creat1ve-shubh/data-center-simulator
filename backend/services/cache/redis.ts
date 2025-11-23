import type { Redis } from "ioredis";

let client: Redis | null = null;

/**
 * Lazy initialize Redis client. Returns null if REDIS_URL not set or library missing.
 */
export async function getRedis(): Promise<Redis | null> {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const { default: IORedis } = await import("ioredis");
    client = new IORedis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    // Ensure connection attempt but swallow errors
    try {
      await client.connect();
    } catch (e) {
      console.warn("[Cache] Redis connect warning:", (e as any).message);
    }
    return client;
  } catch (e: any) {
    console.warn("[Cache] ioredis not installed or failed to load:", e.message);
    return null;
  }
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const r = await getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e: any) {
    console.warn("[Cache] get failed:", e.message);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds = 21600 /* 6h */
) {
  const r = await getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (e: any) {
    console.warn("[Cache] set failed:", e.message);
  }
}
