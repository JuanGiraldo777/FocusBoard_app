import { Router } from "express";
import { pomodoroSessionController } from "../controllers/pomodoro-sessions.controller.ts";
import { verifyAccessToken } from "../middleware/auth.ts";

export const pomodoroSessionRouter = Router();

pomodoroSessionRouter.post("/api/v1/sessions", verifyAccessToken, pomodoroSessionController.create);
pomodoroSessionRouter.get("/api/v1/sessions/today-count", verifyAccessToken, pomodoroSessionController.getTodayCount);
pomodoroSessionRouter.get("/api/v1/sessions/today", verifyAccessToken, pomodoroSessionController.getTodaySessions);
pomodoroSessionRouter.get("/api/v1/sessions/week", verifyAccessToken, pomodoroSessionController.getWeekSessions);
pomodoroSessionRouter.get("/api/v1/sessions/stats", verifyAccessToken, pomodoroSessionController.getStats);
