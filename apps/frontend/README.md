# FocusBoard — Frontend

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)

Cliente SPA de FocusBoard construido con React 19 y TypeScript.  
Provee la interfaz de usuario para el temporizador Pomodoro, salas colaborativas en tiempo real vía WebSocket, historial de productividad con gráficas y autenticación con cookies httpOnly.

---

## Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 19.x | UI por componentes con hooks |
| TypeScript | ~6.0 | Tipado estático |
| Vite | 8.x | Bundler y dev server con HMR |
| Tailwind CSS | 4.x | Estilos utilitarios con dark mode |
| React Router | 7.x | Enrutamiento SPA |
| Lucide React | latest | Iconos SVG |
| Recharts | 3.x | Gráfica semanal de productividad |
| Socket.IO Client | 4.x | WebSocket para salas en tiempo real |

---

## Estructura de carpetas

```
src/
├── main.tsx                     # Entry point: StrictMode → ThemeProvider → Router → App
├── App.tsx                      # Router con AuthProvider, rutas protegidas/públicas
├── index.css                    # Tailwind CSS v4 import + dark variant
│
├── components/
│   ├── AmbientSoundControls.tsx # Selector de sonido ambiente con grilla y volumen
│   ├── Layout.tsx               # Layout principal: Sidebar + contenido centrado
│   ├── LoginForm.tsx            # Formulario de inicio de sesión con validación
│   ├── PageHeader.tsx           # Encabezado con título, subtítulo y slot de acciones
│   ├── ProtectedRoute.tsx       # Guardia que redirige a /login si no hay sesión
│   ├── PublicRoute.tsx          # Guardia que redirige a /dashboard si ya hay sesión
│   ├── RegisterForm.tsx         # Formulario de registro con validación en tiempo real
│   ├── Sidebar.tsx              # Navegación lateral con logo, enlaces, avatar, theme toggle
│   ├── TaskDeclarationModal.tsx # Modal para declarar tarea antes de iniciar el timer
│   └── TimerDisplay.tsx         # Temporizador Pomodoro con SVG circular y Web Worker
│
├── pages/
│   ├── Login.tsx                # Página de inicio de sesión
│   ├── Register.tsx             # Página de registro
│   ├── Dashboard.tsx            # Página principal con timer y progreso diario
│   ├── RoomList.tsx             # Listado de salas públicas con búsqueda
│   ├── Room.tsx                 # Sala colaborativa con miembros en tiempo real
│   ├── CreateRoom.tsx           # Formulario de creación de sala
│   ├── JoinRoom.tsx             # Formulario para unirse por código
│   ├── History.tsx              # Historial con gráfica Recharts
│   └── NotFound.tsx             # Página 404
│
├── hooks/
│   ├── useAuth.ts               # Consume AuthContext, expone user y métodos de auth
│   ├── useTimer.ts              # Timer Pomodoro con Web Worker y persistencia sessionStorage
│   ├── useRegisterForm.ts       # Estado y validación en tiempo real del formulario de registro
│   ├── useLoginForm.ts          # Estado y validación en tiempo real del formulario de login
│   ├── useSocket.ts             # Conexión Socket.IO para salas colaborativas
│   └── useAmbientAudio.ts       # Reproducción de sonido ambiente con persistencia localStorage
│
├── context/
│   ├── AuthContext.tsx           # Provider de autenticación: login, register, logout, me
│   ├── auth.context.ts           # createContext raw (evita dependencia circular)
│   └── ThemeContext.tsx          # Provider de tema oscuro/claro con localStorage
│
├── services/
│   ├── auth.service.ts          # POST /api/auth/register y /login con manejo de errores
│   ├── room.service.ts          # CRUD de salas via apiCall (create, list, join, leave, delete)
│   ├── pomodoro-session.service.ts  # POST /api/v1/sessions — guardar sesión completada
│   ├── dashboard.service.ts     # GET /api/v1/sessions/today-count
│   ├── history.service.ts       # GET /api/v1/sessions/{today,week,stats}
│   └── ambient-audio.service.ts # Gestión local de sonidos ambiente (localStorage)
│
├── utils/
│   ├── api.ts                   # apiCall() — wrapper fetch con refresh automático de JWT
│   ├── room-code.ts             # normalizeRoomCode() + isValidRoomCode()
│   └── timer.worker.ts          # Web Worker para el contador del timer
│
├── types/
│   ├── auth.ts                  # AuthContextType interface
│   └── timer.ts                 # TimerState, TimerConfig, TimerControls, WorkerResponse
│
└── config/
    └── env.ts                   # env.apiUrl desde VITE_API_URL
```

---

## Páginas

| Ruta | Componente | Descripción | Auth |
|------|-----------|-------------|------|
| `/` | `Navigate → /dashboard` | Redirección raíz | — |
| `/login` | `Login` | Inicio de sesión | Pública |
| `/register` | `Register` | Registro de usuario | Pública |
| `/dashboard` | `Dashboard` | Temporizador Pomodoro + progreso diario | Requerida |
| `/rooms` | `RoomList` | Listado de salas públicas con búsqueda | Requerida |
| `/room/:code` | `Room` | Sala colaborativa con miembros en tiempo real | Requerida |
| `/create-room` | `CreateRoom` | Formulario de creación de sala | Requerida |
| `/join-room` | `JoinRoom` | Unirse a sala por código de 8 caracteres | Requerida |
| `/history` | `History` | Historial con gráfica semanal (Recharts) | Requerida |
| `/join` | `Navigate → /join-room` | Alias redirect | — |
| `*` | `NotFound` | Página 404 | — |

