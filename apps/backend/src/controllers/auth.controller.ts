import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.ts";
import type { RegisterRequest, LoginRequest } from "../middleware/validation.ts";

export const authController = {
  register: async (
    req: Request<{}, {}, RegisterRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password, fullName } = req.body;

      // Llamar al servicio
      const { accessToken, refreshToken } = await authService.register({
        email,
        password,
        fullName,
      });

      // Configurar cookies HttpOnly
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      // Respuesta exitosa
      res.status(201).json({
        message: "Usuario registrado correctamente",
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (
    req: Request<{}, {}, LoginRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const userAgent = req.get("user-agent");

      // Llamar al servicio (validación ya hecha por middleware)
      const { accessToken, refreshToken } = await authService.login(
        email,
        password,
        req.ip,
        userAgent,
      );

      // Configurar cookies (IDÉNTICAS a register para consistencia)
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      // Retornar 200 (no 201, porque no estamos creando un nuevo recurso)
      res.status(200).json({
        message: "Sesión iniciada correctamente",
        data: {
          accessToken,
          refreshToken,
        },
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
      // El refresh token viene en las cookies
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        const error = new Error("Refresh token no encontrado");
        (error as any).statusCode = 401;
        return next(error);
      }

      // Llamar al servicio para renovar el access token
      const { accessToken: newAccessToken } = await authService.refreshAccessToken(
        refreshToken,
      );

      // Actualizar cookie del access token
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      res.status(200).json({
        message: "Access token renovado",
        data: {
          accessToken: newAccessToken,
        },
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

      // Revocar el refresh token en la BD si existe
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      // Limpiar cookies
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
        const error = new Error("Usuario no autenticado");
        (error as any).statusCode = 401;
        return next(error);
      }

      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        message: "Información del usuario",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};
