import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { userMapper } from "../mappers/user.mapper.js";
import type {
  RegisterRequest,
  LoginRequest,
} from "../middleware/validation.js";
import { createAppError } from "../types/errors.js";

export const authController = {
  /**
   * Maneja el registro de nuevos usuarios
   * Extrae email, password y fullName del body validado
   * Establece cookies httpOnly para access y refresh tokens
   * @param req - Request con body validado (RegisterRequest)
   * @param res - Response para establecer cookies y devolver tokens
   * @param next - Pasa errores al errorHandler
   * @throws Error 409 si el email ya está registrado
   */
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

  /**
   * Maneja el login de usuarios existentes
   * Extrae email y password del body, captura IP y User-Agent para auditoría
   * Establece cookies httpOnly para access y refresh tokens
   * @param req - Request con body validado (LoginRequest)
   * @param res - Response para establecer cookies y devolver tokens
   * @param next - Pasa errores al errorHandler
   * @throws Error 401 si credenciales inválidas
   * @throws Error 403 si la cuenta está desactivada
   */
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

  /**
   * Renueva el access token usando el refresh token de la cookie
   * Extrae refreshToken de req.cookies y genera un nuevo access token
   * @param req - Request con cookie refreshToken
   * @param res - Response para establecer nueva cookie de access token
   * @param next - Pasa errores al errorHandler
   * @throws Error 401 si el refresh token no existe, es inválido o expirado
   */
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

  /**
   * Cierra la sesión del usuario revocando el refresh token
   * Limpia las cookies accessToken y refreshToken
   * @param req - Request con cookie refreshToken a revocar
   * @param res - Response confirmando cierre de sesión
   * @param next - Pasa errores al errorHandler
   */
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

  /**
   * Obtiene la información del usuario autenticado
   * Usa req.user (establecido por auth middleware) para buscar el usuario
   * Mapea el UserRecord a DTO antes de devolverlo
   * @param req - Request con req.user poblado por auth middleware
   * @param res - Response con datos del usuario en DTO
   * @param next - Pasa errores al errorHandler
   * @throws Error 401 si el usuario no está autenticado
   * @throws Error 404 si el usuario no existe
   */
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
