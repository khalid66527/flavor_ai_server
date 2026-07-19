import app, { env } from "./app";
import mongoose from "mongoose";

async function run() {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);

    if (process.env.VERCEL !== "1") {
      app.listen(env.PORT, () => {
        console.log(`🚀 FlavorAI Server running in dev mode on port ${env.PORT}`);
      });
    }
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

run().catch(console.dir);