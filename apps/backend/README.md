# FocusBoard — Backend API

![Node](https://img.shields.io/badge/Node-22-339933?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-5-000?style=flat-square&logo=express)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)

API REST + WebSockets para FocusBoard. Gestiona autenticación con JWT en cookies httpOnly, salas colaborativas en tiempo real con Socket.IO, sesiones Pomodoro con PostgreSQL y caché con Redis.

---

## Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | 22.x | Runtime |
| Express | 5.x | Framework HTTP |
| TypeScript | 6.0 | Tipado estático |
| PostgreSQL (pg) | 8.x | Base de datos relacional |
| Redis (ioredis) | 5.x | Caché, rate limiting, Socket.IO adapter |
| Socket.IO | 4.x | WebSocket bidireccional |
| node-pg-migrate | 8.x | Migraciones de base de datos |
| Zod | 4.x | Validación de esquemas |
| jsonwebtoken | 9.x | JWT |
| bcrypt | 6.x | Hashing de contraseñas |

---

## Arquitectura

```
HTTP Request
    │
    ▼
┌─────────────┐
│   Routes    │  Define path + middleware + controller
└─────┬───────┘
      │
┌─────▼───────┐
│  Middleware  │  verifyAccessToken, validate*, rateLimitLogin
└─────┬───────┘
      │
┌─────▼──────────┐
│  Controllers   │  Parse req/res, llaman a servicios
└─────┬──────────┘
      │
┌─────▼──────────┐
│   Services     │  Lógica de negocio, transacciones
└─────┬──────────┘
      │
┌─────▼────────────┐
│  Repositories    │  Consultas SQL
└─────┬────────────┘
      │
┌─────▼─────┐
│ PostgreSQL │
│  + Redis   │
└───────────┘
```

---

## Estructura de carpetas

```
src/
├── index.ts                    # Entry point: connect DB, init Redis, start server
├── app.ts                      # Express app factory + Socket.IO setup
│
├── config/
│   ├── env.ts                  # Zod-validated environment variables
│   ├── database.ts             # pg.Pool con healthCheck y connectDB
│   ├── redis.ts                # Cliente Redis Upstash con fallback a mock
│   ├── redis-mock.ts           # Mock en memoria para desarrollo local
│   └── redis.types.ts          # Interface IRedisClient
│
├── routes/
│   ├── auth.routes.ts          # POST /api/auth/{register,login,refresh,logout} + GET /api/auth/me
│   ├── room.routes.ts          # CRUD de salas bajo /api/v1/rooms
│   ├── pomodoro-sessions.routes.ts  # Sesiones bajo /api/v1/sessions
│   └── cron.routes.ts          # GET /api/v1/cron/cleanup
│
├── controllers/
│   ├── auth.controller.ts      # register, login, refresh, logout, me
│   ├── room.controller.ts      # create, getByCode, list, join, leave, delete
│   ├── pomodoro-sessions.controller.ts  # create, getTodayCount, getTodaySessions, getWeekSessions, getStats
│   └── cron.controller.ts      # cleanupInactiveRooms
│
├── services/
│   ├── auth.service.ts         # Registro con hash bcrypt, login con jti, refresh con revocación
│   ├── room.service.ts         # Creación con código único, join/leave, miembros activos en Redis
│   ├── pomodoro-sessions.service.ts  # CRUD de sesiones, cálculo de racha con window function
│   └── cron.service.ts         # Limpieza de salas inactivas + Redis cleanup
│
├── repositories/
│   ├── user.repository.ts      # findByEmail, createWithSettings (transacción), refresh token CRUD
│   ├── room.repository.ts      # CRUD de salas con transacciones, conteo de miembros
│   └── pomodoro-session.repository.ts  # Insert, count, list, stats semanales
│
├── middleware/
│   ├── auth.ts                 # verifyAccessToken — lee cookie, verifica JWT, setea req.user
│   ├── validation.ts           # validateRegister, validateLogin (Zod)
│   ├── errorHandler.ts         # Central error handler con statusCode
│   ├── rateLimit.ts            # Rate limiting de login (Redis, 10 intentos / 15 min)
│   ├── room.validation.ts      # validateCreateRoom, validateListRoomsQuery, validateRoomCodeParams, validateRoomIdParams
│   ├── session.validation.ts   # validateCreateSession (Zod)
│   └── cron.validation.ts      # validateCronSecret (header x-cron-secret)
│
├── validators/
│   ├── session.validator.ts    # createSessionSchema: taskLabel, duration, startedAt, opcional roomId
│   ├── room.validator.ts       # createRoomSchema, listRoomsQuerySchema, roomCodeParamsSchema, roomIdParamsSchema
│   └── cron.validator.ts       # cronCleanupHeadersSchema
│
├── sockets/
│   └── room.socket.ts          # Eventos: room:join, room:leave, room:ping, disconnect
│
├── migrations/                 # 9 migraciones node-pg-migrate
│   ├── ...0001_create-users.js
│   ├── ...0002_create-user-settings.js
│   ├── ...0003_create-rooms.js
│   ├── ...0004_create-room-members.js
│   ├── ...0005_create-pomodoro-sessions.js
│   ├── ...0006_create-refresh-tokens.js
│   ├── ...0007_add-token-jti-to-refresh-tokens.js
│   ├── ...0008_alter-rooms-add-columns.js
│   └── ...0009_cleanup-rooms-columns.js
│
├── mappers/
│   └── user.mapper.ts          # toDTO: DB snake_case → shared User interface
│
└── types/
    ├── errors.ts               # AppError, createAppError factory
    └── room.locals.ts          # RoomLocals type para res.locals
```

---

## Endpoints de la API

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción | Body | Response |
|--------|------|------|-------------|------|----------|
| POST | `/register` | No | Registrar usuario | `{ email, password, fullName }` | 201 `{ message, data: { accessToken, refreshToken } }` |
| POST | `/login` | No | Iniciar sesión | `{ email, password }` | 200 `{ message, data: { accessToken, refreshToken } }` |
| POST | `/refresh` | Cookie | Renovar access token | — | 200 `{ message, data: { accessToken } }` |
| POST | `/logout` | Cookie | Cerrar sesión | — | 200 `{ message }` |
| GET | `/me` | Sí | Perfil del usuario | — | 200 `{ message, data: UserDTO }` |

### Salas (`/api/v1/rooms`)

| Método | Ruta | Middleware extra | Descripción | Body / Query | Response |
|--------|------|-----------------|-------------|-------------|----------|
| GET | `/` | `validateListRoomsQuery` | Listar salas públicas | `?search=&limit=20&offset=0` | 200 `{ data: RoomListItem[] }` |
| POST | `/` | `validateCreateRoom` | Crear sala | `{ name, isPublic, maxMembers }` | 201 `{ message, data: Room }` |
| GET | `/:code` | `validateRoomCodeParams` | Obtener sala por código | — | 200 `{ data: Room }` |
| POST | `/:code/join` | `validateRoomCodeParams` | Unirse a sala | — | 200 `{ message, data: Room }` |
| DELETE | `/:code/leave` | `validateRoomCodeParams` | Salir de sala | — | 200 `{ message }` |
| DELETE | `/:id` | `validateRoomIdParams` | Eliminar sala (owner) | — | 200 `{ message }` |

### Sesiones Pomodoro (`/api/v1/sessions`)

| Método | Ruta | Descripción | Body / Response |
|--------|------|-------------|-----------------|
| POST | `/sessions` | Guardar sesión completada | `{ taskLabel, duration, startedAt, roomId? }` → 201 |
| GET | `/sessions/today-count` | Contar sesiones de hoy | → 200 `{ data: { count } }` |
| GET | `/sessions/today` | Sesiones de hoy | → 200 `{ data: Session[] }` |
| GET | `/sessions/week` | Sesiones agrupadas por día (7 días) | → 200 `{ data: WeekDay[] }` |
| GET | `/sessions/stats` | Estadísticas globales (cache 5 min Redis) | → 200 `{ data: { totalPomodoros, totalMinutes, currentStreak }, cached }` |

### Cron

| Método | Ruta | Auth | Descripción | Response |
|--------|------|------|-------------|----------|
| GET | `/api/v1/cron/cleanup` | Header `x-cron-secret` | Eliminar salas inactivas (>24h) | 200 `{ deleted: number }` |

### Health

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Health check → `{ "status": "ok" }` |

---

## Base de datos

### Tablas

#### `users`
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| id | `bigserial` | PK |
| email | `varchar(255)` | NOT NULL, UNIQUE |
| password_hash | `text` | NOT NULL |
| full_name | `varchar(120)` | |
| avatar_url | `text` | |
| is_active | `boolean` | NOT NULL, DEFAULT true |
| created_at | `timestamptz` | NOT NULL, DEFAULT now() |
| updated_at | `timestamptz` | NOT NULL, DEFAULT now() |

#### `user_settings`
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| user_id | `bigint` | PK, FK → users(id) ON DELETE CASCADE |
| focus_duration_min | `integer` | NOT NULL, DEFAULT 25, CHECK > 0 |
| short_break_min | `integer` | NOT NULL, DEFAULT 5, CHECK > 0 |
| long_break_min | `integer` | NOT NULL, DEFAULT 15, CHECK > 0 |
| daily_goal | `integer` | NOT NULL, DEFAULT 8, CHECK > 0 |
| sound_enabled | `boolean` | NOT NULL, DEFAULT true |
| theme | `varchar(20)` | NOT NULL, DEFAULT 'system' |

#### `rooms`
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| id | `bigserial` | PK |
| owner_id | `bigint` | NOT NULL, FK → users(id) ON DELETE CASCADE |
| name | `varchar(120)` | NOT NULL |
| description | `text` | |
| code | `varchar(8)` | UNIQUE |
| is_public | `boolean` | NOT NULL, DEFAULT true |
| max_members | `integer` | NOT NULL, DEFAULT 10 |
| last_activity | `timestamptz` | DEFAULT now() |
| created_at | `timestamptz` | NOT NULL, DEFAULT now() |
| updated_at | `timestamptz` | NOT NULL, DEFAULT now() |

#### `room_members`
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| room_id | `bigint` | PK (composite), FK → rooms(id) ON DELETE CASCADE |
| user_id | `bigint` | PK (composite), FK → users(id) ON DELETE CASCADE |
| role | `varchar(20)` | NOT NULL, DEFAULT 'member', CHECK IN ('owner','admin','member') |
| joined_at | `timestamptz` | NOT NULL, DEFAULT now() |

#### `pomodoro_sessions`
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| id | `bigserial` | PK |
| user_id | `bigint` | NOT NULL, FK → users(id) ON DELETE CASCADE |
| room_id | `bigint` | FK → rooms(id) ON DELETE SET NULL |
| task_label | `varchar(255)` | |
| started_at | `timestamptz` | NOT NULL, DEFAULT now() |
| ended_at | `timestamptz` | |
| duration_seconds | `integer` | NOT NULL, CHECK > 0 |
| status | `varchar(20)` | NOT NULL, DEFAULT 'completed', CHECK IN ('completed','cancelled','interrupted') |

#### `refresh_tokens`
| Columna | Tipo | Restricciones |
|---------|------|---------------|
| id | `bigserial` | PK |
| user_id | `bigint` | NOT NULL, FK → users(id) ON DELETE CASCADE |
| token_hash | `text` | NOT NULL, UNIQUE |
| token_jti | `uuid` | UNIQUE |
| expires_at | `timestamptz` | NOT NULL |
| revoked_at | `timestamptz` | |
| last_used_at | `timestamptz` | |
| user_agent | `text` | |
| ip_address | `inet` | |

---

## Migraciones

```bash
# Ejecutar migraciones pendientes (todas las UP)
DATABASE_URL=postgresql://usuario:password@host:5432/focusboard npm run migrate:up

# Revertir última migración
DATABASE_URL=postgresql://usuario:password@host:5432/focusboard npm run migrate:down
```

Las migraciones usan `node-pg-migrate`. Los archivos están en `src/migrations/` con timestamp como prefijo para orden. Se ejecutan en secuencia numérica.

---

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `NODE_ENV` | No | `development` | Entorno de ejecución |
| `PORT` | No | `3000` | Puerto del servidor |
| `DATABASE_URL` | Sí | — | URL de conexión PostgreSQL |
| `REDIS_URL` | Sí | — | URL de conexión Redis (Upstash con TLS) |
| `ACCESS_TOKEN_SECRET` | Sí | — | Secreto JWT (mínimo 64 caracteres) |
| `REFRESH_TOKEN_SECRET` | Sí | — | Secreto JWT (mínimo 64 caracteres, distinto) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Origen permitido para CORS |
| `CRON_SECRET` | Sí | — | Secreto para endpoint de cron (`x-cron-secret`) |

---

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor con `node --watch` (hot reload) en `localhost:3000` |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run lint` | ESLint sobre el código fuente |
| `npm run migrate:up` | Ejecuta migraciones UP pendientes |
| `npm run migrate:down` | Revierte la última migración |

---

## Configuración de desarrollo

```bash
# 1. Ir al directorio del backend
cd apps/backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env: DATABASE_URL, REDIS_URL, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, CRON_SECRET

# 4. Ejecutar migraciones
DATABASE_URL=postgresql://... npm run migrate:up

# 5. Iniciar en desarrollo
npm run dev
# → http://localhost:3000
# → Health: http://localhost:3000/health
```

---

## Seguridad

### HttpOnly Cookies
Los tokens JWT se almacenan en cookies `httpOnly` (no accesibles desde JavaScript), `sameSite: "strict"` (protege contra CSRF) y `secure` en producción. Esto elimina el riesgo de XSS robando tokens.

### Rate limiting
- **Endpoint:** `POST /api/auth/login`
- **Límite:** 10 intentos por ventana de 15 minutos
- **Almacenamiento:** Redis key `login_attempts:{ip}`
- **Respuesta:** `429 Too Many Requests`
- **Fallback:** Si Redis no está disponible, permite el acceso (fail open)

### Validación Zod
- Todos los inputs de endpoints POST/PUT pasan por validación Zod
- Los esquemas están en `src/validators/` y se ejecutan como middleware en `src/middleware/`
- Errores de validación devuelven `400` con detalles de campos

### CORS
- Solo el origen configurado en `CORS_ORIGIN` está permitido
- En desarrollo: `http://localhost:5173`
- En producción: URL del frontend desplegado
- Las cookies se envían solo al mismo origen (sameSite strict)

---

## WebSockets

### Eventos Socket.IO (implementados en `src/sockets/room.socket.ts`)

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `connection` | Cliente → Servidor | — | El cliente se conecta. El servidor lo une a su sala personal `user:{userId}` |
| `room:join` | Cliente → Servidor | `{ code }` | El cliente se une a la sala `room:{code}`. Servidor actualiza Redis SET y emite membresía |
| `room:members` | Servidor → Cliente | `RoomMember[]` | Lista inicial de miembros al unirse a una sala |
| `room:memberJoined` | Servidor → Cliente | `RoomMember` | Se emite a todos los miembros cuando alguien nuevo se une |
| `member:left` | Servidor → Cliente | `{ userId }` | Se emite cuando un miembro abandona la sala |
| `room:memberLeft` | Servidor → Cliente | `{ userId }` | Evento alternativo de salida de miembro |
| `room:ping` | Cliente → Servidor | `{ code }` | Heartbeat periódico (cada 25s) para detectar desconexiones |
| `room:deleted` | Servidor → Cliente | `{ code }` | Se emite a todos los miembros cuando el owner elimina la sala |
| `disconnect` | Cliente → Servidor | — | Limpieza de Redis SET y emisión de `member:left` a la sala |

### Funciones helper del socket

| Función | Descripción |
|---------|-------------|
| `emitMemberLeftToRoom(code, userId, socketId?)` | Emite evento de salida a todos en la sala |
| `emitRoomDeleted(code)` | Emite evento de eliminación a la sala |
| `emitToUser(userId, event, payload)` | Emite un evento a un usuario específico (via `user:{userId}` room) |
