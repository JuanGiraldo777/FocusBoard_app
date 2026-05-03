import { Router } from "express";
import { pomodoroSessionController } from "../controllers/pomodoro-sessions.controller.ts";
import { verifyAccessToken } from "../middleware/auth.ts";

export const pomodoroSessionRouter = Router();

pomodoroSessionRouter.post(
  "/sessions",
  verifyAccessToken,
  pomodoroSessionController.create,
);
pomodoroSessionRouter.get(
  "/sessions/today-count",
  verifyAccessToken,
  pomodoroSessionController.getTodayCount,
);
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
