import type { Request, Response, NextFunction } from "express";
import { getRedis } from "../config/redis.ts";
import { createAppError } from "../types/errors.ts";

export const rateLimitLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const redis = getRedis();
    if (!redis) {
      return next(createAppError("Redis no disponible", 503));
    }

    const ip = req.ip || "unknown";
    const key = `login_attempts:${ip}`;
    const limit = 10;
    const windowSeconds = 15 * 60; // 15 minutos

    // Incrementar contador
    const attempts = await redis.incr(key);

    // Configurar expiración en el primer intento
    if (attempts === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Rechazar si se excede el límite
    if (attempts > limit) {
      return next(
        createAppError("Demasiados intentos. Intenta en 15 minutos", 429),
      );
    }

    next();
  } catch {
    return next(createAppError("Redis no disponible", 503));
  }
};
