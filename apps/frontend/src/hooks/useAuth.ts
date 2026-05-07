import { useContext } from "react";
import { AuthContext } from "../context/auth.context.ts";
import type { AuthContextType } from "../types/auth.ts";

/**
 * Hook que expone el contexto de autenticación de FocusBoard.
 * Debe usarse dentro de un AuthProvider.
 * Lanza error si se usa fuera del provider para detectar errores temprano.
 * @returns AuthContextType con user, login, register, logout, isLoading, error
 * @throws Error si se usa fuera de AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
