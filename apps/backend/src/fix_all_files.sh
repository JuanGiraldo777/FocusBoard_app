#!/bin/bash

# Fix app.ts
cat > app.ts << 'EOF'
import { express, type Express } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes.ts";
import { pomodoroSessionRouter } from "./routes/pomodoro-sessions.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { env } from "./config/env.ts";

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", env.CORS_ORIGIN);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/", pomodoroSessionRouter);

  app.use(errorHandler);

  return app;
};
EOF

# Fix routes/pomodoro-sessions.routes.ts
cat > routes/pomodoro-sessions.routes.ts << 'EOF'
import { Router } from "express";
import { pomodoroSessionController } from "../controllers/pomodoro-sessions.controller.ts";
import { verifyAccessToken } from "../middleware/auth.ts";

export const pomodoroSessionRouter = Router();

pomodoroSessionRouter.post("/api/v1/sessions", verifyAccessToken, pomodoroSessionController.create);
EOF

# Fix controllers/pomodoro-sessions.controller.ts
cat > controllers/pomodoro-sessions.controller.ts << 'EOF'
import { Request, Response, NextFunction } from "express";
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
  }
};
EOF

echo "All files fixed!"
