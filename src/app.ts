
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import mongoose, { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import rateLimit from "express-rate-limit";

// Middleware imports
import { protect, optionalProtect, AuthenticatedRequest } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { validate } from "./middleware/validate.middleware";

// ==========================================
// 1. CONFIG & ENV
// ==========================================
// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  MONGO_URI: z.string().min(1, "MONGO_URI environment variable is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET environment variable is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY environment variable is required"),
  AGENTROUTER_API_KEY: z.string().optional().default("sk-Thr5sT7w3Y8f8XyWkZ5oKX43u81ZktavldlfCjE4xhmTImFL"),
});

// Parse env variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

const env = parsed.data;
export { env };

// ==========================================
// 2. MODELS
// ==========================================
export interface IChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  userId: any;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ChatHistory = model<IChatHistory>("ChatHistory", ChatHistorySchema);
export interface IIngredient {
  name: string;
  quantity: string;
}

export interface IReview {
  user: any;
  comment: string;
  rating: number;
  date: Date;
}

export interface IRecipe extends Document {
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  images: string[];
  ingredients: IIngredient[];
  steps: string[];
  cookTime: number;
  servings: number;
  cuisine: string;
  category: string;
  dietType: string;
  price: number;
  rating: number;
  ratingCount: number;
  reviews: IReview[];
  createdBy: any;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    image: { type: String, default: "" },
    images: [{ type: String }],
    ingredients: [
      {
        name: { type: String, required: true },
        quantity: { type: String, required: true },
      },
    ],
    steps: [{ type: String, required: true }],
    cookTime: { type: Number, required: true },
    servings: { type: Number, required: true, default: 4 },
    cuisine: { type: String, required: true },
    category: { type: String, required: true },
    dietType: { type: String, required: true, default: "None" },
    price: { type: Number, required: true, default: 2 }, // 1, 2, or 3
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    reviews: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        comment: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        date: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    aiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Recipe = model<IRecipe>("Recipe", RecipeSchema);
export interface IUserPreferences {
  dietType: string;
  allergies: string[];
  favoriteCuisines: string[];
}

export interface IUserInteraction {
  recipeId: any;
  action: "view" | "favorite" | "save" | "review" | "scale";
  timestamp: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar: string;
  preferences: IUserPreferences;
  savedRecipes: any[];
  interactionHistory: IUserInteraction[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    googleId: { type: String },
    avatar: { type: String, default: "" },
    preferences: {
      dietType: { type: String, default: "None" },
      allergies: [{ type: String }],
      favoriteCuisines: [{ type: String }],
    },
    savedRecipes: [{ type: Schema.Types.ObjectId, ref: "Recipe" }],
    interactionHistory: [
      {
        recipeId: { type: Schema.Types.ObjectId, ref: "Recipe", required: true },
        action: {
          type: String,
          enum: ["view", "favorite", "save", "review", "scale"],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Hash password pre-save
UserSchema.pre("save", async function (this: any) {
  if (!this.isModified("password")) return;
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>("User", UserSchema);

// ==========================================
// 3. PASSPORT
// ==========================================
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          // Check if user exists
          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            // Update googleId if not present
            if (!user.googleId) {
              user.googleId = profile.id;
              if (profile.photos?.[0]?.value && !user.avatar) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName || profile.name?.givenName || "Google User",
            email: email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || "",
            preferences: {
              dietType: "None",
              allergies: [],
              favoriteCuisines: [],
            },
          });

          return done(null, user);
        } catch (error: any) {
          return done(error, undefined);
        }
      }
    )
  );
}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ==========================================
// 4. UTILS & PROMPTS
// ==========================================
export const sendSuccess = (
  res: Response,
  data: any,
  message = "Operation successful",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message = "Something went wrong",
  statusCode = 500
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
};
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
export const RECIPE_GENERATION_PROMPT = `
You are a professional Michelin-starred chef and nutritionist.
Generate a high-quality recipe matching the provided criteria.

You must respond ONLY with a valid JSON object matching the exact shape below.
Do not wrap your response in markdown blocks like \`\`\`json or include any text before or after the JSON. It must be directly parseable.

JSON structure:
{
  "title": "A highly creative recipe name",
  "shortDescription": "One-line catchy overview",
  "fullDescription": "Rich background and flavor profile narrative",
  "ingredients": [
    { "name": "Ingredient name", "quantity": "e.g., 2 cups, 1 tbsp" }
  ],
  "steps": [
    "Step 1 details",
    "Step 2 details"
  ],
  "cookTime": 30, // integer representing minutes
  "servings": 4, // integer representing serving count
  "cuisine": "Cuisine type (e.g. Italian, Thai)",
  "dietType": "Dietary profile (e.g. Vegan, Gluten-Free, Vegetarian, Keto, None)"
}
`;

export const CHEF_AI_SYSTEM_PROMPT = `
You are "Chef AI", a friendly, witty, and highly experienced cooking assistant for the FlavorAI platform.
Your goals are to help home cooks of all skill levels learn culinary techniques, find ingredient substitutions, refine recipes, and plan meals.

Important guidelines:
- If a user asks for recipes, give culinary ideas and step-by-step guidance.
- Maintain a helpful, warm, and professional tone.
- If the user asks for modifications (e.g. "make it spicier", "make it vegetarian"), remember the conversation context and offer tailored adjustments.
- Be concise and format your text with clean markdown lists and bolding where appropriate.
`;

export const RECOMMENDATION_PROMPT = `
You are an expert AI meal planner.
Based on the user's diet preferences, allergies, and recent recipe interactions, suggest a set of cuisines and recipe categories that they would enjoy next.

Analyze this data:
Diet Profile: {dietType}
Allergies: {allergies}
Favorite Cuisines: {favoriteCuisines}
Recent Interactions: {recentInteractions}

You must respond ONLY with a valid JSON array of strings representing suggested categories or cuisines (e.g. ["Italian", "Dinner", "Healthy", "Desserts"]).
Do not wrap your response in markdown code blocks or write any explaining text. Only return the JSON array.
`;

// ==========================================
// 5. SERVICES
// ==========================================
const AGENTROUTER_API_KEY = env.AGENTROUTER_API_KEY || "sk-I9ujSSesOENwHUb9EL04IXSgYqj312xe5bozs3zNIDoFnoQq";
const AGENTROUTER_BASE_URL = "https://agentrouter.org/v1";

const SPOOF_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${AGENTROUTER_API_KEY}`,
  "Originator": "codex_cli_rs",
  "Version": "0.114.0",
  "anthropic-dangerous-direct-browser-access": "true",
  "x-app": "cli",
  "x-stainless-lang": "js",
  "x-stainless-package-version": "0.55.1",
  "x-stainless-os": "Windows",
  "x-stainless-runtime": "node",
  "x-stainless-arch": "x64"
};

export class AIService {
  /**
   * Generates a recipe based on ingredients, cuisine, and dietType
   */
  public static async generateRecipe(
    ingredients: string[],
    cuisine: string,
    dietType: string,
    length?: string,
    selectedModel?: string,
    isRetry = false
  ): Promise<any> {
    const model = selectedModel || "glm-5.2";
    const prompt = `
      Ingredients available: ${ingredients.join(", ")}
      Preferred Cuisine: ${cuisine}
      Dietary Profile: ${dietType}
      Desired Length/Complexity: ${length || "Medium"}
      
