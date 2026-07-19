import { Response, NextFunction } from "express";
import { User } from "../models/User";
import { Recipe } from "../models/Recipe";
import { z } from "zod";

// Zod schemas
export const updatePreferencesSchema = z.object({
  body: z.object({
    dietType: z.string().default("None"),
    allergies: z.array(z.string()).default([]),
    favoriteCuisines: z.array(z.string()).default([]),
  }),
});

export class UserController {
  /**
   * Get user preferences
   */
  public static async getPreferences(req: any, res: any, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }
      res.status(200).json({
        success: true,
        data: req.user.preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user preferences
   */
  public static async updatePreferences(req: any, res: any, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const { dietType, allergies, favoriteCuisines } = req.body;

      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found", statusCode: 404 });
        return;
      }

      user.preferences = {
        dietType,
        allergies,
        favoriteCuisines,
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: "Preferences updated successfully",
        data: user.preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get saved recipes for user
   */
  public static async getSavedRecipes(req: any, res: any, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const user = await User.findById(req.user._id).populate({
        path: "savedRecipes",
        populate: { path: "createdBy", select: "name avatar" },
      });

      if (!user) {
        res.status(404).json({ success: false, message: "User not found", statusCode: 404 });
        return;
      }

      res.status(200).json({
        success: true,
        data: user.savedRecipes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save/favorite a recipe
   */
  public static async saveRecipe(req: any, res: any, next: NextFunction): Promise<void> {
    try {
      const { recipeId } = req.body;
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        res.status(404).json({ success: false, message: "Recipe not found", statusCode: 404 });
        return;
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found", statusCode: 404 });
        return;
      }

      // Check if already saved
      const isAlreadySaved = user.savedRecipes.some(
        (id) => id.toString() === recipeId
      );

      if (!isAlreadySaved) {
        user.savedRecipes.push(recipe._id);
      }

      // Push to interaction history
      user.interactionHistory.push({
        recipeId: recipe._id,
        action: "save",
        timestamp: new Date(),
      });

      await user.save();

      res.status(200).json({
        success: true,
        message: "Recipe saved successfully",
        data: user.savedRecipes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unsave/unfavorite a recipe
   */
  public static async unsaveRecipe(req: any, res: any, next: NextFunction): Promise<void> {
    try {
      const { recipeId } = req.body;
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found", statusCode: 404 });
        return;
      }

      // Pull from saved recipes
      user.savedRecipes = user.savedRecipes.filter(
        (id) => id.toString() !== recipeId
      );

      await user.save();

      res.status(200).json({
        success: true,
        message: "Recipe unsaved successfully",
        data: user.savedRecipes,
      });
    } catch (error) {
      next(error);
    }
  }
}
