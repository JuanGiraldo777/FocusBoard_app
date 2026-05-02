import type { Request, Response, NextFunction } from "express";
import { pomodoroSessionService } from "../services/pomodoro-sessions.service.ts";
import { createSessionSchema } from "../validators/session.validator.ts";

export const pomodoroSessionController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validated = createSessionSchema.parse(req.body);

      if (!req.user) {
        const error = new Error("User not authenticated") as any;
        error.statusCode = 401;
        return next(error);
      }

      await pomodoroSessionService.createSession(req.user.id, validated);

      res.status(201).json({
        message: "Pomodoro session saved successfully"
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
          error: "Validation failed",
          details: (error as any).errors
        });
        return;
      }
      next(error);
    }
  },

  getTodayCount: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        const error = new Error("User not authenticated") as any;
        error.statusCode = 401;
        return next(error);
      }

      const count = await pomodoroSessionService.getTodaySessionCount(req.user.id);

      res.status(200).json({
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  }
};
