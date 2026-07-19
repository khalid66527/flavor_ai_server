import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/User";
import { generateToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

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
