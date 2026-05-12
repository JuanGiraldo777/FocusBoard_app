import type { NextFunction, Request, Response } from "express";
import { createAppError } from "../types/errors.js";
import { userSettingsService } from "../services/user-settings.service.js";

export const userSettingsController = {
  getSettings: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        return next(createAppError("Usuario no autenticado", 401));
      }

      const settings = await userSettingsService.getSettings(req.user.id);

      res.status(200).json({
        message: "Configuración del usuario",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },
};