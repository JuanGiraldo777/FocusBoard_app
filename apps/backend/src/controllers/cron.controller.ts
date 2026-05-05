import type { Request, Response, NextFunction } from "express";
import { cronService } from "../services/cron.service.ts";

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
