import { db } from "../config/database.js";
import type { PoolClient } from "pg";

export interface RawRoom {
  id: number;
  name: string;
  code: string;
  is_public: boolean;
  max_members: number;
  owner_id: number;
  last_activity: Date;
  created_at: Date;
}

export interface RawRoomListItem {
  id: number;
  name: string;
  code: string;
  max_members: number;
  owner_id: number;
  last_activity: Date;
  member_count: number;
}

export interface RawDeletedRoom {
  id: number;
  code: string;
}

/**
 * Convierte un RawRoom de la BD al formato de la aplicación
 * @param raw - Objeto RawRoom de la base de datos
 * @returns Objeto Room con las propiedades mapeadas
 */
export function mapRawRoomToRoom(raw: RawRoom) {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    is_public: raw.is_public,
    max_members: raw.max_members,
    owner_id: raw.owner_id,
    last_activity: raw.last_activity,
    created_at: raw.created_at,
  };
}

/**
 * Convierte un RawRoomListItem de la BD al formato de la aplicación
 * @param raw - Objeto RawRoomListItem de la base de datos
 * @returns Objeto RoomListItem con las propiedades mapeadas
 */
export function mapRawRoomToRoomListItem(raw: RawRoomListItem) {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    max_members: raw.max_members,
    owner_id: raw.owner_id,
    last_activity: raw.last_activity,
    member_count: raw.member_count,
  };
}

/**
 * Repositorio de salas — todas las operaciones de BD relacionadas con rooms
 * Usa transacciones para operaciones que modifican multiples tablas
 */
