# API Client — FocusBoard Frontend

---

## Estructura de la capa de red

```
src/
├── config/
│   └── env.ts                  # VITE_API_URL desde variables de entorno
├── utils/
│   └── api.ts                  # apiCall() — wrapper central de fetch
├── services/
│   ├── auth.service.ts         # registerUser(), loginUser()
│   ├── room.service.ts         # CRUD de salas via roomService object
│   ├── pomodoro-session.service.ts  # savePomodoroSession()
│   ├── dashboard.service.ts    # getTodaySessionsCount()
│   ├── history.service.ts      # getTodaySessions(), getWeekSessions(), etc.
│   └── ambient-audio.service.ts    # Preferencias de sonido (localStorage)
├── types/
│   ├── auth.ts                 # AuthContextType
│   └── timer.ts                # TimerConfig, TimerControls, etc.
└── packages/shared/src/
    └── index.ts                # User, Room, PomodoroSession (interfaces compartidas)
```

---

## Tipos compartidos con `@focusboard/shared`

El paquete `packages/shared/src/index.ts` define interfaces que usan **ambos** backend y frontend:

```ts
// packages/shared/src/index.ts
export interface User {
  id: number;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Room {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode: string;
  createdAt: string;
}

export interface PomodoroSession {
  id: number;
  userId: number;
  roomId?: number;
  taskLabel: string;
  durationSeconds: number;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
```

Gracias al monorepo, el frontend importa estos tipos directamente:

```ts
import type { User, Room, ApiSuccess } from "@focusboard/shared";
```

---

## `apiCall()` — El wrapper central de fetch

**Archivo:** `src/utils/api.ts`

### Cómo funciona

```ts
let refreshPromise: Promise<boolean> | null = null;

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include" as const,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Token expirado → intentar refresh
  if (res.status === 401 && !options.skipAuth) {
    if (!refreshPromise) {
      refreshPromise = fetch(`${env.apiUrl}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      }).then((r) => r.ok);
    }

    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      return apiCall<T>(endpoint, { ...options, skipAuth: true });
    }

    throw new AppError("Sesión expirada", 401);
  }

  // Manejar errores HTTP
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AppError(body.error || `HTTP ${res.status}`, res.status);
  }

  // Parsear respuesta exitosa
  // Soporta: ApiSuccess<T> (con data) o T directo (sin data)
  const body = await res.json();
  return body.data !== undefined ? body.data : (body as T);
}
```

### Flujo de refresh automático

```
Request GET /api/v1/sessions
  → fetch (credentials: "include")
  → Response 401 (accessToken expiró)
  → POST /api/auth/refresh (con cookie refreshToken)
    → si OK: nuevo accessToken en cookie, retry request original
    → si FAIL: lanza "Sesión expirada", frontend redirige a /login
  → Retry original con skipAuth: true (evita bucle infinito)

El refreshPromise actúa como lock:
  - Si 2 requests fallan 401 simultáneamente
  - Solo 1 hace el refresh
  - La otra espera el mismo Promise
