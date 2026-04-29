import { db } from "../config/database.ts";

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

export const userRepository = {
  // Buscar usuario por email
  findByEmail: async (email: string): Promise<UserRecord | null> => {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0] ?? null;
  },

  // Buscar usuario por email CON password_hash (para login)
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

  // Crear usuario + user_settings en una transacción
  createWithSettings: async (data: CreateUserData): Promise<UserRecord> => {
    const client = await db.getClient();

    // BEGIN    → "empieza un bloque atómico"
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

      // COMMIT   → "guarda todo si no hubo errores"
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

  // Guardar refresh token hasheado en la BD
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

  // Buscar usuario por ID
  findById: async (id: number): Promise<UserRecord | null> => {
    const result = await db.query(
      "SELECT id, email, full_name, avatar_url, is_active, created_at FROM users WHERE id = $1",
      [id],
    );
    return result.rows[0] ?? null;
  },
};
