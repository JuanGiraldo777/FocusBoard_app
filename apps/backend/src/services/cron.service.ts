import { getRedis } from "../config/redis.ts";
import { roomRepository } from "../repositories/room.repository.ts";

/**
 * Servicio de trabajos programados (cron jobs)
 * Contiene la lógica para limpieza automática de salas inactivas
 */
const cronService = {
  /**
   * Elimina salas inactivas (last_activity < hace 24 horas)
   * También limpia las claves de Redis asociadas a esas salas
   * @returns Número de salas eliminadas
   */
  async cleanupInactiveRooms(): Promise<number> {
    const deletedRooms = await roomRepository.deleteInactiveRooms();

    if (deletedRooms.length === 0) {
      return 0;
    }

    const redis = getRedis();
    if (redis) {
      for (const room of deletedRooms) {
        try {
          await redis.del(`room:${room.code}:members`);
          await redis.del(`room:${room.code}:activity`);
        } catch (error) {
          console.error(`Redis cleanup error for room ${room.code}:`, error);
        }
      }
    }

    return deletedRooms.length;
  },
};

export { cronService };
