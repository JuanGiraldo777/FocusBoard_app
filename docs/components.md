# Componentes y Páginas — FocusBoard Frontend

---

## Componentes (`src/components/`)

### `AmbientSoundControls.tsx`
| Prop | Tipo | Descripción |
|------|------|-------------|
| `options` | `AmbientSoundOption[]` | Array de sonidos disponibles |
| `selectedSoundId` | `AmbientSoundId` | ID del sonido actual |
| `selectedSoundLabel` | `string` | Label del sonido actual |
| `selectedSoundDescription` | `string` | Descripción del sonido actual |
| `volume` | `number` | Volumen actual (0-1) |
| `status` | `AmbientAudioStatus` | Estado: idle/loading/playing/paused/error |
| `error` | `string \| null` | Mensaje de error |
| `onSelectSound` | `(id: AmbientSoundId) => void` | Callback al seleccionar sonido |
| `onVolumeChange` | `(volume: number) => void` | Callback al cambiar volumen |

**Propósito:** Selector de sonido ambiente con grilla de opciones, badge de estado, mensaje de error y slider de volumen.
**¿Dónde se usa?:** `TimerDisplay.tsx`, `Room.tsx`

---

### `TaskDeclarationModal.tsx`
| Prop | Tipo | Descripción |
|------|------|-------------|
| `isOpen` | `boolean` | Controla visibilidad del modal |
| `onClose` | `() => void` | Cierra el modal |
| `onStart` | `(task: string) => void` | Callback con la tarea ingresada |
| `recentTasks` | `string[]` | Tareas recientes como sugerencias |

**Propósito:** Modal para declarar una tarea antes de iniciar el timer. Incluye input con auto-focus, validación (mínimo 3 caracteres), sugerencias de tareas recientes, y botones Cancelar/Iniciar Timer.
**¿Dónde se usa?:** `TimerDisplay.tsx`

---

### `PageHeader.tsx`
| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | `string` | Título de la página |
| `subtitle?` | `string` | Subtítulo opcional |
| `backTo?` | `string` | Ruta para botón "Atrás" |
| `backLabel?` | `string` | Texto del botón "Atrás" |
| `actions?` | `React.ReactNode` | Botones de acción en la derecha |

**Propósito:** Encabezado reutilizable con título, subtítulo, botón de retroceso (usa `useNavigate`) y slot de acciones.
**¿Dónde se usa?:** `Dashboard.tsx`, `RoomList.tsx`, `CreateRoom.tsx`, `JoinRoom.tsx`, `Room.tsx`, `History.tsx`

---

### `ProtectedRoute.tsx`
| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | `React.ReactNode` | Contenido protegido |

**Propósito:** Guardia de ruta que redirige a `/login` si el usuario no está autenticado. Muestra spinner durante la verificación.
**¿Dónde se usa?:** `App.tsx` (envuelve rutas protegidas)

---

### `PublicRoute.tsx`
| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | `React.ReactNode` | Contenido público |

**Propósito:** Guardia de ruta que redirige a `/dashboard` si el usuario ya está autenticado. Muestra spinner durante la verificación.
**¿Dónde se usa?:** `App.tsx` (envuelve `/login` y `/register`)

---

### `LoginForm.tsx`
**Props:** Ninguna (usa hooks internos `useLoginForm` y `useAuth`)

**Propósito:** Formulario de inicio de sesión con inputs de email y password, validación en tiempo real, display de errores, y estado de carga. Llama a `login()` de AuthContext y redirige a `/dashboard` en éxito.
**¿Dónde se usa?:** `Login.tsx`

---

### `RegisterForm.tsx`
**Props:** Ninguna (usa hooks internos `useRegisterForm` y `useAuth`)

**Propósito:** Formulario de registro con inputs de email, fullName y password, validación en tiempo real (password min 8 caracteres), y estado de carga. Llama a `register()` de AuthContext.
**¿Dónde se usa?:** `Register.tsx`

---

### `TimerDisplay.tsx`
| Prop | Tipo | Descripción |
|------|------|-------------|
| `focusDuration?` | `number` | Duración de enfoque en segundos (default 1500 = 25min) |
| `breakDuration?` | `number` | Duración de descanso en segundos (default 300 = 5min) |
| `onSessionSaved?` | `() => void` | Callback al guardar sesión |

**Propósito:** Temporizador Pomodoro visual con círculo SVG de progreso. Muestra: tarea actual, badge de estado, cuenta regresiva, contador de sesiones, controles de sonido ambiente y botones de acción. Usa Web Worker via `useTimer` para evitar throttling. Al completar, guarda sesión en backend y muestra notificación del sistema.
**¿Dónde se usa?:** `Dashboard.tsx`, `Room.tsx`

---

### `Layout.tsx`
| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | `ReactNode` | Contenido de la página |

