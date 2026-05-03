import { Router } from "express";
import { verifyAccessToken } from "../middleware/auth.ts";
import {
  createRoom,
  getRoomByCode,
  listRooms,
} from "../controllers/room.controller.ts";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyAccessToken);

// POST /api/v1/rooms - Crear una nueva sala
router.post("/", createRoom);

// GET /api/v1/rooms - Listar salas públicas (con búsqueda y paginación)
router.get("/", listRooms);

// GET /api/v1/rooms/:code - Obtener sala por código
router.get("/:code", getRoomByCode);

export { router as roomRoutes };
