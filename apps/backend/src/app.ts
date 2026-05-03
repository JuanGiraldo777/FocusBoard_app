import type { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes.ts";
import { pomodoroSessionRouter } from "./routes/pomodoro-sessions.routes.ts";
import { roomRoutes } from "./routes/room.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { env } from "./config/env.ts";

export const createApp = (): Express => {
  const app = express();

  // Solo confiar en primer proxy en producción (p. ej. Nginx/Render/Fly)
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

  app.use(express.json());
  app.use(cookieParser());

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", env.CORS_ORIGIN);
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/v1", pomodoroSessionRouter);
  app.use("/api/v1/rooms", roomRoutes);

  app.use(errorHandler);

  return app;
};
