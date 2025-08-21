"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { AuthUser, AuthSession } from "@/lib/supabase";
import { handleAsyncOperation, type AuthResult } from "@/lib/error-handler";

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithOtp: (email: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  verifyOtp: (email: string, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const updateSession = (session: AuthSession | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      updateSession(session);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", event, session ? "session exists" : "no session");
      updateSession(session);

      if (event === "SIGNED_OUT") {
        router.push("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const signIn = (email: string, password: string) =>
    handleAsyncOperation(() => supabase.auth.signInWithPassword({ email, password }));

  const signUp = (email: string, password: string) =>
    handleAsyncOperation(() =>
      supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
    );

  const signInWithOtp = (email: string) =>
    handleAsyncOperation(() =>
      supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
    );

  const signInWithMagicLink = signInWithOtp;

  const signInWithGoogle = () =>
    handleAsyncOperation(() =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
    );

  const verifyOtp = (email: string, token: string) =>
    handleAsyncOperation(() =>
      supabase.auth.verifyOtp({ email, token, type: "email" })
    );

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    updateSession(session);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    updateSession(session);
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
        refreshUser,
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
