import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { AuthenticatedRequest } from "../types";
import { sendErrorResponse } from "../utils/errorHandler";

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendErrorResponse(res, new Error("No token provided"), 401);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      sendErrorResponse(res, new Error("Invalid token"), 401);
      return;
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email || "",
      role: "user", // You can extend this based on your user roles
    };

    next();
  } catch (error) {
    sendErrorResponse(res, new Error("Authentication failed"), 401);
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(); // Continue without authentication
      return;
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email || "",
        role: "user",
      };
    }

    next();
  } catch (error) {
    next(); // Continue without authentication
  }
};
