import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { userRepository } from "../repositories/user.repository.ts";
import { env } from "../config/env.ts";

// ─── Tipos ──────────────────────────────────────────────
export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Helpers de tokens ──────────────────────────────────
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

// ─── Servicio ────────────────────────────────────────────
export const authService = {
  register: async (data: RegisterData): Promise<AuthTokens> => {
    // 1. Verificar si el email ya existe
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      const error = new Error("El email ya está registrado");
      (error as any).statusCode = 409;
      throw error;
    }

    // 2. Hashear la contraseña
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 3. Crear usuario + settings en transacción
    const user = await userRepository.createWithSettings({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
    });

    // 4. Generar tokens
    return generateTokens(user.id, user.email);
  },

  login: async (
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> => {
    // 1. Buscar usuario por email
    const user = await userRepository.findByEmailWithPassword(email);

    // 2. PREVENCIÓN DE TIMING ATTACKS: Siempre comparar contraseña
    // - Si usuario no existe: bcrypt.compare toma tiempo igual
    // - Así el atacante no puede saber si el email existe por el tiempo de respuesta
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    // 3. Error genérico si email no existe O contraseña incorrecta
    if (!user || !passwordMatch) {
      const error = new Error("Credenciales inválidas");
      (error as any).statusCode = 401;
      throw error;
    }

    // 4. Verificar que la cuenta esté activa
    if (!user.is_active) {
      const error = new Error("Cuenta desactivada");
      (error as any).statusCode = 403;
      throw error;
    }

    // 5. Generar tokens
    const { accessToken, refreshToken, refreshTokenJti } = generateTokens(
      user.id,
      user.email,
    );

    // 6. Hashear refresh token antes de guardar
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    // 7. Calcular expiración (7 días)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 8. Guardar token hasheado con jti en la BD
    await userRepository.saveRefreshTokenWithJti(
      user.id,
      refreshTokenHash,
      refreshTokenJti,
      expiresAt,
      ipAddress,
      userAgent,
    );

    // 9. Retornar tokens
    return { accessToken, refreshToken };
  },

  refreshAccessToken: async (refreshToken: string): Promise<AuthTokens> => {
    try {
      // 1. Verificar y decodificar el refresh token
      const decoded = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET,
      ) as { sub: number; jti: string };

      const userId = decoded.sub;
      const jti = decoded.jti;

      if (!jti) {
        const error = new Error("Token inválido");
        (error as any).statusCode = 401;
        throw error;
      }

      // 2. Buscar usuario
      const user = await userRepository.findById(userId);
      if (!user || user.id !== userId) {
        const error = new Error("Usuario no encontrado");
        (error as any).statusCode = 401;
        throw error;
      }

      // 3. Verificar si el token está revocado
      const isRevoked = await userRepository.isRefreshTokenRevoked(jti);
      if (isRevoked) {
        const error = new Error("Refresh token revocado o expirado");
        (error as any).statusCode = 401;
        throw error;
      }

      // 4. Generar nuevo access token
      const newAccessToken = jwt.sign(
        { sub: userId, email: user.email },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" },
      );

      // 5. El refresh token sigue siendo el mismo
      return { accessToken: newAccessToken, refreshToken };
    } catch (error) {
      const err = new Error("Refresh token inválido o expirado");
      (err as any).statusCode = 401;
      throw err;
    }
  },

  revokeRefreshToken: async (refreshToken: string): Promise<void> => {
    try {
      // 1. Verificar y decodificar el refresh token
      const decoded = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET,
      ) as { sub: number; jti: string };

      const jti = decoded.jti;

      if (!jti) {
        return; // Token sin jti, no hay nada que revocar
      }

      // 2. Marcar como revocado en la BD
      await userRepository.revokeRefreshToken(jti);
    } catch (error) {
      // Token inválido o expirado - no hay nada que revocar
      // Silenciosamente ignorar errores de revocación
    }
  },

  getUserById: async (userId: number) => {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error("Usuario no encontrado");
      (error as any).statusCode = 404;
      throw error;
    }
    return user;
  },
};
