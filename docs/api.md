# API REST — FocusBoard Backend

> **Base URL:** `http://localhost:3000`  
> **Autenticación:** Cookies httpOnly (`accessToken` + `refreshToken`)  
> **Content-Type:** `application/json`

---

## Índice de endpoints

| # | Método | Ruta | Auth | Descripción |
|---|--------|------|------|-------------|
| 1 | POST | `/api/auth/register` | No | Registro de usuario |
| 2 | POST | `/api/auth/login` | No | Inicio de sesión |
| 3 | POST | `/api/auth/refresh` | Cookie | Renovar access token |
| 4 | POST | `/api/auth/logout` | Cookie | Cerrar sesión |
| 5 | GET | `/api/auth/me` | Sí | Perfil del usuario |
| 6 | POST | `/api/v1/rooms` | Sí | Crear sala |
| 7 | GET | `/api/v1/rooms` | Sí | Listar salas públicas |
| 8 | GET | `/api/v1/rooms/:code` | Sí | Obtener sala por código |
| 9 | POST | `/api/v1/rooms/:code/join` | Sí | Unirse a sala |
| 10 | DELETE | `/api/v1/rooms/:code/leave` | Sí | Salir de sala |
| 11 | DELETE | `/api/v1/rooms/:id` | Sí | Eliminar sala |
| 12 | POST | `/api/v1/sessions` | Sí | Guardar sesión Pomodoro |
| 13 | GET | `/api/v1/sessions/today-count` | Sí | Contar sesiones de hoy |
| 14 | GET | `/api/v1/sessions/today` | Sí | Sesiones de hoy |
| 15 | GET | `/api/v1/sessions/week` | Sí | Sesiones semanales |
| 16 | GET | `/api/v1/sessions/stats` | Sí | Estadísticas |
| 17 | GET | `/api/v1/cron/cleanup` | Header | Limpiar salas inactivas |
| 18 | GET | `/health` | No | Health check |

---

## Endpoints detallados

### 1. `POST /api/auth/register`

Registra un nuevo usuario. Crea registro en `users` + `user_settings` en transacción atómica.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "miPassword123",
  "fullName": "Juan Pérez"
}
```

**Response 201:**
```json
{
  "message": "Usuario registrado correctamente",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errores:**
| Código | Significado |
|--------|-------------|
| 409 | El email ya está registrado |
| 400 | Validación falló (Zod) |

**Cookies seteadas:** `accessToken` (15min), `refreshToken` (7d) — httpOnly, sameSite strict, secure en producción.

---

### 2. `POST /api/auth/login`

Autentica usuario con email y password. Rate limited a 10 intentos por 15 minutos por IP.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "miPassword123"
}
```

**Response 200:**
```json
{
  "message": "Sesión iniciada correctamente",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errores:**
| Código | Significado |
|--------|-------------|
| 401 | Credenciales inválidas |
| 403 | Cuenta desactivada |
| 429 | Demasiados intentos (rate limit) |

---

### 3. `POST /api/auth/refresh`

Renueva el access token usando el refresh token de la cookie. Verifica que el refresh token no esté revocado (via jti).

**Request:** (sin body, usa cookie)
```
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIs...
```

**Response 200:**
```json
{
  "message": "Access token renovado",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errores:**
| Código | Significado |
|--------|-------------|
| 401 | Refresh token no encontrado, inválido, expirado o revocado |

---

### 4. `POST /api/auth/logout`

Revoca el refresh token (marca `revoked_at` en BD) y limpia las cookies.

**Request:** (sin body, usa cookie)

**Response 200:**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

### 5. `GET /api/auth/me`

Obtiene el perfil del usuario autenticado.

**Headers:**
```
Cookie: accessToken=eyJhbGciOiJIUzI1NiIs...
```

**Response 200:**
```json
{
  "message": "Información del usuario",
  "data": {
    "id": 1,
    "email": "usuario@example.com",
    "fullName": "Juan Pérez",
    "avatarUrl": null,
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errores:**
| Código | Significado |
|--------|-------------|
| 401 | No autenticado (token faltante o inválido) |
| 404 | Usuario no encontrado |

---

### 6. `POST /api/v1/rooms`

Crea una nueva sala. El creador se agrega automáticamente como primer miembro (owner).

**Request:**
```json
{
  "name": "Sala de estudio",
  "isPublic": true,
  "maxMembers": 10
}
```

**Response 201:**
```json
{
  "message": "Sala creada exitosamente",
  "data": {
    "id": 1,
    "name": "Sala de estudio",
    "code": "A3F9B1C2",
    "is_public": true,
    "max_members": 10,
    "owner_id": 1,
    "last_activity": "2025-01-15T12:00:00.000Z",
    "created_at": "2025-01-15T12:00:00.000Z"
  }
}
```

**Errores:** 401 (no autenticado), 400 (validación)

---

### 7. `GET /api/v1/rooms`

Lista salas públicas con búsqueda y paginación. Cacheado en Redis por 30 segundos.

**Query params:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `search` | string | — | Búsqueda por nombre (ILIKE) |
| `limit` | number | 20 | Máximo resultados (1-100) |
| `offset` | number | 0 | Paginación |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Sala de estudio",
      "code": "A3F9B1C2",
      "max_members": 10,
      "owner_id": 1,
      "last_activity": "2025-01-15T12:00:00.000Z",
      "member_count": 3,
      "activeMembers": 2
    }
  ]
}
```

---

### 8. `GET /api/v1/rooms/:code`

Obtiene una sala por su código de 8 caracteres.

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "name": "Sala de estudio",
    "code": "A3F9B1C2",
    "is_public": true,
    "max_members": 10,
    "owner_id": 1,
    "last_activity": "2025-01-15T12:00:00.000Z",
    "created_at": "2025-01-15T12:00:00.000Z"
  }
}
```

