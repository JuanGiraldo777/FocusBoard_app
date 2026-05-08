import { Router } from "express";
import { verifyAccessToken } from "../middleware/auth.js";
import {
  createRoom,
  deleteRoom,
  getRoomByCode,
  leaveRoom,
  listRooms,
  joinRoom,
} from "../controllers/room.controller.js";
import {
  validateCreateRoom,
  validateListRoomsQuery,
  validateRoomCodeParams,
  validateRoomIdParams,
} from "../middleware/room.validation.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyAccessToken);

// POST /api/v1/rooms - Crear una nueva sala
router.post("/", validateCreateRoom, createRoom);

// POST /api/v1/rooms/:code/join - Unirse a una sala
router.post("/:code/join", validateRoomCodeParams, joinRoom);

// DELETE /api/v1/rooms/:code/leave - Salir de una sala
router.delete("/:code/leave", validateRoomCodeParams, leaveRoom);

// DELETE /api/v1/rooms/:id - Eliminar sala (solo owner)
router.delete("/:id", validateRoomIdParams, deleteRoom);

// GET /api/v1/rooms - Listar salas públicas (con búsqueda y paginación)
router.get("/", validateListRoomsQuery, listRooms);

// GET /api/v1/rooms/:code - Obtener sala por código
router.get("/:code", validateRoomCodeParams, getRoomByCode);

export { router as roomRoutes };
