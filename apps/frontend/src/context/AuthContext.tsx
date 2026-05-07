import React, { useState, useEffect, useCallback } from "react";
import type { AuthContextType } from "../types/auth.ts";
import type { User } from "@focusboard/shared";
import { AuthContext } from "./auth.context.ts";
import { apiCall } from "../utils/api.ts";
import { loginUser, registerUser } from "../services/auth.service.ts";

/**
 * Provider que gestiona el estado de autenticación global de FocusBoard.
 * Verifica sesión al montar, maneja login/register/logout
 * y expone user, isAuthenticated, isLoading, error y funciones.
 * Se usa en toda la app envuelto en <AuthProvider>.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verifica si el usuario ya tiene sesión activa al cargar la app
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

  /**
   * Inicia sesión con email y contraseña
   * Actualiza el estado user tras login exitoso
   * @param email - Email del usuario
   * @param password - Contraseña en texto plano
   * @throws Error si el login falla
   */
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

  /**
   * Registra un nuevo usuario y inicia sesión automáticamente
   * @param email - Email del nuevo usuario
   * @param password - Contraseña (mín 8 caracteres)
   * @param fullName - Nombre completo
   * @throws Error si el registro falla
   */
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

  /**
   * Cierra la sesión del usuario actual
   * Limpia el estado user y cookies vía backend
   * @throws Error si el logout falla
   */
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
