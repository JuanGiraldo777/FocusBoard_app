# Hooks Personalizados — FocusBoard Frontend

---

## Índice de hooks

- [useTimer](#usetimer)
- [useAuth](#useauth)
- [useRegisterForm](#useregisterform)
- [useLoginForm](#useloginform)
- [useSocket](#usesocket)
- [useAmbientAudio](#useambientaudio)
- [React Hooks nativos en el proyecto](#react-hooks-nativos-en-el-proyecto)

---

## `useTimer`

**Archivo:** `src/hooks/useTimer.ts`

### Qué gestiona
El temporizador Pomodoro completo: ciclo focus → break → idle, persistencia ante recarga, y comunicación con un Web Worker para evitar throttling del navegador.

### Parámetros
```ts
interface TimerConfig {
  focusDuration?: number;  // segundos, default 1500 (25min)
  breakDuration?: number;  // segundos, default 300 (5min)
  onComplete?: () => void; // callback al completar un ciclo
}
```

### Retorno
```ts
interface TimerControls {
  timeLeft: number;               // segundos restantes
  state: TimerState;             // "idle" | "focusing" | "break" | "paused"
  sessionsCompleted: number;      // sesiones completadas hoy
  start: () => void;             // inicia focus
  pause: () => void;             // pausa
  resume: () => void;            // reanuda
  reset: () => void;             // reinicia a idle
}
```

### Cómo funciona el Web Worker

El hook crea un `Worker` desde `timer.worker.ts`. El worker ejecuta un `setInterval` de 1 segundo en un hilo separado:

1. **`start(seconds)`** → worker inicia countdown, postea `{ type: "tick", timeLeft }` cada segundo
2. **`completed`** → cuando `timeLeft <= 0`, postea `{ type: "completed" }`
3. **`pause`** → flag `isPaused = true` en el worker (no elimina el interval)
4. **`resume`** → flag `isPaused = false`
5. **`reset`** → limpia interval, reinicia timeLeft, postea tick

Esto evita que el temporizador se relentice cuando la pestaña está en background (los navegadores throttlean `setInterval` a 1 segundo o más en pestañas inactivas, pero los Web Workers no).

### Persistencia en sessionStorage

En cada `tick`, el hook guarda `{ state, timeLeft, sessionsCompleted, lastUpdated }` en `sessionStorage`. Al montar, restaura el estado y calcula el tiempo transcurrido:

```ts
const getInitialTimeLeft = (saved: SavedState): number => {
  const elapsed = Math.floor(
    (Date.now() - new Date(saved.lastUpdated).getTime()) / 1000,
  );
  return Math.max(0, saved.timeLeft - elapsed);
};
```

### Prevención de doble finalización

Usa `lastCompletedAtRef` para evitar que el callback `onComplete` se ejecute más de una vez en caso de mensajes duplicados del worker.

---

## `useAuth`

**Archivo:** `src/hooks/useAuth.ts`

### Qué gestiona
Consume `AuthContext` y expone el estado de autenticación y métodos para login/register/logout.

### Retorno
```ts
interface AuthContextType {
  user: User | null;              // usuario autenticado o null
  isAuthenticated: boolean;       // si hay sesión activa
  isLoading: boolean;             // cargando estado inicial
  error: string | null;           // último error de autenticación
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
```

### Cómo restaura la sesión

Al montar `AuthProvider`:
1. Estado inicial: `{ isLoading: true }`
2. Llama a `GET /api/auth/me` con cookies (se envían automáticamente)
3. Si responde 200 → `{ user, isAuthenticated: true, isLoading: false }`
4. Si responde 401 → `{ user: null, isAuthenticated: false, isLoading: false }`
5. El hook `useAuth()` simplemente retorna `useContext(AuthContext)`, lanzando error si se usa fuera del provider.

---

## `useRegisterForm`

**Archivo:** `src/hooks/useRegisterForm.ts`

### Qué gestiona
Estado del formulario de registro con validación en tiempo real. Cada vez que el usuario escribe en un campo, se valida instantáneamente.

### Retorno
```ts
interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
}

interface FormData {
  email: string;
  password: string;
  fullName: string;
}

const {
  formData,      // { email, password, fullName }
  errors,        // { email?, password?, fullName? }
  isLoading,     // boolean
  setIsLoading,  // Dispatch<boolean>
  handleChange,  // (e: ChangeEvent<HTMLInputElement>) => void
  isValid,       // () => boolean
  reset,         // () => void
  setSubmitError // (error: string) => void
}
```

### Validación en tiempo real

Cada campo tiene su validador:

```ts
const validateEmail = (email: string): string | undefined => {
  if (!email) return "El email es obligatorio";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Formato de email inválido";
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 8) return "Mínimo 8 caracteres";
};

const validateFullName = (fullName: string): string | undefined => {
  if (!fullName) return "El nombre es obligatorio";
};
```

`handleChange` corre el validador del campo modificado y actualiza `errors`. `isValid()` corre todos los validadores y retorna `true` solo si no hay errores.

---

## `useLoginForm`

**Archivo:** `src/hooks/useLoginForm.ts`

### Qué gestiona
Estado del formulario de login. Mismo patrón que `useRegisterForm` pero con solo 2 campos: email y password.

### Retorno
Misma estructura que `useRegisterForm` pero con `FormData = { email: string; password: string }`.

La validación de password en login solo verifica que no esté vacío (sin mínimo de caracteres).

---

## `useSocket`

**Archivo:** `src/hooks/useSocket.ts`

### Qué gestiona
Conexión Socket.IO para la sala colaborativa en tiempo real.

### Parámetros
```ts
(code: string) => UseSocketReturn
```

### Retorno
```ts
interface UseSocketReturn {
  socket: Socket | null;
  members: RoomMember[];
  isConnected: boolean;
  roomDeleted: boolean;
}
```

### Eventos Socket.IO

| Evento | Dirección | Acción |
|--------|-----------|--------|
| `room:join` | Cliente → Servidor | Unirse a sala `room:{code}` |
| `room:members` | Servidor → Cliente | Lista inicial de miembros |
| `room:memberJoined` | Servidor → Cliente | Nuevo miembro |
| `member:left` / `room:memberLeft` | Servidor → Cliente | Miembro salió |
| `room:deleted` | Servidor → Cliente | Sala eliminada por owner |
| `room:ping` | Cliente → Servidor | Heartbeat cada 25s |
| `room:leave` | Cliente → Servidor | Salir de sala (al desmontar) |

---

## `useAmbientAudio`

**Archivo:** `src/hooks/useAmbientAudio.ts`

### Qué gestiona
Reproducción de sonido ambiente durante las sesiones Pomodoro.

### Parámetros
```ts
(isSessionActive: boolean) => UseAmbientAudioReturn
```

### Retorno
```ts
interface UseAmbientAudioReturn {
  selectedSoundId: AmbientSoundId;
  volume: number;
  status: AmbientAudioStatus;
  error: string | null;
  selectedSoundLabel: string;
  selectedSoundDescription: string;
  options: AmbientSoundOption[];
  setSelectedSoundId: (id: AmbientSoundId) => void;
  setVolume: (volume: number) => void;
}
```

### Comportamiento
- Carga preferencia guardada de localStorage al montar
- Crea elemento `<audio>` con loop
- Reproduce cuando `isSessionActive = true`, pausa cuando `false`
- Cambia de sonido recargando la fuente del audio
- Persiste preferencia en localStorage

---

## React Hooks nativos en el proyecto

### `useState`

Usado para estado local en componentes y hooks. Ejemplos del proyecto:

```ts
const [todayCount, setTodayCount] = useState<number>(0);
const [loading, setLoading] = useState(true);
const [members, setMembers] = useState<RoomMember[]>([]);
```

### `useEffect`

Para efectos secundarios: fetch de datos, conexiones socket, timers.

```ts
// Fetch de datos al montar
useEffect(() => {
  const fetchData = async () => {
    const [today, week, statsData] = await Promise.all([
      getTodaySessions(),
      getWeekSessions(),
      getStats(),
    ]);
    setTodaySessions(today);
  };
  fetchData();
}, []);

// Guardar sesión en sessionStorage en cada tick
useEffect(() => {
  if (state !== "idle") {
    sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ ... }));
  }
}, [timeLeft, state]);
```

### `useCallback`

Para evitar recrear funciones en cada render. Usado para handlers que son props de hijos o dependencias de efectos.

```ts
const handleComplete = useCallback(() => {
  playNotificationSound();
  showSystemNotification();
  savePomodoroSession({ ... }).then(() => {
    if (onSessionSaved) onSessionSaved();
  });
}, [focusDuration, onSessionSaved, playNotificationSound, showSystemNotification]);
```

### `useMemo`

Para valores calculados que no deben recalcularse en cada render.

```ts
const currentTotal = useMemo(() => {
  if (timer.state === "focusing") return focusDuration;
  if (timer.state === "break") return breakDuration;
  return focusDuration;
}, [timer.state, focusDuration, breakDuration]);

const strokeDashoffset = useMemo(
  () => CIRCUMFERENCE * (1 - timer.timeLeft / currentTotal),
  [timer.timeLeft, currentTotal],
);
```

---