**Errores:** 404 (sala no encontrada)

---

### 9. `POST /api/v1/rooms/:code/join`

El usuario autenticado se une a una sala por código.

**Response 200:**
```json
{
  "message": "Te has unido a la sala exitosamente",
  "data": { "...room..." }
}
```

**Errores:**
| Código | Significado |
|--------|-------------|
| 404 | Sala no encontrada |
| 409 | Sala llena o ya eres miembro |

---

### 10. `DELETE /api/v1/rooms/:code/leave`

El usuario autenticado sale de una sala. Emite evento Socket.IO.

**Response 200:**
```json
{
  "message": "Has salido de la sala exitosamente"
}
```

**Errores:** 404, 409 (no eres miembro)

---

### 11. `DELETE /api/v1/rooms/:id`

Elimina una sala (solo owner). Emite eventos Socket.IO a todos los miembros.

**Response 200:**
```json
{
  "message": "Sala eliminada exitosamente"
}
```

**Errores:**
| Código | Significado |
|--------|-------------|
| 404 | Sala no encontrada |
| 403 | No eres el owner |

---

### 12. `POST /api/v1/sessions`

Guarda una sesión Pomodoro completada. Si `roomId` está presente, verifica que el usuario sea miembro de esa sala.

**Request:**
```json
{
  "taskLabel": "Escribir documentación",
  "duration": 1500,
  "startedAt": "2025-01-15T11:30:00.000Z",
  "roomId": 1
}
```

**Response 201:**
```json
{
  "message": "Pomodoro session saved successfully"
}
```

**Errores:** 400 (validación), 401, 403 (no miembro de la sala)

---

### 13. `GET /api/v1/sessions/today-count`

Cuenta las sesiones completadas hoy.

**Response 200:**
```json
{
  "data": { "count": 3 }
}
```

---

### 14. `GET /api/v1/sessions/today`

Lista las sesiones de hoy ordenadas por fecha descendente.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "task_label": "Escribir documentación",
      "duration": 1500,
      "status": "completed",
      "started_at": "2025-01-15T11:30:00.000Z",
      "ended_at": "2025-01-15T11:55:00.000Z"
    }
  ]
}
```

---

### 15. `GET /api/v1/sessions/week`

Sesiones agrupadas por día, últimos 7 días.

**Response 200:**
```json
{
  "data": [
    {
      "day": "2025-01-15T00:00:00.000Z",
      "count": 3,
      "total_duration": 4500
    }
  ]
}
```

---

### 16. `GET /api/v1/sessions/stats`

Estadísticas globales. Cacheado en Redis por 5 minutos.

**Response 200:**
```json
{
  "data": {
    "totalPomodoros": 45,
    "totalMinutes": 1125,
    "currentStreak": 5
  },
  "cached": false
}
```

- `totalPomodoros`: sesiones completadas totales
- `totalMinutes`: suma de duración en minutos
- `currentStreak`: días consecutivos con al menos una sesión completada (calculado con window function)

---

### 17. `GET /api/v1/cron/cleanup`

Endpoint para cron jobs. Elimina salas con `last_activity < 24h`. Requiere header secreto.

**Headers:**
```
x-cron-secret: tu-cron-secret
```

**Response 200:**
```json
{
  "deleted": 2
}
```

**Errores:** 401 (x-cron-secret inválido)

---

### 18. `GET /health`

Health check simple.

**Response 200:**
```json
{
  "status": "ok"
}
```

---

## Códigos de error globales

| Código | Significado |
|--------|-------------|
| 400 | Validation error (Zod) — campo inválido o faltante |
| 401 | No autenticado — token faltante, inválido o expirado |
| 403 | Prohibido — no tienes permisos para esta acción |
| 404 | Recurso no encontrado |
| 409 | Conflicto — recurso duplicado o estado inválido |
| 429 | Too Many Requests — rate limit excedido |
| 500 | Error interno del servidor |

### Formato de error

```json
{
  "error": "El email ya está registrado"
}
```

Para errores de validación (400), puede incluir `details`:

```json
{
  "error": "Validation failed",
  "details": {
    "password": ["Mínimo 8 caracteres"]
  }
}
```

---
