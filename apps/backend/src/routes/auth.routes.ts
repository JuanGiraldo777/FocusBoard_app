import { Router } from "express";
import { authController } from "../controllers/auth.controller.ts";
import { validateRegister, validateLogin } from "../middleware/validation.ts";
import { rateLimitLogin } from "../middleware/rateLimit.ts";
import { verifyAccessToken } from "../middleware/auth.ts";

export const authRouter = Router();

// POST /auth/register
authRouter.post("/register", validateRegister, authController.register);

// POST /auth/login
authRouter.post("/login", rateLimitLogin, validateLogin, authController.login);

// POST /auth/refresh
authRouter.post("/refresh", authController.refresh);

// POST /auth/logout
authRouter.post("/logout", authController.logout);

// GET /auth/me (protegido)
authRouter.get("/me", verifyAccessToken, authController.me);

// POST /auth/refresh
authRouter.post("/refresh", authController.refresh);

// POST /auth/logout
authRouter.post("/logout", authController.logout);
