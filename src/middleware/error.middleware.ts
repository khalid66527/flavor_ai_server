import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate value entered for a unique field";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found with id of ${(err as any).value}`;
  }

  console.error("🔥 Error logged:", err);

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
};
