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

/**
 * Crea un error tipado con statusCode opcional
 * @param message - Mensaje de error
 * @param statusCode - Código HTTP del error (opcional)
 * @returns AppError con statusCode
 */
function createAppError(message: string, statusCode?: number): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}

/**
 * Llama a la API para registrar un nuevo usuario.
 * Las cookies HttpOnly se setean automáticamente por el backend.
 * El frontend NO toca los tokens, solo recibe confirmación.
 * @param payload - Datos de registro (email, password, fullName)
 * @returns Promesa con ApiSuccess<AuthTokens>
 * @throws AppError con statusCode 409 si el email ya existe
 * @throws AppError con statusCode 400 si la validación falla
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
 * Llama a la API para iniciar sesión.
 * Las cookies HttpOnly se setean automáticamente por el backend.
 * El frontend NO toca los tokens, solo recibe confirmación.
 * @param email - Email del usuario
 * @param password - Contraseña en texto plano
 * @returns Promesa con ApiSuccess<AuthTokens>
 * @throws AppError con statusCode 401 si credenciales inválidas
 * @throws AppError con statusCode 429 si hay demasiados intentos
 * @throws AppError con statusCode 403 si la cuenta está desactivada
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
