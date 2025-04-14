export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  email: string;
  created_at: string;
  payment_plan: "free" | "pro";
  plan_expires_at?: string;
  requests: {
    search: number;
    chat: number;
    agentMode: number;
  };
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
