# Contextos React — FocusBoard Frontend

---

## Índice

- [AuthContext](#authcontext)
- [ThemeContext](#themecontext)
- [auth.context.ts](#authcontextts)
- [Cuándo usar Context vs props](#cuándo-usar-context-vs-props)

---

## AuthContext

**Archivo:** `src/context/AuthContext.tsx`  
**Provider:** `AuthProvider`  
**Hook de acceso:** `useAuth()` en `src/hooks/useAuth.ts`

### Qué comparte

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `user` | `User \| null` | Usuario autenticado o `null` |
| `isAuthenticated` | `boolean` | `true` si hay sesión activa |
| `isLoading` | `boolean` | `true` mientras se verifica la sesión inicial |
| `error` | `string \| null` | Último error de auth |
| `login()` | `(email, password) => Promise<void>` | Inicia sesión |
| `register()` | `(email, password, fullName) => Promise<void>` | Registra nuevo usuario |
| `logout()` | `() => Promise<void>` | Cierra sesión |
| `clearError()` | `() => void` | Limpia el error |

### Cómo funciona

1. **Montaje:** Al cargar `AuthProvider`, se llama a `GET /api/auth/me` con las cookies existentes:
   ```ts
   useEffect(() => {
     apiCall<User>("/api/auth/me")
       .then((user) => setUser(user))
       .catch(() => setUser(null))
       .finally(() => setIsLoading(false));
   }, []);
   ```

2. **Login:** Llama a `loginUser()`, si成功了, llama a `GET /api/auth/me` para obtener el perfil:
   ```ts
   const login = async (email: string, password: string) => {
     setError(null);
     await loginUser({ email, password });
     const user = await apiCall<User>("/api/auth/me");
     setUser(user);
   };
   ```

3. **Logout:** Llama a `POST /api/auth/logout`, limpia el estado:
   ```ts
   const logout = async () => {
     await fetch(`${env.apiUrl}/api/auth/logout`, {
       method: "POST",
       credentials: "include",
     });
     setUser(null);
   };
   ```

4. **Register:** Similar a login, llama a `registerUser()` y luego obtiene el perfil.

### Dónde se consume

- `useAuth()` hook (toda la app)
- `ProtectedRoute` y `PublicRoute` para decidir redirecciones
- `Sidebar` para mostrar avatar, nombre y botón de logout
- `LoginForm` y `RegisterForm` para enviar credenciales
- `Dashboard` para saludo personalizado

---

## auth.context.ts

**Archivo:** `src/context/auth.context.ts`  
**Exporta:** `AuthContext`

Solo crea el contexto raw para evitar dependencia circular:

```ts
import { createContext } from "react";
import type { AuthContextType } from "../types/auth.ts";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

Esto permite que `useAuth` importe el contexto sin importar el Provider.

---

## ThemeContext

**Archivo:** `src/context/ThemeContext.tsx`  
**Provider:** `ThemeProvider`  
**Hook de acceso:** `useTheme()` (exportado desde el mismo archivo)

### Qué comparte

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `theme` | `"light" \| "dark"` | Tema actual |
| `toggleTheme` | `() => void` | Cambia entre light y dark |

### Persistencia en localStorage

```ts
const STORAGE_KEY = "focusboard:theme";

const getInitialTheme = (): "light" | "dark" => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
```

1. Al montar, lee `localStorage` o la preferencia del sistema.
2. Al cambiar tema, actualiza `localStorage` y la clase `.dark` en `<html>`:
   ```ts
   const toggleTheme = useCallback(() => {
     setTheme((prev) => {
       const next = prev === "light" ? "dark" : "light";
       localStorage.setItem(STORAGE_KEY, next);
       document.documentElement.classList.toggle("dark", next === "dark");
       return next;
     });
   }, []);
   ```

### Dónde se consume

- `Sidebar.tsx` — botón de toggle con iconos Sol/Luna
- `Login.tsx`, `Register.tsx` — toggle de tema en páginas públicas
- Toda la app via clases CSS `dark:` en Tailwind

### Ubicación en el árbol

```tsx
// main.tsx
<StrictMode>
  <ThemeProvider>        {/* Global: before Router */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
</StrictMode>
```

`ThemeProvider` está fuera de `BrowserRouter` porque el tema no depende del routing.

---

## Cuándo usar Context vs props

### Usamos Context cuando:

1. **Estado global que muchos componentes necesitan:**
   - `AuthContext`: usuario, estado de autenticación — necesario en Sidebar, ProtectedRoute, páginas, formularios.
   - `ThemeContext`: tema oscuro/claro — necesario en todos los componentes con clases `dark:`.

2. **Estado que cruza múltiples niveles de componentes sin relación directa:**
   - `user` lo necesita `Dashboard` (hijo de ProtectedRoute, que está dentro de Layout, que tiene Sidebar).

### Usamos props cuando:

1. **Estado local a un componente y sus hijos directos:**
   ```tsx
   <TaskDeclarationModal
     isOpen={isModalOpen}
     onClose={() => setIsModalOpen(false)}
     onStart={handleTaskSubmit}
     recentTasks={recentTasks}
   />
   ```

2. **Configuración de componentes reutilizables:**
   ```tsx
   <PageHeader
     title="Historial"
     subtitle="Tu productividad"
     actions={<button>Filtrar</button>}
   />
   ```

3. **Callbacks de eventos:**
   ```tsx
   <TimerDisplay
     focusDuration={25 * 60}
     breakDuration={5 * 60}
     onSessionSaved={handleSessionSaved}
   />
   ```

### Regla práctica
- ¿Más de 3 niveles de profundidad sin relación directa? → **Context**
- ¿Componente reutilizable en múltiples contextos? → **Props**
- ¿Estado de formulario local? → Estado local + props al hijo

---