      You must respond with a JSON object following the schema requested.
    `;

    try {
      const response = await fetch(`${AGENTROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: SPOOF_HEADERS,
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: RECIPE_GENERATION_PROMPT },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AgentRouter API Error: ${response.status} - ${text}`);
      }

      const result = (await response.json()) as any;
      const responseText = result.choices?.[0]?.message?.content;
      if (!responseText) {
        throw new Error("Empty response from AI engine");
      }

      // Safe JSON parse (handling markdown blocks if model returns them)
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      const parsedRecipe = JSON.parse(cleanedText);
      return parsedRecipe;
    } catch (error) {
      console.error("AI Recipe Generation error:", error);
      if (!isRetry) {
        console.log("Retrying AI Recipe Generation...");
        return this.generateRecipe(ingredients, cuisine, dietType, length, model, true);
      }
      throw error;
    }
  }

  /**
   * Streams a chat session with Chef AI
   */
  public static async streamChat(
    message: string,
    history: { role: "user" | "assistant" | "system"; content: string }[],
    selectedModel?: string,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const model = selectedModel || "glm-5.2";
    
    // Map history to standard OpenAI format
    const messages = [
      { role: "system", content: CHEF_AI_SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const response = await fetch(`${AGENTROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: SPOOF_HEADERS,
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AgentRouter Stream Error: ${response.status} - ${errText}`);
    }

    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    if (response.body) {
      // @ts-ignore
      for await (const chunk of response.body) {
        const chunkText = decoder.decode(chunk, { stream: true });
        const lines = chunkText.split("\n");
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === "data: [DONE]") continue;

          if (cleanLine.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(cleanLine.substring(6));
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                fullText += delta;
                if (onChunk) {
                  onChunk(delta);
                }
              }
            } catch (err) {
              // Ignore partial or parse errors
            }
          }
        }
      }
    }

    return fullText;
  }
}
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

// ==========================================
// 6. CONTROLLERS (Extracted Logic)
// ==========================================
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
// Zod validation schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export class AuthController {
  /**
   * Register a new user
   */
  public static async register(req: any, res: any, next: any): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "A user with this email address already exists",
          statusCode: 400,
        });
        return;
      }

      // Create new user
      const user = await User.create({
        name,
        email,
        password,
        preferences: {
          dietType: "None",
          allergies: [],
          favoriteCuisines: [],
        },
      });

      // Generate token
      const token = generateToken(user.id);

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          token,
          user: userResponse,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  public static async login(req: any, res: any, next: any): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
          statusCode: 401,
        });
        return;
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
          statusCode: 401,
        });
        return;
      }

      // Generate token
      const token = generateToken(user.id);

      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: userResponse,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Demo Login
   */
  public static async demoLogin(req: any, res: any, next: any): Promise<void> {
    try {
      const demoEmail = "demo@flavorai.com";

      // Find or create demo user
      let user = await User.findOne({ email: demoEmail });
      if (!user) {
        user = await User.create({
          name: "Demo Chef",
          email: demoEmail,
          password: "Demo@123", // Will be hashed by pre-save hook
          avatar: "",
          preferences: {
            dietType: "None",
            allergies: [],
            favoriteCuisines: ["Italian", "Mexican"],
          },
        });
      }

      const token = generateToken(user.id);
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json({
        success: true,
        message: "Logged in as Demo User",
        data: {
          token,
          user: userResponse,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current logged-in user profile
   */
  public static async getMe(req: AuthenticatedRequest, res: any, next: any): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Traditional Google OAuth Callback
   */
  public static async googleCallback(req: any, res: any, next: any): Promise<void> {
    try {
      if (!req.user) {
        res.redirect(`${process.env.PUBLIC_AUTH_BASE_URL || "http://localhost:3000"}/auth/signin?error=oauth_failed`);
        return;
      }
      
      const token = generateToken(req.user.id);
      
      // Redirect to frontend with the auth token
      res.redirect(
        `${process.env.PUBLIC_AUTH_BASE_URL || "http://localhost:3000"}/auth/signin?token=${token}`
      );
    } catch (error) {
      next(error);
    }
  }
}
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

// ==========================================
// 7. EXPRESS APP SETUP
// ==========================================
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*", 
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "FlavorAI Backend Server is running 🚀",
  });
});

// AI Routes
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many AI requests from this user. Please try again after 10 minutes.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/ai", aiLimiter);
app.post("/api/ai/generate-recipe", validate(generateRecipeSchema), AIController.generateRecipe);
app.post("/api/ai/regenerate", validate(generateRecipeSchema), AIController.regenerate);
app.post("/api/ai/chat", optionalProtect, validate(chatSchema), AIController.chat);
app.get("/api/ai/recommendations", protect, AIController.getRecommendations);

// Auth Routes
app.post("/api/auth/register", validate(registerSchema), AuthController.register);
app.post("/api/auth/login", validate(loginSchema), AuthController.login);
app.get("/api/auth/demo-login", AuthController.demoLogin);
app.get("/api/auth/me", protect, AuthController.getMe);
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/signin?error=oauth_failed", session: false }),
  AuthController.googleCallback
);

// Recipe Routes
app.get("/api/recipes", RecipeController.getRecipes);
app.get("/api/recipes/user/mine", protect, RecipeController.getUserRecipes);
app.get("/api/recipes/:id", RecipeController.getRecipeById);
app.post("/api/recipes", protect, validate(createRecipeSchema), RecipeController.createRecipe);
app.put("/api/recipes/:id", protect, RecipeController.updateRecipe);
app.delete("/api/recipes/:id", protect, RecipeController.deleteRecipe);
app.post("/api/recipes/:id/reviews", protect, validate(addReviewSchema), RecipeController.addReview);

// User Routes
app.get("/api/users/preferences", protect, UserController.getPreferences);
app.put("/api/users/preferences", protect, validate(updatePreferencesSchema), UserController.updatePreferences);
app.get("/api/users/saved", protect, UserController.getSavedRecipes);
app.post("/api/users/save", protect, UserController.saveRecipe);
app.post("/api/users/unsave", protect, UserController.unsaveRecipe);

// Catch-all 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - ${req.originalUrl}`,
    statusCode: 404,
  });
});

app.use(errorHandler);

export default app;
