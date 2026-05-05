import { createClient } from "redis";
import type { IRedisClient } from "./redis.types.ts";
import { env } from "./env.ts";
import { createRedisMock } from "./redis-mock.ts";

let redisClient: IRedisClient | null = null;

export async function initRedis(): Promise<void> {
  try {
    const client = createClient({
      url: env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    // Casting al tipo común IRedisClient
    redisClient = client as unknown as IRedisClient;
    console.log("✓ Redis conectado a Upstash");
  } catch (error) {
    console.warn(
      `⚠️ Redis no disponible (${(error as Error).message}) - usando Mock en memoria`,
    );
    // Fallback a mock de Redis en memoria
    redisClient = createRedisMock();
  }
}

export function getRedis(): IRedisClient | null {
  return redisClient;
}
