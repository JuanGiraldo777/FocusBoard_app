import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { createAppError } from "../types/errors.js";

// Extender Request para incluir user info
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email: string;
    };
  }
}

export const verifyAccessToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return next(createAppError("Access token no encontrado", 401));
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as
      | JwtPayload
      | string;

    if (typeof decoded === "string" || !decoded.sub || !decoded.email) {
      return next(createAppError("Token inválido", 401));
    }

    const userId =
      typeof decoded.sub === "number"
        ? decoded.sub
        : Number.parseInt(decoded.sub, 10);

    if (!Number.isFinite(userId)) {
      return next(createAppError("Token inválido", 401));
    }

    req.user = {
      id: userId,
      email: String(decoded.email),
    };

    next();
  } catch {
    next(createAppError("Access token inválido o expirado", 401));
  }
};
