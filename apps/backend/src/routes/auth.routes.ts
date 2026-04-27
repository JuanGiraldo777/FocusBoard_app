import { Router } from "express";
import { authController } from "../controllers/auth.controller.ts";
import { validateRegister } from "../middleware/validation.ts";

export const authRouter = Router();

// POST /auth/register
authRouter.post("/register", validateRegister, authController.register);
