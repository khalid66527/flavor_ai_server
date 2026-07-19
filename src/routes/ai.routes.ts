import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AIController, generateRecipeSchema, chatSchema } from "../controllers/ai.controller";
import { protect, optionalProtect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// Rate limiter for AI routes: max 20 requests per 10 minutes
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: {
    success: false,
    message: "Too many AI requests from this user. Please try again after 10 minutes.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all AI endpoints
router.use(aiLimiter);

router.post("/generate-recipe", validate(generateRecipeSchema), AIController.generateRecipe);
router.post("/regenerate", validate(generateRecipeSchema), AIController.regenerate);
router.post("/chat", optionalProtect, validate(chatSchema), AIController.chat);
router.get("/recommendations", protect, AIController.getRecommendations);

export default router;
