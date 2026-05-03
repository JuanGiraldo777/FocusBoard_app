import { db } from "../config/database.ts";
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

const roomRepository = {
  getClient() {
    return db.getClient();
  },

  async codeExists(code: string): Promise<boolean> {
    const result = await db.query(
      "SELECT 1 FROM rooms WHERE code = $1 LIMIT 1",
      [code],
    );
    return result.rows.length > 0;
  },

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

  async findByCode(code: string): Promise<RawRoom | null> {
    const result = await db.query(
      "SELECT * FROM rooms WHERE code = $1 LIMIT 1",
      [code],
    );
    return result.rows[0] || null;
  },

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
};

export { roomRepository };
