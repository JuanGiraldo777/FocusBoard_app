import { getRedis } from "../config/redis.ts";
import crypto from "crypto";
import type { CreateRoomRequest } from "../validators/room.validator.ts";
import {
  roomRepository,
  mapRawRoomToRoom,
  mapRawRoomToRoomListItem,
} from "../repositories/room.repository.ts";

type Room = ReturnType<typeof mapRawRoomToRoom>;
type RoomListItem = ReturnType<typeof mapRawRoomToRoomListItem> & {
  activeMembers: number;
};

const roomService = {
  /**
   * Genera un código único de 8 caracteres alfanuméricos
   * Reintenta si hay colisión (máximo 5 intentos)
   * Usa roomRepository para verificar existencia
   */
  async generateUniqueCode(maxRetries: number = 5): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();

      const exists = await roomRepository.codeExists(code);

      if (!exists) {
        return code;
      }
    }

    throw new Error(
      "No se pudo generar un código único después de varios intentos",
    );
  },

  /**
   * Crea una sala y agrega al creador como primer miembro
   * Usa transacción atómica para asegurar consistencia
   */
  async createRoom(userId: number, data: CreateRoomRequest): Promise<Room> {
    const client = await roomRepository.getClient();

    try {
      await client.query("BEGIN");

      // Generar código único
      const code = await this.generateUniqueCode();

      // Insertar sala usando repository
      const rawRoom = await roomRepository.createRoom(
        client,
        data.name,
        code,
        data.isPublic,
        data.maxMembers,
        userId,
      );

      // Insertar creador como primer miembro
      await roomRepository.addMember(client, rawRoom.id, userId);

      await client.query("COMMIT");

      return mapRawRoomToRoom(rawRoom);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Busca una sala por su código único
   */
  async findByCode(code: string): Promise<Room | null> {
    const rawRoom = await roomRepository.findByCode(code);
    return rawRoom ? mapRawRoomToRoom(rawRoom) : null;
  },

  /**
   * Lista salas públicas con búsqueda y paginación
   * Usa Redis para cachear resultados (30 segundos)
   * Obtiene miembros activos desde Redis SET room:{code}:members
   */
  async listPublicRooms(
    search?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<RoomListItem[]> {
    const redis = getRedis();
    const cacheKey = `public_rooms:${search || "all"}:${limit}:${offset}`;

    // Intentar obtener de caché
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached as string);
        }
      } catch (cacheError) {
        console.error("Cache read error:", cacheError);
      }
    }

    // Obtener de base de datos
    const rawRooms = await roomRepository.listPublicRooms(
      search,
      limit,
      offset,
    );

    // Obtener miembros activos desde Redis para cada sala
    const roomsWithMembers = await Promise.all(
      rawRooms.map(async (rawRoom) => {
        let activeMembers = 0;

        if (redis) {
          try {
            activeMembers =
              (await redis.sCard(`room:${rawRoom.code}:members`)) || 0;
          } catch (redisError) {
            console.error("Redis sCard error:", redisError);
          }
        }

        return {
          ...mapRawRoomToRoomListItem(rawRoom),
          activeMembers,
        };
      }),
    );

    // Guardar en caché por 30 segundos
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(roomsWithMembers), { EX: 30 });
      } catch (cacheError) {
        console.error("Cache write error:", cacheError);
      }
    }

    return roomsWithMembers;
  },
};

export { roomService };
