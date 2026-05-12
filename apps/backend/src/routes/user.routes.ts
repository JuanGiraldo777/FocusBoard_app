import { Router } from "express";
import { verifyAccessToken } from "../middleware/auth.js";
import { userSettingsController } from "../controllers/user-settings.controller.js";

const router = Router();

router.get("/settings", verifyAccessToken, userSettingsController.getSettings);

export { router as userRouter };