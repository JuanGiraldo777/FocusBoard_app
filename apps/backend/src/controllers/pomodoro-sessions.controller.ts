import type { Request, Response, NextFunction } from "express";
import { pomodoroSessionService } from "../services/pomodoro-sessions.service.ts";
import { createSessionSchema } from "../validators/session.validator.ts";
import { getRedis } from "../config/redis.ts";

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
  },

  getTodaySessions: async (
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

      const sessions = await pomodoroSessionService.getTodaySessions(req.user.id);

      res.status(200).json({
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  },

  getWeekSessions: async (
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

      const sessions = await pomodoroSessionService.getWeekSessions(req.user.id);

      res.status(200).json({
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  },

  getStats: async (
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

      const cacheKey = `stats:${req.user.id}`;
      const redis = getRedis();

      // Try cache first (5 minutes = 300 seconds)
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            res.status(200).json({
              data: JSON.parse(cached as string),
              cached: true
            });
            return;
          }
        } catch (cacheError) {
          console.error('Cache read error:', cacheError);
        }
      }

      const stats = await pomodoroSessionService.getStats(req.user.id);

      // Save to cache
      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(stats), { EX: 300 });
        } catch (cacheError) {
          console.error('Cache write error:', cacheError);
        }
      }

      res.status(200).json({
        data: stats,
        cached: false
      });
    } catch (error) {
      next(error);
    }
  }
};
