import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { Recipe } from "../models/Recipe";
import { IUser } from "../models/User";
import { RECOMMENDATION_PROMPT } from "../utils/prompts";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export class RecommendationService {
  /**
   * Generates recipe recommendations based on user preferences and history
   */
  public static async getRecommendations(user: IUser): Promise<any[]> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      // Get last 5 interaction history entries
      const recentInteractions = user.interactionHistory
        .slice(-5)
        .map((entry) => ({
          recipeId: entry.recipeId.toString(),
          action: entry.action,
          timestamp: entry.timestamp,
        }));

      const prompt = RECOMMENDATION_PROMPT
        .replace("{dietType}", user.preferences.dietType || "None")
        .replace("{allergies}", JSON.stringify(user.preferences.allergies || []))
        .replace(
          "{favoriteCuisines}",
          JSON.stringify(user.preferences.favoriteCuisines || [])
        )
        .replace("{recentInteractions}", JSON.stringify(recentInteractions));

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText) {
        throw new Error("Failed to receive recommendations from AI engine");
      }

      // Array of keywords (cuisines/categories) suggested by AI
      const keywords: string[] = JSON.parse(responseText.trim());
      if (!Array.isArray(keywords) || keywords.length === 0) {
        // Fallback to favorite cuisines or general if empty
        const fallbackCuisines = user.preferences.favoriteCuisines.length > 0
          ? user.preferences.favoriteCuisines
          : ["Italian", "Mexican", "Asian", "American"];
        return Recipe.find({
          $or: [
            { cuisine: { $in: fallbackCuisines } },
            { dietType: user.preferences.dietType || "None" }
          ]
        }).limit(8);
      }

      // Query database for matching recipes
      // Exclude recipes created by user? The prompt says "Use this to query Recipe collection (match category/cuisine) and return matching recipes (limit 8)."
      const matchedRecipes = await Recipe.find({
        $or: [
          { cuisine: { $in: keywords } },
          { category: { $in: keywords } },
          { dietType: user.preferences.dietType || "None" },
        ],
      })
        .limit(8)
        .populate("createdBy", "name avatar");

      return matchedRecipes;
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      // Return general popular recipes as fallback
      return Recipe.find().sort({ rating: -1 }).limit(8).populate("createdBy", "name avatar");
    }
  }
}
