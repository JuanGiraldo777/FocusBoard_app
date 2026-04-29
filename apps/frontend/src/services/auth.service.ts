import type { ApiSuccess } from "@focusboard/shared";
import env from "../config/env";

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Tipo seguro para errores con statusCode ──────────────
export interface AppError extends Error {
  statusCode?: number;
}

function createAppError(message: string, statusCode?: number): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}

/**
 * Registra un nuevo usuario
 * - Las cookies HttpOnly se setean automáticamente por el backend
 * - El frontend NO toca los tokens
 * - credentials: 'include' envía las cookies en cada request
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<ApiSuccess<AuthTokens>> {
  const response = await fetch(`${env.apiUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ← Envía cookies automáticamente
    body: JSON.stringify(payload),
  });

  // Manejo de errores específicos
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 409) {
      throw createAppError("Este email ya está registrado", 409);
    }

    if (response.status === 400) {
      const firstError =
        errorData.details &&
        typeof errorData.details === "object" &&
        Object.values(errorData.details)[0]
          ? (Object.values(errorData.details)[0] as string[])[0]
          : undefined;

      throw createAppError(firstError || "Validación fallida", 400);
    }

    throw new Error(
      errorData.error || `Error ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Inicia sesión de un usuario
 * - Las cookies HttpOnly se setean automáticamente por el backend
 * - El frontend NO toca los tokens
 * - credentials: 'include' envía las cookies en cada request
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<ApiSuccess<AuthTokens>> {
  const response = await fetch(`${env.apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Envía cookies automáticamente
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw createAppError("Email o contraseña incorrectos", 401);
    }

    if (response.status === 429) {
      throw createAppError(
        "Demasiados intentos. Intenta en 15 minutos",
        429,
      );
    }

    if (response.status === 403) {
      throw createAppError("Cuenta desactivada", 403);
    }

    throw new Error(
      errorData.error || `Error ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}
