import { db } from "../config/database.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
}

export interface UserRecord {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Repositorio de usuarios — todas las operaciones de BD relacionadas con users
 * Usa transacciones para operaciones que modifican multiples tablas
 */
export const userRepository = {
  /**
   * Busca un usuario por su email (para verificar duplicados en registro)
   * @param email - Email del usuario a buscar
   * @returns UserRecord completo o null si no existe
   */
  findByEmail: async (email: string): Promise<UserRecord | null> => {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0] ?? null;
  },

  /**
   * Busca usuario por email incluyendo password_hash (solo para login)
   * @param email - Email del usuario
   * @returns Objeto con id, email, password_hash e is_active o null
   */
  findByEmailWithPassword: async (
    email: string,
  ): Promise<{
    id: number;
    email: string;
    password_hash: string;
    is_active: boolean;
  } | null> => {
    const result = await db.query(
      "SELECT id, email, password_hash, is_active FROM users WHERE email = $1",
      [email],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Crea usuario + user_settings en una transacción atómica
   * Usa BEGIN/COMMIT/ROLLBACK para asegurar consistencia entre tablas
   * @param data - Datos del usuario (email, passwordHash, fullName)
   * @returns UserRecord del usuario recién creado
   * @throws Error si la transacción falla (se hace ROLLBACK automático)
   */
  createWithSettings: async (data: CreateUserData): Promise<UserRecord> => {
    const client = await db.getClient();

    // BEGIN → "empieza un bloque atómico"
    try {
      await client.query("BEGIN");

      // Insertar usuario
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, full_name, avatar_url, is_active, created_at`,
        [data.email, data.passwordHash, data.fullName],
      );

      const user = userResult.rows[0];

      // Insertar user_settings con valores por defecto
      await client.query(
        `INSERT INTO user_settings (user_id)
         VALUES ($1)`,
        [user.id],
      );

      // COMMIT → "guarda todo si no hubo errores"
      await client.query("COMMIT");
      return user;
    } catch (error) {
      // ROLLBACK → "deshaz todo si algo falló"
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Guarda refresh token hasheado en la BD (método legacy sin jti)
   * @param userId - ID del usuario
   * @param tokenHash - Hash del refresh token (bcrypt)
   * @param expiresAt - Fecha de expiración del token
   * @param ipAddress - IP del cliente (opcional)
   * @param userAgent - User-Agent del cliente (opcional)
   */
  saveRefreshToken: async (
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> => {
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, ipAddress || null, userAgent || null],
    );
  },

  /**
   * Busca usuario por ID (para validar tokens y obtener perfil)
   * @param id - ID del usuario
   * @returns UserRecord o null si no existe
   */
  findById: async (id: number): Promise<UserRecord | null> => {
    const result = await db.query(
      "SELECT id, email, full_name, avatar_url, is_active, created_at FROM users WHERE id = $1",
      [id],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Verifica si un refresh token está revocado buscando por jti
   * @param jti - JWT ID del refresh token
   * @returns true si está revocado o no existe, false si es válido
   */
  isRefreshTokenRevoked: async (jti: string): Promise<boolean> => {
    const result = await db.query(
      "SELECT revoked_at FROM refresh_tokens WHERE token_jti = $1 LIMIT 1",
      [jti],
    );
    return result.rows.length === 0 || result.rows[0].revoked_at !== null;
  },

  /**
   * Revoca un refresh token (establece revoked_at = NOW())
   * @param jti - JWT ID del refresh token a revocar
   */
  revokeRefreshToken: async (jti: string): Promise<void> => {
    await db.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_jti = $1",
      [jti],
    );
  },

  /**
   * Guarda refresh token con jti para permitir revocación individual
   * @param userId - ID del usuario
   * @param tokenHash - Hash del refresh token
   * @param jti - JWT ID único para revocación
   * @param expiresAt - Fecha de expiración
   * @param ipAddress - IP del cliente (opcional)
   * @param userAgent - User-Agent del cliente (opcional)
   */
  saveRefreshTokenWithJti: async (
    userId: number,
    tokenHash: string,
    jti: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> => {
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_jti, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, tokenHash, jti, expiresAt, ipAddress || null, userAgent || null],
    );
  },
};