```

### Credenciales

Todas las llamadas usan `credentials: "include"`, que envía las cookies httpOnly automáticamente. Esto es necesario porque los tokens JWT se almacenan en cookies, no en headers Authorization.

---

## Servicios de red

### `auth.service.ts`

**Funciones:**

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `registerUser(payload)` | `POST /api/auth/register` | Registra usuario |

```ts
export async function registerUser(payload: RegisterPayload): Promise<ApiSuccess<AuthTokens>> {
  const response = await fetch(`${env.apiUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (response.status === 409) {
    throw new AppError("El email ya está registrado", 409);
  }
  if (response.status === 400) {
    const data = await response.json();
    throw new AppError(data.error || "Datos inválidos", 400);
  }

  return response.json();
}
```

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `loginUser(email, password)` | `POST /api/auth/login` | Inicia sesión |

```ts
export async function loginUser(email: string, password: string): Promise<ApiSuccess<AuthTokens>> {
  const response = await fetch(`${env.apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (response.status === 401) throw new AppError("Credenciales inválidas", 401);
  if (response.status === 429) throw new AppError("Demasiados intentos", 429);
  if (response.status === 403) throw new AppError("Cuenta desactivada", 403);

  return response.json();
}
```

### `room.service.ts`

Usa `apiCall()` para todos los endpoints:

| Función | Método | Endpoint | Retorno |
|---------|--------|----------|---------|
| `createRoom(data)` | POST | `/api/v1/rooms` | `RoomData` |
| `getRoomByCode(code)` | GET | `/api/v1/rooms/${code}` | `RoomData` |
| `joinRoom(code)` | POST | `/api/v1/rooms/${code}/join` | `RoomData` |
| `leaveRoom(code)` | DELETE | `/api/v1/rooms/${code}/leave` | `void` |
| `deleteRoom(roomId)` | DELETE | `/api/v1/rooms/${roomId}` | `void` |
| `listPublicRooms(params?)` | GET | `/api/v1/rooms?search=&limit=&offset=` | `RoomListItem[]` |

Todas están agrupadas en el objeto `roomService`:

```ts
export const roomService = {
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  deleteRoom,
  listPublicRooms,
};
```

### `pomodoro-session.service.ts`

| Función | Método | Endpoint |
|---------|--------|----------|
| `savePomodoroSession(data)` | POST | `/api/v1/sessions` |

### `dashboard.service.ts`

| Función | Método | Endpoint |
|---------|--------|----------|
| `getTodaySessionsCount()` | GET | `/api/v1/sessions/today-count` |

Retorna `0` en caso de error (para no romper la UI):

```ts
export async function getTodaySessionsCount(): Promise<number> {
  try {
    const data = await apiCall<{ count: number }>("/api/v1/sessions/today-count");
    return data.count;
  } catch {
    return 0;
  }
}
```

### `history.service.ts`

| Función | Método | Endpoint |
|---------|--------|----------|
| `getTodaySessions()` | GET | `/api/v1/sessions/today` |
| `getWeekSessions()` | GET | `/api/v1/sessions/week` |
| `getStats()` | GET | `/api/v1/sessions/stats` |
| `getDailyGoal()` | GET | `/api/user/settings` |
| `formatTime(minutes)` | — | Formatea "1h 30m" |
| `formatDateTime(dateString)` | — | Formatea "14:30" (es-ES) |
| `formatDay(dateString)` | — | Formatea "lun, 15 ene" (es-ES) |

### `ambient-audio.service.ts`

No hace llamadas de red. Solo gestiona configuración local y metadatos de sonidos:

```ts
export type AmbientSoundId = "lluvia" | "rain" | "cafeteria" | "naturaleza";

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  { id: "lluvia", label: "Lluvia", description: "Sonido relajante de lluvia", src: "/audio/lluvia.mp3" },
  { id: "rain", label: "Rain", description: "Soft rain on window", src: "/audio/rain.mp3" },
  { id: "cafeteria", label: "Cafetería", description: "Ambiente de cafetería", src: "/audio/cafeteria.mp3" },
  { id: "naturaleza", label: "Naturaleza", description: "Sonidos de la naturaleza", src: "/audio/naturaleza.mp3" },
];

export function loadAmbientAudioPreference(): AmbientAudioPreference {
  try {
    const saved = localStorage.getItem("focusboard:ambientAudio");
    return saved ? JSON.parse(saved) : { soundId: "lluvia", volume: 0.4 };
  } catch {
    return { soundId: "lluvia", volume: 0.4 };
  }
}
```

---

## Gestión de los 3 estados: Loading, Success, Error

Cada página sigue este patrón consistente:

```tsx
function Page() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall<T>("/api/endpoint");
        setData(result);
      } catch (err) {
        setError(err instanceof AppError ? err.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <DataView data={data} />;
}
```

### Loading (Skeleton)
- `History.tsx`: Esqueletos animados con `animate-pulse` para header, stats cards, chart y lista
- `RoomList.tsx`: Grid de skeletons con `animate-pulse`
- `Dashboard.tsx`: Texto "..." mientras carga el contador

### Error (con retry)
- `RoomList.tsx`: Mensaje de error + botón "Reintentar"
- `Room.tsx`: Mensaje de error con botón "Volver a salas"
- `LoginForm`/`RegisterForm`: Error en el mismo formulario sin perder datos ingresados

### Success (vacío y con datos)
- **Vacío**: Mensaje descriptivo + Call to Action (botón)
  - `History.tsx`: "Sin sesiones todavía" + botón "Ir al Dashboard"
  - `RoomList.tsx`: "No se encontraron salas" + botón "Crear sala"
- **Con datos**: Vista completa con la información

---

## Cookies httpOnly en el cliente

### Por qué cookies y no localStorage

| Aspecto | Cookies httpOnly | localStorage |
|---------|-----------------|--------------|
| Acceso JS | No accesible | Accesible via `localStorage.getItem` |
| XSS | Inmune | Vulnerable (atacante lee el token) |
| Envío automático | Sí, en cada request | No, hay que agregar manualmente |
| CSRF | Protegido con `sameSite: strict` | No aplica |
| Expiración | Server-side (maxAge) | Manual |

### Cómo se envían

```ts
// api.ts — todas las llamadas usan credentials: "include"
const res = await fetch(url, {
  credentials: "include",  // ← envía cookies automáticamente
  headers: { "Content-Type": "application/json" },
});
```

El backend las recibe via `cookie-parser`:

```ts
// auth.routes.ts
// El middleware verifyAccessToken lee req.cookies.accessToken
```

### Refresh automático

Cuando el accessToken expira:
1. El backend responde 401
2. `apiCall()` detecta 401
3. Hace `POST /api/auth/refresh` (con cookie refreshToken)
4. Backend verifica refreshToken, setea nuevo accessToken en cookie
5. Retry del request original

Todo esto es transparente para el componente que hace la llamada.

---
