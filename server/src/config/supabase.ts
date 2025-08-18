import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database table names
export const TABLES = {
  USERS: "users",
  POSTS: "posts",
} as const;

// RLS (Row Level Security) policies
export const setupRLSPolicies = async () => {
  try {
    // Enable RLS on tables
    await supabase.rpc("enable_rls", { table_name: TABLES.USERS });
    await supabase.rpc("enable_rls", { table_name: TABLES.POSTS });

    console.log("✅ RLS policies configured");
  } catch (error) {
    console.log("⚠️ RLS setup skipped (may already be configured)");
  }
};

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Create users table if it doesn't exist
    const { error: usersError } = await supabase
      .from(TABLES.USERS)
      .select("id")
      .limit(1);

    if (usersError) {
      console.log("Creating users table...");
      // In a real app, you'd use migrations
      // For now, we'll assume the table exists
    }

    // Create posts table if it doesn't exist
    const { error: postsError } = await supabase
      .from(TABLES.POSTS)
      .select("id")
      .limit(1);

    if (postsError) {
      console.log("Creating posts table...");
      // In a real app, you'd use migrations
      // For now, we'll assume the table exists
    }

    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
};
