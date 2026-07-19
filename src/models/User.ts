import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

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
