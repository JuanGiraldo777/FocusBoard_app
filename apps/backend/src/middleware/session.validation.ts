import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { createSessionSchema } from "../validators/session.validator.ts";


/**
 * Middleware que valida el body para crear sesión Pomodoro.
 * Usa Zod para validar taskLabel, duration y startedAt.
 * @param req - Request con body a validar
 * @param res - Response 400 si falla validación
 * @param next - Continúa si es válido
 */
export const validateCreateSession = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    req.body = createSessionSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      });
      return;
    }
    next(error);
  }
};
