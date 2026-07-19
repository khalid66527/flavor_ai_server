import { Router } from "express";
import { RecipeController, createRecipeSchema, addReviewSchema } from "../controllers/recipe.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.get("/", RecipeController.getRecipes);
router.get("/user/mine", protect, RecipeController.getUserRecipes);
router.get("/:id", RecipeController.getRecipeById);

router.post("/", protect, validate(createRecipeSchema), RecipeController.createRecipe);
router.put("/:id", protect, RecipeController.updateRecipe);
router.delete("/:id", protect, RecipeController.deleteRecipe);

router.post("/:id/reviews", protect, validate(addReviewSchema), RecipeController.addReview);

export default router;
