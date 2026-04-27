import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.ts";
import type { RegisterRequest } from "../middleware/validation.ts";

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
};
