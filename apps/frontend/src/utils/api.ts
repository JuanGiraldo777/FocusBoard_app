import env from "../config/env";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

// Cola de requests pendientes durante refresh
let refreshPromise: Promise<boolean> | null = null;

async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const defaultOptions: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include" as const, // Incluye cookies en todas las solicitudes
  };

  const response = await fetch(`${env.apiUrl}${endpoint}`, {
    ...defaultOptions,
    ...fetchOptions,
  });

  // Si 401, intentar refrescar token
  if (response.status === 401 && !skipAuth) {
    // Si ya hay un refresh en progreso, esperar
    if (refreshPromise) {
      const refreshSuccess = await refreshPromise;
      if (refreshSuccess) {
        // Reintentar request original
        return apiCall(endpoint, { ...options, skipAuth: true });
      }
      // Si refresh falló, dejar que se maneje el error normalmente
      return handleErrorResponse<T>(response);
    }

    // Iniciar nuevo refresh
    refreshPromise = (async () => {
      try {
        const refreshResponse = await fetch(
          `${env.apiUrl}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (refreshResponse.ok) {
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    const refreshSuccess = await refreshPromise;
    if (refreshSuccess) {
      // Reintentar request original
      return apiCall(endpoint, { ...options, skipAuth: true });
    }

    // Si refresh falla, retornar error
    return handleErrorResponse<T>(response);
  }

  if (!response.ok) {
    return handleErrorResponse<T>(response);
  }

  return response.json();
}

async function handleErrorResponse<T>(
  response: Response,
): Promise<T> {
  const error = await response.json().catch(() => ({}));
  const message =
    typeof error.error === "string"
      ? error.error
      : `HTTP ${response.status}`;
  const httpError = new Error(message) as Error & { statusCode?: number };
  httpError.statusCode = response.status;
  throw httpError;
}

export { apiCall };

