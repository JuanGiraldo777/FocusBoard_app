import { Router } from "express";
import { pomodoroSessionController } from "../controllers/pomodoro-sessions.controller.ts";
import { verifyAccessToken } from "../middleware/auth.ts";
import { validateCreateSession } from "../middleware/session.validation.ts";

export const pomodoroSessionRouter = Router();

pomodoroSessionRouter.post(
  "/sessions",
  verifyAccessToken,
  validateCreateSession,
  pomodoroSessionController.create,
);
pomodoroSessionRouter.get(
  "/sessions/today-count",
  verifyAccessToken,
  pomodoroSessionController.getTodayCount,
);

// GET /api/v1/sessions/today - Obtener sesiones de hoy
pomodoroSessionRouter.get(
  "/sessions/today",
  verifyAccessToken,
  pomodoroSessionController.getTodaySessions,
);
pomodoroSessionRouter.get(
  "/sessions/week",
  verifyAccessToken,
  pomodoroSessionController.getWeekSessions,
);
pomodoroSessionRouter.get(
  "/sessions/stats",
  verifyAccessToken,
  pomodoroSessionController.getStats,
);
