import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// ─── Schemas de validación ──────────────────────────────────────────────
// Define los esquemas para registro y login usando Zod.
// toLowerCase() en email para normalizar antes de guardar en BD.
// min(8) en password para cumplir con requisitos mínimos de seguridad.

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

// ─── Middleware de validación ──────────────────────────────────────────
// Estos middlewares validan el body de la request usando los schemas de Zod.
// Si la validación falla, devuelve 400 con los detalles del error.
// Si es otro tipo de error, lo pasa al siguiente middleware con next().

/**
 * Valida el body de registro contra registerSchema
 * @param req - Request con body que debe cumplir RegisterRequest
 * @param res - Response para devolver errores 400 si falla validación
 * @param next - Continúa al siguiente middleware si la validación es exitosa
 * @throws Error de Zod si el body no cumple el esquema (capturado en try/catch)
 */
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

/**
 * Valida el body de login contra loginSchema
 * @param req - Request con body que debe cumplir LoginRequest
 * @param res - Response para devolver errores 400 si falla validación
 * @param next - Continúa al siguiente middleware si la validación es exitosa
 * @throws Error de Zod si el body no cumple el esquema (capturado en try/catch)
 */
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