---

## Componentes principales

| Componente | Descripción |
|-----------|-------------|
| `TimerDisplay` | Temporizador Pomodoro con SVG circular, Web Worker, notificaciones del sistema y guardado automático de sesiones |
| `TaskDeclarationModal` | Modal para ingresar tarea antes de iniciar el timer, con sugerencias de tareas recientes |
| `PageHeader` | Encabezado reutilizable con título, subtítulo, botón de retroceso y slot de acciones |
| `ProtectedRoute` | Guardia de ruta que redirige a `/login` si no hay sesión activa |
| `PublicRoute` | Guardia de ruta que redirige a `/dashboard` si ya hay sesión activa |
| `Layout` | Layout de dos columnas: Sidebar + contenido centrado con `max-w-6xl` |
| `Sidebar` | Barra lateral con logo, navegación, avatar de usuario, theme toggle y botón de logout |
| `LoginForm` | Formulario de login con validación en tiempo real y manejo de errores 401/429/403 |
| `RegisterForm` | Formulario de registro con 3 campos y validación en tiempo real |
| `AmbientSoundControls` | Selector de sonido ambiente con grilla de opciones, badge de estado y slider de volumen |

---

## Hooks personalizados

| Hook | Gestiona | Retorna |
|------|---------|---------|
| `useAuth` | Estado de autenticación global | `{ user, isAuthenticated, isLoading, error, login, register, logout, clearError }` |
| `useTimer` | Ciclo Pomodoro (focus → break → idle) via Web Worker | `{ timeLeft, state, sessionsCompleted, start, pause, resume, reset }` |
| `useRegisterForm` | Estado y validación en tiempo real del registro | `{ formData, errors, isLoading, handleChange, isValid, reset, setSubmitError }` |
| `useLoginForm` | Estado y validación en tiempo real del login | `{ formData, errors, isLoading, handleChange, isValid, reset, setSubmitError }` |
| `useSocket` | Conexión Socket.IO para sala colaborativa | `{ socket, members, isConnected, roomDeleted }` |
| `useAmbientAudio` | Reproducción de sonido ambiente con persistencia | `{ selectedSoundId, volume, status, error, options, setSelectedSoundId, setVolume }` |

---

## Context

| Contexto | Estado que comparte | Cómo consumirlo |
|----------|-------------------|-----------------|
| `AuthContext` | `user`, `isAuthenticated`, `isLoading`, `error`, `login()`, `register()`, `logout()`, `clearError()` | `useAuth()` hook |
| `ThemeContext` | `theme` ("light" \| "dark"), `toggleTheme()` | `useTheme()` hook |

---

## Servicios (capa de red)

| Archivo | Endpoints que llama | Método |
|---------|--------------------|--------|
| `auth.service.ts` | `POST /api/auth/register`, `POST /api/auth/login` | POST |
| `room.service.ts` | `POST /api/v1/rooms`, `GET /api/v1/rooms`, `GET /api/v1/rooms/:code`, `POST /api/v1/rooms/:code/join`, `DELETE /api/v1/rooms/:code/leave`, `DELETE /api/v1/rooms/:id` | POST/GET/DELETE |
| `pomodoro-session.service.ts` | `POST /api/v1/sessions` | POST |
| `dashboard.service.ts` | `GET /api/v1/sessions/today-count` | GET |
| `history.service.ts` | `GET /api/v1/sessions/today`, `GET /api/v1/sessions/week`, `GET /api/v1/sessions/stats`, `GET /api/user/settings` | GET |

Todas las llamadas pasan por `apiCall()` en `utils/api.ts`, que maneja automáticamente:
- Inclusión de cookies (`credentials: "include"`)
- Refresh automático de access token en respuesta 401
- Parseo de respuestas `ApiSuccess<T>` y errores `AppError`

---

## Variables de entorno

| Variable | Descripción | Requerida | Ejemplo |
|----------|-------------|-----------|---------|
| `VITE_API_URL` | URL base de la API backend | Sí | `http://localhost:3000` |

---

## Comandos disponibles

| Comando | Descripción | Ejecutar desde |
|---------|-------------|----------------|
| `npm run dev` | Inicia servidor de desarrollo con HMR en `localhost:5173` | `apps/frontend` |
| `npm run build` | Type check + build de producción a `dist/` | `apps/frontend` |
| `npm run lint` | ESLint sobre todo el código fuente | `apps/frontend` |
| `npm run preview` | Previsualización del build de producción | `apps/frontend` |

---

## Configuración de desarrollo

```bash
# 1. Ir al directorio del frontend
cd apps/frontend

# 2. Instalar dependencias (o npm install desde la raíz del monorepo)
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con: VITE_API_URL=http://localhost:3000

# 4. Iniciar en desarrollo
npm run dev
# → http://localhost:5173
```

---

## Notas de diseño

- **Design system:** Notion-inspired. Paleta: Navy `#1C2333`, Amber `#F5A623`, Gray `#EAECF0`.
- **Dark/Light mode:** Toggle via `ThemeContext`, persiste en localStorage, clase `.dark` en `<html>`.
- **Responsive:** Mobile-first con Tailwind. Layout se adapta a 375px+.
- **Tipografía:** Sistema sans-serif con pesos semibold para títulos.
- **Componentes:** Esquinas `rounded-xl`, sombras sutiles, transiciones `duration-150`.
- **Estados:** Toda página implementa los 3 estados: loading (skeleton), error (con retry), vacío (con CTA).
