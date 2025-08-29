// routes/authRoutes.js
import { Router } from "express";
import { loginWithPassword, forgotPassword, resetPassword } from "../controllers/authController.js";

const router = Router();
router.post("/auth/login", loginWithPassword);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

export default router;

