import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.ts";
import { userMapper } from "../mappers/user.mapper.ts";
import type {
  RegisterRequest,
  LoginRequest,
} from "../middleware/validation.ts";
import { createAppError } from "../types/errors.ts";

export const authController = {
  register: async (
    req: Request<Record<string, never>, unknown, RegisterRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password, fullName } = req.body;
      const { accessToken, refreshToken } = await authService.register({
        email,
        password,
        fullName,
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        message: "Usuario registrado correctamente",
        data: { accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (
    req: Request<Record<string, never>, unknown, LoginRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const userAgent = req.get("user-agent");

      const { accessToken, refreshToken } = await authService.login(
        email,
        password,
        req.ip,
        userAgent,
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Sesión iniciada correctamente",
        data: { accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return next(createAppError("Refresh token no encontrado", 401));
      }

      const { accessToken: newAccessToken } =
        await authService.refreshAccessToken(refreshToken);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({
        message: "Access token renovado",
        data: { accessToken: newAccessToken },
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(200).json({
        message: "Sesión cerrada correctamente",
      });
    } catch (error) {
      next(error);
    }
  },

  me: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        return next(createAppError("Usuario no autenticado", 401));
      }

      const user = await authService.getUserById(req.user.id);
      const userDTO = userMapper.toDTO(user);

      res.status(200).json({
        message: "Información del usuario",
        data: userDTO,
      });
    } catch (error) {
      next(error);
    }
  },
};
