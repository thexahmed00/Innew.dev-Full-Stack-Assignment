import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import routes
import userRoutes from "./routes/userRoutes";
import postRoutes from "./routes/postRoutes";
import stripeRoutes, { webhookHandler } from "./routes/stripeRoutes";

// Import middleware
import { globalErrorHandler, notFoundHandler } from "./utils/errorHandler";
import { rateLimiter } from "./middleware/validation";

// Import database initialization
import { initializeDatabase } from "./config/supabase";

// Load environment variables
dotenv.config();

const app: Application = express();

// Initialize database
initializeDatabase().catch(console.error);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("combined")); // Logging

// Stripe webhook must be mounted BEFORE JSON body parser to preserve raw body for signature verification
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), webhookHandler);

// Global body parsers (must come AFTER webhook)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(rateLimiter); // Basic rate limiting

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "success",
    message: "API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stripe", stripeRoutes);

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Express TypeScript API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      status: "/api/status",
      users: "/api/users",
      posts: "/api/posts",
      stripe: "/api/stripe",
    },
  });
});

// Error handling middleware (must be last)
app.use(globalErrorHandler);

// 404 handler (must be last)
app.use(notFoundHandler);

export default app;
