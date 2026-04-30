import React, { useState, useEffect, useCallback } from "react";
import type { AuthContextType } from "../types/auth.ts";
import type { User } from "@focusboard/shared";
import { AuthContext } from "./auth.context.ts";
import { apiCall } from "../utils/api.ts";
import { loginUser, registerUser } from "../services/auth.service.ts";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in (on app mount)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiCall<{ data: User }>("/api/auth/me");
        setUser(response.data);
      } catch {
        // User not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      await loginUser(email, password);
      // Fetch updated user data
      const userResponse = await apiCall<{ data: User }>("/api/auth/me");
      setUser(userResponse.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        setError(null);
        await registerUser({ email, password, fullName });
        // Fetch updated user data
        const userResponse = await apiCall<{ data: User }>("/api/auth/me");
        setUser(userResponse.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      setError(null);
      await apiCall("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
