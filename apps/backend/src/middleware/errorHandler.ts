import type { Request, Response, NextFunction } from "express";

// Extender tipos de Error
interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  error: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Error interno del servidor";

  console.error(`[${statusCode}] ${message}`);

  res.status(statusCode).json({
    error: message,
  });
};
