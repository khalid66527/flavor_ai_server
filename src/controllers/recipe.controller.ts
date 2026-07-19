import { Response, NextFunction } from "express";
import { Recipe, IRecipe } from "../models/Recipe";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { z } from "zod";
import { User } from "../models/User";

// Zod Validation schemas
export const createRecipeSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    shortDescription: z.string().min(1, "Short description is required"),
    fullDescription: z.string().min(1, "Full description is required"),
    ingredients: z.array(
      z.object({
        name: z.string(),
        quantity: z.string(),
      })
    ).min(1, "Ingredients list cannot be empty"),
    steps: z.array(z.string()).min(1, "Steps list cannot be empty"),
    cookTime: z.number().positive("Cook time must be a positive number"),
    servings: z.number().positive().default(4),
    cuisine: z.string().min(1, "Cuisine is required"),
    category: z.string().min(1, "Category is required"),
    dietType: z.string().default("None"),
    price: z.number().min(1).max(3).default(2),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const addReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(3, "Comment must be at least 3 characters"),
  }),
});

export class RecipeController {
  /**
   * Get all recipes with search, filtering, sorting, and pagination
   */
  public static async getRecipes(req: any, res: any, next: any): Promise<void> {
    try {
      const { search, category, cuisine, dietType, sort, page = "1", limit = "12" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build query filters
      const queryFilters: any = {};

      if (search) {
        // Safe regex search
        const regexSearch = new RegExp(search as string, "i");
        queryFilters.$or = [
          { title: regexSearch },
          { shortDescription: regexSearch },
          { fullDescription: regexSearch },
        ];
      }

      if (category) queryFilters.category = category;
      if (cuisine) queryFilters.cuisine = cuisine;
      if (dietType && dietType !== "None") queryFilters.dietType = dietType;

      // Build sorting configuration
      let sortConfig: any = { createdAt: -1 }; // default newest first
      if (sort === "rating") {
        sortConfig = { rating: -1 };
      } else if (sort === "newest") {
        sortConfig = { createdAt: -1 };
      } else if (sort === "cookTime") {
        sortConfig = { cookTime: 1 };
      }

      // Execute query
      const totalCount = await Recipe.countDocuments(queryFilters);
      const recipes = await Recipe.find(queryFilters)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "name avatar");

      const totalPages = Math.ceil(totalCount / limitNum);

      res.status(200).json({
        success: true,
        data: {
          recipes,
          totalPages,
          currentPage: pageNum,
          totalCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single recipe by ID (populates reviews and lists 4 related recipes)
   */
  public static async getRecipeById(req: any, res: any, next: any): Promise<void> {
    try {
      const { id } = req.params;

      const recipe = await Recipe.findById(id)
        .populate("createdBy", "name avatar")
        .populate("reviews.user", "name avatar");

      if (!recipe) {
        res.status(404).json({
          success: false,
          message: "Recipe not found",
          statusCode: 404,
        });
        return;
      }

      // Log view interaction history if authenticated
      // Wait, in Next.js backend, this is optional, but let's check: if req.headers.authorization, we can log it!
      // But we can do it when the profile endpoint or protected routes are hit.

      // Get 4 related recipes (same category, excluding self)
      const relatedRecipes = await Recipe.find({
        category: recipe.category,
        _id: { $ne: recipe._id },
      })
        .limit(4)
        .populate("createdBy", "name avatar");

      res.status(200).json({
        success: true,
        data: {
          recipe,
          relatedRecipes,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new recipe (protected)
   */
  public static async createRecipe(req: AuthenticatedRequest, res: any, next: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const recipeData = {
        ...req.body,
        createdBy: req.user._id,
        aiGenerated: req.body.aiGenerated || false,
      };

      const recipe = await Recipe.create(recipeData);

      // Log recipe creation interaction
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          interactionHistory: {
            recipeId: recipe._id,
            action: "save",
            timestamp: new Date(),
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Recipe created successfully",
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recipe (protected, only creator can update)
   */
  public static async updateRecipe(req: AuthenticatedRequest, res: any, next: any): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const recipe = await Recipe.findById(id);
      if (!recipe) {
        res.status(404).json({ success: false, message: "Recipe not found", statusCode: 404 });
        return;
      }

      // Check ownership
      if (recipe.createdBy.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: "Forbidden: You are not the creator of this recipe",
          statusCode: 403,
        });
        return;
      }

      const updatedRecipe = await Recipe.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        message: "Recipe updated successfully",
        data: updatedRecipe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete recipe (protected, only creator can delete)
   */
  public static async deleteRecipe(req: AuthenticatedRequest, res: any, next: any): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const recipe = await Recipe.findById(id);
      if (!recipe) {
        res.status(404).json({ success: false, message: "Recipe not found", statusCode: 404 });
        return;
      }

      // Check ownership
      if (recipe.createdBy.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: "Forbidden: You are not authorized to delete this recipe",
          statusCode: 403,
        });
        return;
      }

      await recipe.deleteOne();

      res.status(200).json({
        success: true,
        message: "Recipe deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recipes created by current user
   */
  public static async getUserRecipes(req: AuthenticatedRequest, res: any, next: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const recipes = await Recipe.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Post reviews and rating (protected)
   */
  public static async addReview(req: AuthenticatedRequest, res: any, next: any): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      const recipe = await Recipe.findById(id);
      if (!recipe) {
        res.status(404).json({ success: false, message: "Recipe not found", statusCode: 404 });
        return;
      }

      // Add review to array
      recipe.reviews.push({
        user: req.user._id,
        comment,
        rating,
        date: new Date(),
      });

      // Recalculate average rating and ratingCount
      recipe.ratingCount = recipe.reviews.length;
      const totalRatings = recipe.reviews.reduce((acc, curr) => acc + curr.rating, 0);
      recipe.rating = parseFloat((totalRatings / recipe.ratingCount).toFixed(1));

      await recipe.save();

      // Log review interaction
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          interactionHistory: {
            recipeId: recipe._id,
            action: "review",
            timestamp: new Date(),
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Review added successfully",
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }
}
