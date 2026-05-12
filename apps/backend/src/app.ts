import type { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import type { Server as HttpServer } from "http";
import express from "express";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { parse as parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import { authRouter } from "./routes/auth.routes.js";
import { cronRouter } from "./routes/cron.routes.js";
import { pomodoroSessionRouter } from "./routes/pomodoro-sessions.routes.js";
import { roomRoutes } from "./routes/room.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";
import { setupRoomSockets } from "./sockets/room.socket.js";

const getAllowedOrigins = (): string[] => {
  const origins = [env.CORS_ORIGIN];

  try {
    const parsed = new URL(env.CORS_ORIGIN);
    if (parsed.hostname === "localhost") {
      const alt = new URL(env.CORS_ORIGIN);
      alt.hostname = "127.0.0.1";
      origins.push(alt.toString().replace(/\/$/, ""));
    } else if (parsed.hostname === "127.0.0.1") {
      const alt = new URL(env.CORS_ORIGIN);
      alt.hostname = "localhost";
      origins.push(alt.toString().replace(/\/$/, ""));
    }
  } catch {
    // Si CORS_ORIGIN no es una URL válida, se usa el valor original.
  }

  return Array.from(new Set(origins.map((origin) => origin.replace(/\/$/, ""))));
};

const allowedOrigins = getAllowedOrigins();

export const createApp = (): Express => {
  const app = express();

  // Solo confiar en primer proxy en producción (p. ej. Nginx/Render/Fly)
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

  app.use(express.json());
  app.use(cookieParser());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = (req.headers.origin ?? "").replace(/\/$/, "");
    const allowOrigin = allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];

    res.header("Access-Control-Allow-Origin", allowOrigin);
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
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/cron", cronRouter);
  app.use("/api/v1/rooms", roomRoutes);

  app.use(errorHandler);

  return app;
};

export const createSocketIO = async (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000, // 30s para detectar desconexiones
    pingInterval: 25000, // Heartbeat cada 25s
  });

  // Configurar adapter Redis para escalar Socket.IO
  const pubClient = createClient({
    url: env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false,
    },
  });
  const subClient = pubClient.duplicate();

  try {
    await pubClient.connect();
    await subClient.connect();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✓ Socket.io Redis adapter configurado");
  } catch (error) {
    console.warn(
      `⚠️ No se pudo configurar Redis adapter para Socket.IO: ${(error as Error).message}. Continuando en modo local (sin adapter distribuido).`,
    );
  }

  // Middleware de autenticación para sockets: verificar JWT desde la cookie
  io.use((socket, next) => {
    try {
      const cookieHeader = String(socket.handshake.headers.cookie || "");
      const cookies = parseCookie(cookieHeader || "");
      const token = cookies.accessToken;
      if (!token) return next(new Error("Authentication error: token missing"));

      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as
        | { sub: string | number; email?: string }
        | string;

      if (typeof decoded === "string")
        return next(new Error("Authentication error"));

      const userId =
        typeof decoded.sub === "number" ? decoded.sub : Number(decoded.sub);
      if (!Number.isFinite(userId))
        return next(new Error("Authentication error: invalid token"));

      type SocketUser = { id: number; email: string };
      type SocketData = { user?: SocketUser };
      const socketWithData = socket as typeof socket & { data: SocketData };

      socketWithData.data.user = {
        id: userId,
        email: decoded.email ?? "",
      };
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  setupRoomSockets(io);

  return io;
};
