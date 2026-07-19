import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
