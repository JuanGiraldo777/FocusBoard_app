import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

// Extender Request para incluir user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

export const verifyAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      const error = new Error("Access token no encontrado");
      (error as any).statusCode = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as {
      sub: number;
      email: string;
    };

    req.user = {
      userId: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (error) {
    const err = new Error("Access token inválido o expirado");
    (err as any).statusCode = 401;
    next(err);
  }
};
