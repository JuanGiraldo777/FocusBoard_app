import express from "express";
import type { Express } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { env } from "./config/env.ts";

export const createApp = (): Express => {
  const app = express();

  // ─── Middleware global ──────────────────────────────────
  app.use(express.json());
  app.use(cookieParser());

  // ─── CORS (opcional, personalizar según necesites) ──────
  app.use((req, res, next) => {
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

  // ─── Health check ───────────────────────────────────────
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ─── Rutas ──────────────────────────────────────────────
  app.use("/api/auth", authRouter);

  // ─── Error handler (siempre al final) ────────────────────
  app.use(errorHandler);

  return app;
};
