import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { userRepository } from "../repositories/user.repository.ts";
import { env } from "../config/env.ts";

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
      const error = new Error("El email ya está registrado") as any;
      error.statusCode = 409;
      throw error;
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
      const error = new Error("Credenciales inválidas") as any;
      error.statusCode = 401;
      throw error;
    }

    if (!user.is_active) {
      const error = new Error("Cuenta desactivada") as any;
      error.statusCode = 403;
      throw error;
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
        const error = new Error("Usuario no encontrado") as any;
        error.statusCode = 401;
        throw error;
      }

      if (jti) {
        const isRevoked = await userRepository.isRefreshTokenRevoked(jti);
        if (isRevoked) {
          const error = new Error("Refresh token revocado o expirado") as any;
          error.statusCode = 401;
          throw error;
        }
      }

      const newAccessToken = jwt.sign(
        { sub: userId, email: user.email },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" },
      );

      return { accessToken: newAccessToken, refreshToken };
    } catch (error) {
      const err = new Error("Refresh token inválido o expirado") as any;
      err.statusCode = 401;
      throw err;
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
    } catch (error) {
      // Silenciosamente ignorar
    }
  },

  getUserById: async (userId: number) => {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error("Usuario no encontrado") as any;
      error.statusCode = 404;
      throw error;
    }
    return user;
  },
};
