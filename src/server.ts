import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/error.middleware";

// Import strategies
import "./config/passport";

import authRoutes from "./routes/auth.routes";
import recipeRoutes from "./routes/recipe.routes";
import aiRoutes from "./routes/ai.routes";
import userRoutes from "./routes/user.routes";

connectDB();

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: "*", // Adjust to specific frontend origin in production
    credentials: true,
  })
);

// Logging and request parsing
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Root test route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "FlavorAI Backend Server is running 🚀",
  });
});

// Register api routes
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);

// Catch-all route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - ${req.originalUrl}`,
    statusCode: 404,
  });
});

// Global Error Handling Middleware
app.use(errorHandler);

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`🚀 FlavorAI Server running in dev mode on port ${env.PORT}`);
});

export default app;
export { server };