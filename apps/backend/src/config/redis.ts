import { createClient } from "redis";
import type { IRedisClient } from "./redis.types.js";
import { env } from "./env.js";
import { createRedisMock } from "./redis-mock.js";

// ─── Configuración de Redis (Upstash) ──────────────────────────────────
// Este archivo inicializa la conexión a Redis en Upstash con TLS.
// Si Redis no está disponible, hace fallback a un mock en memoria
// para que el servidor pueda funcionar en desarrollo sin Redis.

let redisClient: IRedisClient | null = null;

/**
 * Inicializa la conexión a Redis usando la URL del entorno
 * Configura TLS para Upstash y hace fallback a mock si falla la conexión
 * @throws No lanza error, usa mock en memoria si Redis no está disponible
 */
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

    // Casting al tipo común IRedisClient para abstracción
    redisClient = client as unknown as IRedisClient;
    console.log("✓ Redis conectado a Upstash");
  } catch (error) {
    console.warn(
      `⚠️ Redis no disponible (${(error as Error).message}) - usando Mock en memoria`,
    );
    // Fallback a mock de Redis en memoria para desarrollo
    redisClient = createRedisMock();
  }
}

/**
 * Obtiene el cliente de Redis inicializado
 * @returns Cliente de Redis o null si no se ha inicializado
 */
export function getRedis(): IRedisClient | null {
  return redisClient;
}
