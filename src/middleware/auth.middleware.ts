import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, IUser } from "../models/User";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: any,
  res: any,
  next: any
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized to access this route, token missing",
        statusCode: 401,
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not found with this token",
          statusCode: 401,
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Not authorized, token invalid or expired",
        statusCode: 401,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const optionalProtect = async (
  req: any,
  res: any,
  next: any
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token decoding errors for guests
    }
    next();
  } catch (error) {
    next(error);
  }
};
