import { getRedis } from "../config/redis.ts";
import crypto from "crypto";
import type { CreateRoomRequest } from "../validators/room.validator.ts";
import {
  roomRepository,
  mapRawRoomToRoom,
  mapRawRoomToRoomListItem,
} from "../repositories/room.repository.ts";
import { createAppError } from "../types/errors.ts";
import {
  emitMemberLeftToRoom,
  emitRoomDeleted,
  emitToUser,
} from "../sockets/room.socket.ts";

type Room = ReturnType<typeof mapRawRoomToRoom>;
type RoomListItem = ReturnType<typeof mapRawRoomToRoomListItem> & {
  activeMembers: number;
};

const roomService = {
  /**
   * Genera un código único de 8 caracteres alfanuméricos
   * Usa crypto.randomBytes para alta entropía y verifica unicidad con repository
   * @param maxRetries - Máximo de intentos antes de lanzar error (default 5)
   * @returns Código único de 8 caracteres en mayúsculas
   * @throws Error si no se pudo generar código único tras los reintentos
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
   * Usa transacción atómica: genera código, inserta sala, agrega miembro
   * @param userId - ID del usuario que crea la sala (se vuelve owner)
   * @param data - Datos de la sala (name, isPublic, maxMembers)
   * @returns Room con todos los datos de la sala creada
   * @throws Error si falla la transacción de base de datos
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
   * @param code - Código de 8 caracteres de la sala
   * @returns Room o null si no existe
   */
  async findByCode(code: string): Promise<Room | null> {
    const rawRoom = await roomRepository.findByCode(code);
    return rawRoom ? mapRawRoomToRoom(rawRoom) : null;
  },

  /**
   * Lista salas públicas con búsqueda y paginación
   * Usa Redis para cachear resultados por 30 segundos
   * Obtiene miembros activos desde Redis SET room:{code}:members
   * @param search - Término de búsqueda por nombre (opcional)
   * @param limit - Máximo de resultados (default 20)
   * @param offset - Desplazamiento para paginación (default 0)
   * @returns Array de RoomListItem con activeMembers incluido
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

  /**
   * Une al usuario a una sala por código
   * Valida existencia, capacidad y membresía previa
   * Usa transacción atómica: INSERT + UPDATE last_activity
   * Actualiza SET de Redis con el nuevo userId
   * @param userId - ID del usuario que se une
   * @param code - Código de 8 caracteres de la sala
   * @returns Room con datos de la sala
   * @throws Error 404 si la sala no existe
   * @throws Error 409 si la sala está llena o ya es miembro
   */
  async joinRoom(userId: number, code: string): Promise<Room> {
    // 1. Buscar sala por código
    const rawRoom = await roomRepository.findByCode(code);
    if (!rawRoom) {
      throw createAppError("Sala no encontrada", 404);
    }

    // 2. Verificar capacidad (count < max_members)
    const memberCount = await roomRepository.countMembers(rawRoom.id);
    if (memberCount >= rawRoom.max_members) {
      throw createAppError("La sala está llena", 409);
    }

    // 3. Verificar que no sea ya miembro
    const isAlreadyMember = await roomRepository.isMember(rawRoom.id, userId);
    if (isAlreadyMember) {
      throw createAppError("Ya eres miembro de esta sala", 409);
    }

    // 4. Transacción atómica: INSERT + UPDATE last_activity
    const client = await roomRepository.getClient();
    try {
      await client.query("BEGIN");

      // Agregar miembro
      await roomRepository.addMemberTransactional(client, rawRoom.id, userId);

      // Actualizar last_activity dentro de la misma transacción
      await roomRepository.updateLastActivity(rawRoom.id, client);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // 5. Actualizar SET de Redis con el nuevo userId
    const redis = getRedis();
    if (redis) {
      try {
        await redis.sAdd(`room:${rawRoom.code}:members`, userId.toString());
      } catch (redisError) {
        console.error("Redis sAdd error:", redisError);
      }
    }

    return mapRawRoomToRoom(rawRoom);
  },

  /**
   * Elimina al usuario de room_members sin borrar historial pomodoro
   * Actualiza Redis removiendo al usuario del SET de miembros
   * Emite evento por socket para notificar a otros miembros
   * @param userId - ID del usuario que sale
   * @param code - Código de la sala
   * @throws Error 404 si la sala no existe
   * @throws Error 409 si el usuario no es miembro
   */
  async leaveRoom(userId: number, code: string): Promise<void> {
    const rawRoom = await roomRepository.findByCode(code);
    if (!rawRoom) {
      throw createAppError("Sala no encontrada", 404);
    }

    const client = await roomRepository.getClient();

    try {
      await client.query("BEGIN");

      const deletedCount = await roomRepository.removeMember(
        client,
        rawRoom.id,
        userId,
      );

      if (deletedCount === 0) {
        throw createAppError("No eres miembro de esta sala", 409);
      }

      await roomRepository.updateLastActivity(rawRoom.id, client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const redis = getRedis();
    if (redis) {
      try {
        await redis.sRem(`room:${rawRoom.code}:members`, userId.toString());
      } catch (redisError) {
        console.error("Redis sRem error:", redisError);
      }
    }

    emitMemberLeftToRoom(rawRoom.code, userId);
  },

  /**
   * Elimina sala completa. Solo owner puede ejecutar.
   * room_members se elimina por CASCADE en DB.
   * Limpia Redis (SET de miembros y caché) y emite eventos a todos los miembros
   * @param userId - ID del usuario (debe ser owner)
   * @param roomId - ID interno de la sala
   * @throws Error 404 si la sala no existe
   * @throws Error 403 si el usuario no es el owner
   */
  async deleteRoom(userId: number, roomId: number): Promise<void> {
    const rawRoom = await roomRepository.findById(roomId);
    if (!rawRoom) {
      throw createAppError("Sala no encontrada", 404);
    }

    if (rawRoom.owner_id !== userId) {
      throw createAppError("Solo el owner puede eliminar la sala", 403);
    }

    const client = await roomRepository.getClient();

    try {
      await client.query("BEGIN");

      const deletedCount = await roomRepository.deleteRoomById(client, roomId);
      if (deletedCount === 0) {
        throw createAppError("Sala no encontrada", 404);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const redis = getRedis();
    let memberIds: string[] = [];

    if (redis) {
      try {
        memberIds = await redis.sMembers(`room:${rawRoom.code}:members`);
      } catch (e) {
        console.warn("No se pudo leer miembros antes de borrar la sala:", e);
      }
    }

    if (redis) {
      try {
        await redis.del(`room:${rawRoom.code}:members`);
      } catch (redisError) {
        console.error("Redis del error:", redisError);
      }
    }

    // Notificar por sala (broadcast) y por usuario individualmente
    emitRoomDeleted(rawRoom.code);

    for (const id of memberIds) {
      const parsed = Number.parseInt(id, 10);
      if (Number.isFinite(parsed)) {
        emitToUser(parsed, "room:deleted", { code: rawRoom.code });
      }
    }
  },
};

export { roomService };
