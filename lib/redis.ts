import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (process.env.DISABLE_REDIS === 'true') {
    return null;
  }

  if (!redisClient && process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 3) return null; // stop retrying quickly
          return Math.min(times * 100, 1000);
        },
      });

      redisClient.on('error', (err) => {
        console.warn('Redis connection warning (running with in-memory fallback):', err.message);
      });
    } catch (e) {
      console.warn('Failed to initialize Redis, falling back to in-memory cache.');
      redisClient = null;
    }
  }

  return redisClient;
}

// In-memory fallback cache
const memoryCache = new Map<string, { data: string; expiry: number }>();

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const val = await redis.get(key);
      if (val) return JSON.parse(val) as T;
    } catch {
      // ignore and check memory
    }
  }

  const mem = memoryCache.get(key);
  if (mem && mem.expiry > Date.now()) {
    try {
      return JSON.parse(mem.data) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export async function setCachedJson(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
  const jsonStr = JSON.stringify(data);
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, jsonStr);
    } catch {
      // ignore
    }
  }

  memoryCache.set(key, {
    data: jsonStr,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}
