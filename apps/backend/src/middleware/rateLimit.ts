import type { Request, Response, NextFunction } from "express";
import { getRedis } from "../config/redis.ts";
import { createAppError } from "../types/errors.ts";

// Store in-memory local (fallback si Redis Mock falla)
const memoryStore: Record<string, { count: number; resetTime: number }> = {};

export const rateLimitLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const redis = getRedis();
    if (!redis) {
      // Sin Redis ni Mock
      next();
      return;
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
    // Si Redis falla, usar memoria local
    const ip = req.ip || "unknown";
    const now = Date.now();
    const key = `login_attempts:${ip}`;

    if (!memoryStore[key]) {
      memoryStore[key] = { count: 0, resetTime: now + 15 * 60 * 1000 };
    }

    if (now > memoryStore[key].resetTime) {
      memoryStore[key] = { count: 0, resetTime: now + 15 * 60 * 1000 };
    }

    memoryStore[key].count++;

    if (memoryStore[key].count > 10) {
      return next(
        createAppError("Demasiados intentos. Intenta en 15 minutos", 429),
      );
    }

    next();
  }
};
