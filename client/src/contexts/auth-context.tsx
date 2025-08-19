"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { AuthUser, AuthSession } from "@/lib/supabase";

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Only redirect on SIGNED_IN if we're not already on a protected route
      // This prevents conflicts with the callback route
      if (event === "SIGNED_IN" && !window.location.pathname.startsWith("/dashboard")) {
        router.push("/dashboard");
      } else if (event === "SIGNED_OUT") {
        router.push("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error?.message };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const signInWithOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error?.message };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error?.message };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error?.message };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      return { error: error?.message };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.refreshSession();
    setSession(session);
    setUser(session?.user ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithOtp,
        signInWithMagicLink,
        signInWithGoogle,
        verifyOtp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
