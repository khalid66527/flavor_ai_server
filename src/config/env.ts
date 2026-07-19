import dotenv from "dotenv";
import { z } from "zod";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "../../.env") });

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

export const env = parsed.data;
