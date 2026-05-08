import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validateRegister, validateLogin } from "../middleware/validation.js";
import { rateLimitLogin } from "../middleware/rateLimit.js";
import { verifyAccessToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", validateRegister, authController.register);
authRouter.post("/login", rateLimitLogin, validateLogin, authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", verifyAccessToken, authController.me);
