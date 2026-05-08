import { Router } from "express";
import { cleanupInactiveRooms } from "../controllers/cron.controller.js";
import { validateCronSecret } from "../middleware/cron.validation.js";

/**
 * Rutas para trabajos programados (cron jobs)
 * Todas las rutas requieren el header x-cron-secret para autenticación
 */
const router = Router();

/**
 * GET /cleanup
 * Ejecuta limpieza de salas inactivas (last_activity < 24h)
 * Requiere header: x-cron-secret = env.CRON_SECRET
 */
router.get("/cleanup", validateCronSecret, cleanupInactiveRooms);

export { router as cronRouter };