**Propósito:** Layout principal con sidebar + área de contenido centrada (`max-w-6xl`). Soporte dark mode.
**¿Dónde se usa?:** `App.tsx` (envuelve todas las rutas protegidas)

---

### `Sidebar.tsx`
**Props:** Ninguna (usa hooks internos `useAuth`, `useTheme`, `useLocation`)

**Propósito:** Barra de navegación lateral con logo, enlaces (Dashboard, Salas, Historial, Audio), toggle de tema (Sol/Luna), avatar con iniciales del usuario, email, y botón de cerrar sesión. Resalta la ruta activa con borde izquierdo.
**¿Dónde se usa?:** `Layout.tsx`

---

## Páginas (`src/pages/`)

### `Login.tsx` — Ruta: `/login`, `PublicRoute`
**Propósito:** Página de inicio de sesión con fondo degradado, toggle de tema, logo, componente `LoginForm` y enlace a registro.
**Componentes que usa:** `LoginForm`
**Hooks que usa:** `useTheme`

---

### `Register.tsx` — Ruta: `/register`, `PublicRoute`
**Propósito:** Página de registro con fondo degradado, toggle de tema, logo, componente `RegisterForm` y enlace a login.
**Componentes que usa:** `RegisterForm`
**Hooks que usa:** `useTheme`

---

### `Dashboard.tsx` — Ruta: `/dashboard`, `ProtectedRoute`
**Propósito:** Página principal con saludo contextual según hora del día. Tarjeta del timer, progreso del día (contador + barra), sesiones recientes, tarjeta de sala activa (placeholder) y footer con estadísticas (pomodoros hoy, tiempo enfocado, racha).
**Componentes que usa:** `PageHeader`, `TimerDisplay`
**Hooks que usa:** `useAuth`, `useState`, `useEffect`
**Servicios:** `getTodaySessionsCount()`

---

### `RoomList.tsx` — Ruta: `/rooms`, `ProtectedRoute`
**Propósito:** Listado de salas públicas con búsqueda (debounced 300ms), skeleton loading, estado vacío, error con retry. Cada tarjeta muestra nombre, badge público/privado, miembros, miembros activos, código, y botón Unirse. Botones de acción: Crear Sala y Unirse por Código.
**Componentes que usa:** `PageHeader`
**Hooks que usa:** `useAuth`, `useState`, `useEffect`
**Servicios:** `roomService.listPublicRooms()`, `roomService.joinRoom()`

---

### `Room.tsx` — Ruta: `/room/:code`, `ProtectedRoute`
**Propósito:** Sala colaborativa con información de sala, código copiable, lista de miembros con estados (focusing/break/idle), sesión del usuario con TimerDisplay, panel de audio ambiente colapsable, y manejo de errores. Actualiza miembros via WebSocket. Incluye confirmación para salir y auto-redirección cuando la sala se elimina.
**Componentes que usa:** `PageHeader`, `TimerDisplay`, `AmbientSoundControls`
**Hooks que usa:** `useSocket`, `useState`, `useEffect`
**Servicios:** `roomService.getRoomByCode()`, `roomService.leaveRoom()`

---

### `CreateRoom.tsx` — Ruta: `/create-room`, `ProtectedRoute`
**Propósito:** Formulario de creación de sala con nombre, visibilidad (radio Público/Privado con iconos Globe/Lock), máximo de miembros, validación, manejo de errores y redirección a la sala creada.
**Componentes que usa:** `PageHeader`
**Hooks que usa:** `useState`, `useNavigate`
**Servicios:** `roomService.createRoom()`

---

### `JoinRoom.tsx` — Ruta: `/join-room`, `ProtectedRoute`
**Propósito:** Formulario para unirse a sala por código. Input auto-formateado a hex mayúsculas (máx 8). Validación: exactamente 8 caracteres hex. Show de éxito con nombre de sala y auto-redirección tras 1.5s. Estados de error contextuales (sala llena, ya miembro, no existe).
**Componentes que usa:** `PageHeader`
**Hooks que usa:** `useState`, `useNavigate`, `useParams`
**Servicios:** `roomService.joinRoom()`

---

### `History.tsx` — Ruta: `/history`, `ProtectedRoute`
**Propósito:** Historial de productividad con cards de estadísticas (pomodoros, tiempo enfocado, racha con icono Flame), gráfica semanal con Recharts (BarChart), selector de periodo (Hoy/Semana/Mes), lista de sesiones de hoy. Loading skeleton completo y estado vacío con link a Dashboard.
**Componentes que usa:** `PageHeader`
**Hooks que usa:** `useState`, `useEffect`
**Servicios:** `getTodaySessions()`, `getWeekSessions()`, `getStats()`, `getDailyGoal()`

---

### `NotFound.tsx` — Ruta: `*` (catch-all)
**Propósito:** Página 404 con icono AlertCircle, mensaje "Página no encontrada" y botón "Volver al dashboard". Sin layout (no hay sidebar).
**Componentes que usa:** Ninguno

---
