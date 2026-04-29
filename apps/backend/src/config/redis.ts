import { createClient } from "redis";
import { createRedisMock } from "./redis-mock.ts";
import { env } from "./env.ts";

type RedisClientType = ReturnType<typeof createClient> | ReturnType<typeof createRedisMock>;

let redisClient: RedisClientType | null = null;

export async function initRedis(): Promise<void> {
  try {
    const client = createClient({ url: env.REDIS_URL });
    await client.connect();
    redisClient = client;
    console.log("✓ Redis conectado");
  } catch (error) {
    console.warn(
      "⚠️  Redis no disponible - usando Redis Mock en memoria",
      (error as Error).message,
    );
    // Usar Redis Mock como fallback
    redisClient = createRedisMock();
  }
}

export function getRedis(): RedisClientType | null {
  return redisClient;
}
