import type { Request, Response, NextFunction } from "express";
import { cronCleanupHeadersSchema } from "../validators/cron.validator.ts";
import { env } from "../config/env.ts";

/**
 * Middleware que valida que la petición venga de un cron job autorizado
 * Verifica el header x-cron-secret contra el valor en env.CRON_SECRET
 * @param req - Request con header x-cron-secret
 * @param res - Response 401 si el secret no coincide
 * @param next - Continúa si la autenticación es exitosa
 */
export const validateCronSecret = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const xCronSecret = req.headers["x-cron-secret"];
  const normalizedSecret = Array.isArray(xCronSecret) ? xCronSecret[0] : xCronSecret;

  const parsed = cronCleanupHeadersSchema.safeParse({
    xCronSecret: normalizedSecret,
  });

  if (!parsed.success || parsed.data.xCronSecret !== env.CRON_SECRET) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  next();
};
