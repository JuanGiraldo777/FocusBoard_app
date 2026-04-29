import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// ─── Schemas de validación ──────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(8, "Password debe tener mínimo 8 caracteres"),
  fullName: z.string().min(1, "Nombre no puede estar vacío").trim(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(1, "Password requerido"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

// ─── Middleware de validación ──────────────────────────────
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    req.body = registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validación fallida",
        details: error.flatten().fieldErrors,
      });
    } else {
      next(error);
    }
  }
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    req.body = loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validación fallida",
        details: error.flatten().fieldErrors,
      });
    } else {
      next(error);
    }
  }
};
