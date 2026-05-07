import type { Request, Response, NextFunction } from "express";

// Extender tipos de Error para soportar statusCode personalizado
interface CustomError extends Error {
  statusCode?: number;
}

/**
 * Middleware central de manejo de errores de Express
 * Captura todos los errores que se pasan con next(error) y devuelve
 * una respuesta JSON estandarizada. Si no hay statusCode, usa 500.
 * @param error - Error capturado con posible statusCode personalizado
 * @param _req - Request de Express (no se usa, prefijo _ para evitar warning)
 * @param res - Response de Express para enviar el error
 * @param next - NextFunction de Express (no se usa en el handler final)
 */
export const errorHandler = (
  error: CustomError,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  void next;

  const statusCode = error.statusCode || 500;
  const message = error.message || "Error interno del servidor";

  console.error(`[${statusCode}] ${message}`);

  res.status(statusCode).json({
    error: message,
  });
};
