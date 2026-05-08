import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { userRepository } from "../repositories/user.repository.js";
import { env } from "../config/env.js";
import { createAppError } from "../types/errors.js";

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Genera access y refresh tokens JWT para un usuario
 * Access token expira en 15m, refresh en 7d
 * @param userId - ID del usuario para el claims sub
 * @param email - Email del usuario para el claims
 * @returns Objeto con accessToken, refreshToken y refreshTokenJti (UUID para revocación)
 */
const generateTokens = (
  userId: number,
  email: string,
): AuthTokens & { refreshTokenJti: string } => {
  const refreshTokenJti = randomUUID();

  const accessToken = jwt.sign(
    { sub: userId, email },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { sub: userId, jti: refreshTokenJti },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken, refreshTokenJti };
};

export const authService = {
  /**
   * Registra un nuevo usuario con email, password y nombre
   * Hashea password con bcrypt cost 12 por seguridad en producción
   * Crea user + settings en transacción atómica via userRepository
   * @param data - Datos de registro (email, password, fullName)
   * @returns AuthTokens (access y refresh tokens)
   * @throws Error 409 si el email ya está registrado
   */
  register: async (data: RegisterData): Promise<AuthTokens> => {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw createAppError("El email ya está registrado", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await userRepository.createWithSettings({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
    });

    return generateTokens(user.id, user.email);
  },

  /**
   * Autentica un usuario con email y password
   * Compara password con bcrypt.compare y valida que la cuenta esté activa
   * Genera tokens y guarda refresh token hasheado en BD con jti para revocación
   * @param email - Email del usuario
   * @param password - Password en texto plano
   * @param ipAddress - IP del cliente (opcional, para auditoría)
   * @param userAgent - User-Agent del cliente (opcional, para auditoría)
   * @returns AuthTokens (access y refresh tokens)
   * @throws Error 401 si credenciales inválidas
   * @throws Error 403 si la cuenta está desactivada
   */
  login: async (
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> => {
    const user = await userRepository.findByEmailWithPassword(email);

    const passwordMatch = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !passwordMatch) {
      throw createAppError("Credenciales inválidas", 401);
    }

    if (!user.is_active) {
      throw createAppError("Cuenta desactivada", 403);
    }

    const { accessToken, refreshToken, refreshTokenJti } = generateTokens(
      user.id,
      user.email,
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await userRepository.saveRefreshTokenWithJti(
      user.id,
      refreshTokenHash,
      refreshTokenJti,
      expiresAt,
      ipAddress,
      userAgent,
    );

    return { accessToken, refreshToken };
  },

  /**
   * Renueva el access token usando un refresh token válido
   * Verifica que el refresh token no esté revocado buscando por jti
   * @param refreshToken - Refresh token JWT para validar
   * @returns Nuevos tokens (nuevo access token, mismo refresh token)
   * @throws Error 401 si el refresh token es inválido, expirado o revocado
   */
  refreshAccessToken: async (refreshToken: string): Promise<AuthTokens> => {
    try {
      const decoded = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET,
      ) as unknown as { sub: number; jti?: string };

      const userId = decoded.sub;
      const jti = decoded.jti;

      const user = await userRepository.findById(userId);
      if (!user || user.id !== userId) {
        throw createAppError("Usuario no encontrado", 401);
      }

      if (jti) {
        const isRevoked = await userRepository.isRefreshTokenRevoked(jti);
        if (isRevoked) {
          throw createAppError("Refresh token revocado o expirado", 401);
        }
      }

      const newAccessToken = jwt.sign(
        { sub: userId, email: user.email },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" },
      );

      return { accessToken: newAccessToken, refreshToken };
    } catch {
      throw createAppError("Refresh token inválido o expirado", 401);
    }
  },

  /**
   * Revoca un refresh token (lo marca como revocado en BD)
   * Busca por jti en el payload del JWT, si existe lo revoca
   * @param refreshToken - Refresh token JWT a revocar
   */
  revokeRefreshToken: async (refreshToken: string): Promise<void> => {
    try {
      const decoded = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET,
      ) as unknown as { sub: number; jti: string };

      const jti = decoded.jti;
      if (!jti) return;

      await userRepository.revokeRefreshToken(jti);
    } catch {
      // Silenciosamente ignorar si el token es inválido
    }
  },

  /**
   * Obtiene información de un usuario por su ID
   * @param userId - ID del usuario a buscar
   * @returns UserRecord con datos del usuario
   * @throws Error 404 si el usuario no existe
   */
  getUserById: async (userId: number) => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createAppError("Usuario no encontrado", 404);
    }
    return user;
  },
};
