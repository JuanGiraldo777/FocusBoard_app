# Sistema de Rutas — FocusBoard Frontend

---

## Tabla de rutas

| Path | Componente | Auth | Layout | Descripción |
|------|-----------|------|--------|-------------|
| `/` | `Navigate` → `/dashboard` | — | — | Redirección raíz |
| `/login` | `Login` | `PublicRoute` | No | Inicio de sesión |
| `/register` | `Register` | `PublicRoute` | No | Registro de usuario |
| `/dashboard` | `Dashboard` | `ProtectedRoute` | `Layout` | Página principal |
| `/rooms` | `RoomList` | `ProtectedRoute` | `Layout` | Listado de salas |
| `/history` | `History` | `ProtectedRoute` | `Layout` | Historial de productividad |
| `/room/:code` | `Room` | `ProtectedRoute` | `Layout` | Sala colaborativa |
| `/create-room` | `CreateRoom` | `ProtectedRoute` | `Layout` | Crear sala |
| `/join-room` | `JoinRoom` | `ProtectedRoute` | `Layout` | Unirse por código |
| `/join` | `Navigate` → `/join-room` | — | — | Alias redirect |
| `*` | `NotFound` | No | No | Página 404 |

---

## Definición en código

**Archivo:** `src/App.tsx`

```tsx
import { AuthProvider } from "./context/AuthContext.tsx";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { PublicRoute } from "./components/PublicRoute.tsx";
import { Layout } from "./components/Layout.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Login } from "./pages/Login.tsx";
import { Register } from "./pages/Register.tsx";
import { RoomList } from "./pages/RoomList.tsx";
import { Room } from "./pages/Room.tsx";
import { History } from "./pages/History.tsx";
import { CreateRoom } from "./pages/CreateRoom.tsx";
import { JoinRoom } from "./pages/JoinRoom.tsx";
import { NotFound } from "./pages/NotFound.tsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rutas públicas */}
        <Route
          path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><Register /></PublicRoute>}
        />

        {/* Rutas protegidas con Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <Layout><RoomList /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout><History /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:code"
          element={
            <ProtectedRoute>
              <Layout><Room /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-room"
          element={
            <ProtectedRoute>
              <Layout><CreateRoom /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/join-room"
          element={
            <ProtectedRoute>
              <Layout><JoinRoom /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Alias */}
        <Route path="/join" element={<Navigate to="/join-room" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
```

---

## Cómo funciona `ProtectedRoute`

**Archivo:** `src/components/ProtectedRoute.tsx`

```tsx
import { useAuth } from "../hooks/useAuth.ts";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

**Flujo:**
1. **isLoading = true**: Muestra spinner de carga (evita flash de redirect mientras se verifica la sesión)
2. **isAuthenticated = false**: Redirige a `/login` con `replace` (no guarda en historial)
3. **isAuthenticated = true**: Renderiza los children

---

## Cómo funciona `PublicRoute`

**Archivo:** `src/components/PublicRoute.tsx`

```tsx
import { useAuth } from "../hooks/useAuth.ts";
import { Navigate } from "react-router-dom";

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

**Flujo:**
1. **isLoading = true**: Spinner (evita flash si el usuario está autenticado)
2. **isAuthenticated = true**: Redirige a `/dashboard` (un usuario logueado no necesita ver login)
3. **isAuthenticated = false**: Renderiza login/register

---

## Página 404

**Archivo:** `src/pages/NotFound.tsx`

```tsx
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1C2333] flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <AlertCircle className="w-24 h-24 text-[#F5A623] mx-auto" />
        <h1 className="text-6xl font-bold text-[#1C2333] dark:text-white">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Página no encontrada
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-[#F5A623] text-white rounded-lg font-semibold"
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  );
}
```

- Captura cualquier ruta no definida via `path="*"`
- No usa `Layout` (sin sidebar, fondo centrado)
- Botón para volver al dashboard

---