const roomRepository = {
  /**
   * Obtiene un cliente del pool para usar en transacciones
   * @returns Cliente de PostgreSQL para transacciones BEGIN/COMMIT/ROLLBACK
   */
  getClient() {
    return db.getClient();
  },

  /**
   * Verifica si un código de sala ya existe en la base de datos
   * @param code - Código de 8 caracteres a verificar
   * @returns true si el código ya está en uso, false si está disponible
   */
  async codeExists(code: string): Promise<boolean> {
    const result = await db.query(
      "SELECT 1 FROM rooms WHERE code = $1 LIMIT 1",
      [code],
    );
    return result.rows.length > 0;
  },

  /**
   * Crea una nueva sala en la base de datos
   * @param client - Cliente de transacción de PostgreSQL
   * @param name - Nombre de la sala
   * @param code - Código único de 8 caracteres
   * @param isPublic - Si la sala es pública o privada
   * @param maxMembers - Máximo de miembros permitidos
   * @param ownerId - ID del usuario propietario
   * @returns RawRoom recién creado con todos sus campos
   */
  async createRoom(
    client: PoolClient,
    name: string,
    code: string,
    isPublic: boolean,
    maxMembers: number,
    ownerId: number,
  ): Promise<RawRoom> {
    const result = await client.query(
      `INSERT INTO rooms (name, code, is_public, max_members, owner_id, last_activity)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [name, code, isPublic, maxMembers, ownerId],
    );
    return result.rows[0];
  },

  /**
   * Agrega un miembro a una sala (INSERT con ON CONFLICT DO NOTHING)
   * @param client - Cliente de transacción
   * @param roomId - ID de la sala
   * @param userId - ID del usuario a agregar
   */
  async addMember(
    client: PoolClient,
    roomId: number,
    userId: number,
  ): Promise<void> {
    await client.query(
      `INSERT INTO room_members (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [roomId, userId],
    );
  },

  /**
   * Busca una sala por su código único
   * @param code - Código de la sala (8 caracteres)
   * @returns RawRoom o null si no existe
   */
  async findByCode(code: string): Promise<RawRoom | null> {
    const result = await db.query(
      "SELECT * FROM rooms WHERE code = $1 LIMIT 1",
      [code],
    );
    return result.rows[0] || null;
  },

  /**
   * Lista salas públicas con búsqueda opcional y paginación
   * Hace JOIN con room_members para obtener member_count
   * @param search - Término de búsqueda por nombre (opcional)
   * @param limit - Máximo de resultados (default 20)
   * @param offset - Desplazamiento para paginación (default 0)
   * @returns Array de RawRoomListItem con member_count incluido
   */
  async listPublicRooms(
    search?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<RawRoomListItem[]> {
    let query = `
      SELECT r.*, 
             COUNT(rm.user_id) as member_count
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      WHERE r.is_public = true
    `;

    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND r.name ILIKE $${params.length}`;
    }

    query += ` GROUP BY r.id`;
    query += ` ORDER BY r.last_activity DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  },

  /**
   * Busca una sala por su ID interno
   * @param roomId - ID de la sala
   * @returns RawRoom o null si no existe
   */
  async findById(roomId: number): Promise<RawRoom | null> {
    const result = await db.query("SELECT * FROM rooms WHERE id = $1 LIMIT 1", [
      roomId,
    ]);
    return result.rows[0] || null;
  },

  /**
   * Cuenta el número total de miembros en una sala
   * @param roomId - ID de la sala
   * @returns Número de miembros en la sala
   */
  async countMembers(roomId: number): Promise<number> {
    const result = await db.query(
      "SELECT COUNT(*) as count FROM room_members WHERE room_id = $1",
      [roomId],
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Verifica si un usuario ya es miembro de una sala
   * @param roomId - ID de la sala
   * @param userId - ID del usuario
   * @returns true si el usuario ya es miembro, false si no
   */
  async isMember(roomId: number, userId: number): Promise<boolean> {
    const result = await db.query(
      "SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2 LIMIT 1",
      [roomId, userId],
    );
    return result.rows.length > 0;
  },

  /**
   * Agrega miembro a sala dentro de una transacción (sin ON CONFLICT)
   * @param client - Cliente de transacción
   * @param roomId - ID de la sala
   * @param userId - ID del usuario
   */
  async addMemberTransactional(
    client: PoolClient,
    roomId: number,
    userId: number,
  ): Promise<void> {
    await client.query(
      `INSERT INTO room_members (room_id, user_id)
       VALUES ($1, $2)`,
      [roomId, userId],
    );
  },

  /**
   * Actualiza last_activity de una sala al momento actual
   * @param roomId - ID de la sala
   * @param client - Cliente opcional (transacción) o usa db por defecto
   */
  async updateLastActivity(
    roomId: number,
    client?: PoolClient,
  ): Promise<void> {
    const executor = client ?? db;
    await executor.query("UPDATE rooms SET last_activity = NOW() WHERE id = $1", [
      roomId,
    ]);
  },

  /**
   * Elimina un miembro de una sala
   * @param client - Cliente de transacción
   * @param roomId - ID de la sala
   * @param userId - ID del usuario a remover
   * @returns Número de filas eliminadas (0 o 1)
   */
  async removeMember(
    client: PoolClient,
    roomId: number,
    userId: number,
  ): Promise<number> {
    const result = await client.query(
      `DELETE FROM room_members
       WHERE room_id = $1 AND user_id = $2`,
      [roomId, userId],
    );
    return result.rowCount ?? 0;
  },

  /**
   * Elimina una sala por su ID (room_members se elimina por CASCADE)
   * @param client - Cliente de transacción
   * @param roomId - ID de la sala a eliminar
   * @returns Número de filas eliminadas (0 o 1)
   */
  async deleteRoomById(client: PoolClient, roomId: number): Promise<number> {
    const result = await client.query("DELETE FROM rooms WHERE id = $1", [
      roomId,
    ]);
    return result.rowCount ?? 0;
  },

  /**
   * Elimina salas inactivas (last_activity < hace 24 horas)
   * Usado por el cron job para limpieza automática
   * @returns Array de RawDeletedRoom con id y code de salas eliminadas
   */
  async deleteInactiveRooms(): Promise<RawDeletedRoom[]> {
    const result = await db.query(
      `DELETE FROM rooms
       WHERE last_activity < NOW() - INTERVAL '24 hours'
       RETURNING id, code`,
    );

    const rows = result.rows as Array<{ id: string | number; code: string }>;
    return rows.map((row) => ({
      id: Number.parseInt(String(row.id), 10),
      code: row.code,
    }));
  },
};

export { roomRepository };
