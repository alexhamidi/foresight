import axios from "axios";
import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

// Create axios instance with default config
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

// Add request interceptor to attach the session
api.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Set the cookie in the request
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60}; SameSite=Lax`;
    }
  } catch (error) {
    console.error("Error getting session:", error);
  }
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle 401 errors - could be expired token
      const { error: signOutError } = await supabase.auth.signOut();
      if (!signOutError) {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
