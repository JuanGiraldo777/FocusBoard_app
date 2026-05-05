import { Router } from "express";
import { cleanupInactiveRooms } from "../controllers/cron.controller.ts";
import { validateCronSecret } from "../middleware/cron.validation.ts";

const router = Router();

router.get("/cleanup", validateCronSecret, cleanupInactiveRooms);

export { router as cronRouter };
