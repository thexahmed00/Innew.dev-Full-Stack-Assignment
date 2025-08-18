import { createBrowserClient } from "@supabase/ssr";

// Create a function to get the Supabase client
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Don't export a default client instance to avoid SSR issues
// The client will be created dynamically in the AuthContext

// Auth types
export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    provider?: string;
  };
};

export type AuthSession = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};
