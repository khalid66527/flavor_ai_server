import { Router } from "express";
import { UserController, updatePreferencesSchema } from "../controllers/user.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// All user routes are protected
router.use(protect);

router.get("/preferences", UserController.getPreferences);
router.put("/preferences", validate(updatePreferencesSchema), UserController.updatePreferences);

router.get("/saved", UserController.getSavedRecipes);
router.post("/save", UserController.saveRecipe);
router.post("/unsave", UserController.unsaveRecipe);

export default router;
