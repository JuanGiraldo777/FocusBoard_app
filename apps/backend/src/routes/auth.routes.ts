import { Router } from "express";
import { authController } from "../controllers/auth.controller.ts";
import { validateRegister, validateLogin } from "../middleware/validation.ts";
import { rateLimitLogin } from "../middleware/rateLimit.ts";
import { verifyAccessToken } from "../middleware/auth.ts";

export const authRouter = Router();

authRouter.post("/register", validateRegister, authController.register);
authRouter.post("/login", rateLimitLogin, validateLogin, authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", verifyAccessToken, authController.me);
