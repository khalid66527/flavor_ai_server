import { Router } from "express";
import passport from "passport";
import { AuthController, registerSchema, loginSchema } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.get("/demo-login", AuthController.demoLogin);
router.get("/me", protect, AuthController.getMe);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/signin?error=oauth_failed", session: false }),
  AuthController.googleCallback
);

export default router;
