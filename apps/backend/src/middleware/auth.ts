import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

// Extender Request para incluir user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
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

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as Record<
      string,
      any
    >;

    if (typeof decoded === "string" || !decoded.sub || !decoded.email) {
      const error = new Error("Token inválido");
      (error as any).statusCode = 401;
      return next(error);
    }

    req.user = {
      id: decoded.sub as number,
      email: decoded.email as string,
    };

    next();
  } catch (error) {
    const err = new Error("Access token inválido o expirado");
    (err as any).statusCode = 401;
    next(err);
  }
};
