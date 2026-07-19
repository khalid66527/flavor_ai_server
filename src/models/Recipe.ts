import { Schema, model, Document } from "mongoose";

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
