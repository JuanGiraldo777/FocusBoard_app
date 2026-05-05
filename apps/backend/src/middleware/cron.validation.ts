import type { Request, Response, NextFunction } from "express";
import { cronCleanupHeadersSchema } from "../validators/cron.validator.ts";
import { env } from "../config/env.ts";

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