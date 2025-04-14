"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "../../utils/supabase/client";
import { AuthContextType, AuthState, Profile, User } from "@/types/auth";

const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const supabase = createClient();

  const refreshProfile = async () => {
    try {
      if (!state.user) {
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", state.user?.id)
        .single();

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        profile,
        error: null,
      }));
    } catch (error) {
      console.error("Error fetching profile:", error);
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setState(initialState);
    } catch (error) {
      console.error("Error signing out:", error);
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }));
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { user } } = await supabase.auth.getUser();

        setState((prev) => ({
          ...prev,
          user: user as User | null,
          isLoading: false,
        }));

        if (user) {
          await refreshProfile();
        }

        // Set up auth state change subscription
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setState((prev) => ({
              ...prev,
              user: session?.user as User | null,
              isLoading: false,
            }));

            if (session?.user) {
              await refreshProfile();
            } else {
              setState((prev) => ({
                ...prev,
                profile: null,
              }));
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        setState((prev) => ({
          ...prev,
          error: error as Error,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
