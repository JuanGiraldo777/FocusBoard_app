import { Server as SocketIOServer, Socket } from "socket.io";
import { getRedis } from "../config/redis.ts";

interface RoomMember {
  userId: number;
  socketId: string;
  status: "focusing" | "break" | "idle";
}

type SocketUser = {
  id: number;
  email: string;
};

type SocketWithUserData = Socket & { data: { user?: SocketUser } };

// Mapa en memoria: socket.id → { code, userId }
const socketRoomMap = new Map<string, { code: string; userId: number }>();
let roomIo: SocketIOServer | null = null;

const emitMemberLeft = (code: string, userId: number, socketId: string) => {
  if (!roomIo) {
    return;
  }

  const payload = { userId, socketId };
  roomIo.to(`room:${code}`).emit("member:left", payload);
  roomIo.to(`room:${code}`).emit("room:memberLeft", payload);
};

export const emitMemberLeftToRoom = (
  code: string,
  userId: number,
  socketId: string = "api:leave",
): void => {
  emitMemberLeft(code, userId, socketId);
};

export const emitRoomDeleted = (code: string): void => {
  if (!roomIo) {
    return;
  }

  roomIo.to(`room:${code}`).emit("room:deleted", { code });
};

export const emitToUser = (
  userId: number,
  event: string,
  payload: unknown,
): void => {
  if (!roomIo) return;
  try {
    roomIo.to(`user:${userId}`).emit(event, payload);
  } catch (e) {
    console.warn("emitToUser failed:", e);
  }
};

export const setupRoomSockets = (io: SocketIOServer) => {
  roomIo = io;

  io.on("connection", (socket: Socket) => {
    const socketWithData = socket as SocketWithUserData;
    // Unir socket a room por usuario para emisiones personales
    const connectedUserId = socketWithData.data.user?.id;
    if (connectedUserId) {
      try {
        socket.join(`user:${connectedUserId}`);
      } catch (e) {
        console.warn("No se pudo unir socket a user room:", e);
      }
    }

    // Unirse a una sala (usar usuario autenticado en socket.data)
    socket.on("room:join", async (data: { code: string }) => {
      try {
        const { code } = data;
        const userId = socketWithData.data.user?.id;

        if (!userId) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        // Guardar mapeo socket.id → { code, userId }
        socketRoomMap.set(socket.id, { code, userId });

        // Mapeo global en Redis: user:{userId}:sockets -> set de socketIds
        const redisForSockets = getRedis();
        if (redisForSockets) {
          try {
            await redisForSockets.sAdd(`user:${userId}:sockets`, socket.id);
          } catch (e) {
            console.warn("No se pudo actualizar user sockets en Redis:", e);
          }
        }

        // Unirse a la sala de Socket.io
        socket.join(`room:${code}`);

        // Obtener miembros de Redis SET room:{code}:members
        const redis = getRedis();
        let members: RoomMember[] = [];

        if (redis) {
          try {
            // Agregar usuario actual al SET
            await redis.sAdd(`room:${code}:members`, userId.toString());

            // Obtener todos los miembros actualizados
            const updatedMemberIds = await redis.sMembers(
              `room:${code}:members`,
            );
            members = updatedMemberIds.map((id: string) => ({
              userId: parseInt(id, 10),
              socketId: socket.id, // Simplificado por instancia
              status: "idle" as const,
            }));
          } catch (redisError) {
            console.error("Redis sMembers error:", redisError);
          }
        } else {
          // Fallback cuando Redis no esta disponible.
          members = [{ userId, socketId: socket.id, status: "idle" as const }];
        }

        // Notificar a otros en la sala
        socket.to(`room:${code}`).emit("room:memberJoined", {
          userId,
          socketId: socket.id,
          status: "idle" as const,
        });

        // Enviar lista actual de miembros
        socket.emit("room:members", members);
      } catch (error) {
        console.error("Error joining room via socket:", error);
      }
    });

    // Salir de una sala
    socket.on("room:leave", async (data: { code: string }) => {
      try {
        const { code } = data;
        const userId = socketWithData.data.user?.id;

        if (!userId) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        socket.leave(`room:${code}`);

        // Remover del mapa
        socketRoomMap.delete(socket.id);

        // Remover socketId de mapeo global de usuario
        const redisForSockets = getRedis();
        if (redisForSockets) {
          try {
            await redisForSockets.sRem(`user:${userId}:sockets`, socket.id);
          } catch (e) {
            console.warn("No se pudo limpiar user sockets en Redis:", e);
          }
        }

        // Remover de Redis SET room members
        const redis = getRedis();
        if (redis) {
          await redis.sRem(`room:${code}:members`, userId.toString());
        }

        emitMemberLeft(code, userId, socket.id);
      } catch (error) {
        console.error("Error leaving room via socket:", error);
      }
    });

    // Heartbeat: ping del cliente
    socket.on("room:ping", (data: { code: string }) => {
      const userId = socketWithData.data.user?.id;
      // El servidor recibe ping cada 25s
      // Si no recibe ping en 30s, marca como desconectado
    });

    // Desconexión
    socket.on("disconnect", async () => {
      try {
        // Obtener info de la sala desde el mapa
        const roomInfo = socketRoomMap.get(socket.id);

        if (roomInfo) {
          const { code, userId } = roomInfo;

          // Remover socketId de mapeo global de usuario
          const redisForSockets = getRedis();
          if (redisForSockets) {
            try {
              await redisForSockets.sRem(`user:${userId}:sockets`, socket.id);
            } catch (e) {
              console.warn("No se pudo limpiar user sockets en Redis:", e);
            }
          }

          // Remover de Redis SET room members
          const redis = getRedis();
          if (redis) {
            await redis.sRem(`room:${code}:members`, userId.toString());
          }

          // Notificar a otros en la sala
          emitMemberLeft(code, userId, socket.id);

          // Limpiar mapa
          socketRoomMap.delete(socket.id);
        }
      } catch (error) {
        console.error("Error handling socket disconnect:", error);
      }
    });
  });
};
