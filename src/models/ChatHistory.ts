import { Schema, model, Document } from "mongoose";

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
