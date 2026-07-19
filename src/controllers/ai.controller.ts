import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AIService } from "../services/ai.service";
import { RecommendationService } from "../services/recommendation.service";
import { ChatHistory, IChatMessage } from "../models/ChatHistory";
import { z } from "zod";

// Zod validation schemas
export const generateRecipeSchema = z.object({
  body: z.object({
    ingredients: z.array(z.string()).min(1, "Ingredients list cannot be empty"),
    cuisine: z.string().min(1, "Cuisine preference is required"),
    dietType: z.string().default("None"),
    length: z.string().optional().default("Medium"),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Message content is required"),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })
      )
      .optional()
      .default([]),
  }),
});

export class AIController {
  /**
   * Generates a new recipe using Gemini AI
   */
  public static async generateRecipe(req: any, res: any, next: any): Promise<void> {
    try {
      const { ingredients, cuisine, dietType, length, model } = req.body;

      const generatedRecipe = await AIService.generateRecipe(
        ingredients,
        cuisine,
        dietType,
        length,
        model
      );

      // Force mark as aiGenerated, but DO NOT save to database automatically
      generatedRecipe.aiGenerated = true;

      res.status(200).json({
        success: true,
        message: "AI Recipe generated successfully",
        data: generatedRecipe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerates a recipe (similar parameters but varies prompt/temperature internally)
   */
  public static async regenerate(req: any, res: any, next: any): Promise<void> {
    try {
      const { ingredients, cuisine, dietType, length, model } = req.body;

      // Pass flag to vary results (isRetry true or slightly different inputs)
      const regeneratedRecipe = await AIService.generateRecipe(
        ingredients,
        cuisine,
        dietType,
        length,
        model,
        true // causes slightly varied strict JSON schema prompt
      );

      regeneratedRecipe.aiGenerated = true;

      res.status(200).json({
        success: true,
        message: "AI Recipe regenerated successfully",
        data: regeneratedRecipe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Chef AI Chat bot streaming endpoint
   */
  public static async chat(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, history, model } = req.body;

      // Set headers for progressive streaming
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let completeResponseText = "";

      // Start streaming with AgentRouter
      await AIService.streamChat(message, history, model, (chunkText) => {
        completeResponseText += chunkText;
        res.write(chunkText);
      });

      // End response stream
      res.end();

      // If user is logged in, asynchronously update/save ChatHistory
      if (req.user) {
        const userId = req.user._id;
        const newMessages: IChatMessage[] = [
          { role: "user", content: message, timestamp: new Date() },
          { role: "assistant", content: completeResponseText, timestamp: new Date() },
        ];

        // Find existing history or create new
        const existingHistory = await ChatHistory.findOne({ userId });
        if (existingHistory) {
          existingHistory.messages.push(...newMessages);
          await existingHistory.save();
        } else {
          await ChatHistory.create({
            userId,
            messages: newMessages,
          });
        }
      }
    } catch (error) {
      // In a stream, if error occurs after headers are sent, we must close the response.
      if (res.headersSent) {
        res.write(`\n❌ Error streaming chatbot response`);
        res.end();
        return;
      }
      next(error);
    }
  }

  /**
   * Returns personalized recommendations based on user history and preferences
   */
  public static async getRecommendations(req: any, res: any, next: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized", statusCode: 401 });
        return;
      }

      // Fetch full user with interactions
      const recommendations = await RecommendationService.getRecommendations(req.user);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }
}
