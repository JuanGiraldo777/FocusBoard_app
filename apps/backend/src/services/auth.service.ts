import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { userRepository } from "../repositories/user.repository.ts";
import { env } from "../config/env.ts";
import { createAppError } from "../types/errors.ts";

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

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
      // Silenciosamente ignorar
    }
  },

  getUserById: async (userId: number) => {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw createAppError("Usuario no encontrado", 404);
    }
    return user;
  },
};
