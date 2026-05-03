import { createClient } from "redis";
import { createRedisMock } from "./redis-mock.ts";
import type { IRedisClient } from "./redis.types.ts";
import { env } from "./env.ts";

let redisClient: IRedisClient | null = null;

export async function initRedis(): Promise<void> {
  try {
    const client = createClient({ url: env.REDIS_URL });
    await client.connect();
    // Casting al tipo común IRedisClient
    redisClient = client as unknown as IRedisClient;
    console.log("✓ Redis conectado");
  } catch (error) {
    console.warn(
      "⚠️  Redis no disponible - usando Redis Mock en memoria",
      (error as Error).message,
    );
    // Usar Redis Mock como fallback (ya implementa IRedisClient)
    redisClient = createRedisMock() as unknown as IRedisClient;
  }
}

export function getRedis(): IRedisClient | null {
  return redisClient;
}
