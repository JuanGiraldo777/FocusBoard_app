import type { Request, Response, NextFunction } from "express";
import { cronService } from "../services/cron.service.ts";

/**
 * Maneja el endpoint de limpieza de salas inactivas
 * Ejecuta el cron job y devuelve el número de salas eliminadas
 * @param _req - Request (no se usa, prefijo _ para evitar warning)
 * @param res - Response con el número de salas eliminadas
 * @param next - Pasa errores al errorHandler
 */
export const cleanupInactiveRooms = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const deleted = await cronService.cleanupInactiveRooms();

    res.status(200).json({ deleted });
  } catch (error) {
    next(error);
  }
};
