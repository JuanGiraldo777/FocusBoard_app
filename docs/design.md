# Arquitectura del Sistema — FocusBoard

---

## Diagrama de capas (textual)

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │   Pages   │  │Components│  │      Hooks         │  │
│  │ (Router) │  │  (UI)    │  │ (useTimer, useAuth) │  │
│  └────┬─────┘  └────┬─────┘  └─────────┬──────────┘  │
│       │              │                  │              │
│       └──────────────┴──────────────────┘              │
│                          │                             │
│                   ┌──────┴──────┐                      │
│                   │  Services   │  ← fetch/apiCall     │
│                   │ (api layer) │                      │
│                   └──────┬──────┘                      │
└──────────────────────────┼─────────────────────────────┘
                           │ HTTP (JSON)
                           │ credentials: "include"
                           │
┌──────────────────────────┼─────────────────────────────┐
│                    BACKEND (Express)                     │
│                   ┌──────┴──────┐                      │
│                   │   Routes    │  ← define endpoints   │
│                   └──────┬──────┘                      │
│                          │                             │
│                   ┌──────┴──────┐                      │
│                   │ Middleware   │  ← auth, validation  │
│                   └──────┬──────┘                      │
│                          │                             │
│                   ┌──────┴──────┐                      │
│                   │ Controllers │  ← parse req, res    │
│                   └──────┬──────┘                      │
│                          │                             │
│                   ┌──────┴──────┐                      │
│                   │  Services   │  ← business logic    │
│                   └──────┬──────┘                      │
│                          │                             │
│                   ┌──────┴──────┐                      │
│                   │Repositories│  ← SQL queries        │
│                   └──────┬──────┘                      │
└──────────────────────────┼─────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │ PostgreSQL  │
                    │   + Redis   │
                    └─────────────┘
```

---

## Estructura del monorepo

```
focusboard_app/
├── package.json              # npm workspaces root
├── turbo.json                # Turborepo config
├── packages/
│   └── shared/               # @focusboard/shared
│       └── src/index.ts      # Interfaces: User, Room, PomodoroSession
├── apps/
│   ├── backend/
│   │   ├── src/
│   │       ├── config/       # env.ts, database.ts, redis.ts
│   │       ├── routes/       # auth, room, pomodoro-sessions, cron
│   │       ├── controllers/  # auth, room, pomodoro-sessions, cron
│   │       ├── services/     # auth, room, pomodoro-sessions, cron
│   │       ├── repositories/ # user, room, pomodoro-session
│   │       ├── middleware/   # auth, validation, rateLimit, etc.
│   │       ├── validators/   # Zod schemas: room, session, cron
│   │       ├── sockets/      # room.socket.ts (Socket.IO)
│   │       ├── mappers/      # user.mapper.ts (DB → DTO)
│   │       ├── migrations/   # 9 migraciones de BD
│   │       └── types/        # errors.ts, room.locals.ts
│   └── frontend/
│       └── src/
│           ├── components/   # 10 componentes UI
│           ├── pages/        # 9 páginas
│           ├── hooks/        # 6 hooks personalizados
│           ├── context/      # AuthContext, ThemeContext
│           ├── services/     # 6 servicios de red
│           ├── utils/        # api.ts, room-code.ts, timer.worker.ts
│           ├── types/        # auth.ts, timer.ts
│           └── config/       # env.ts (VITE_API_URL)
└── docs/                     # Documentación
```

---

## Decisiones de arquitectura

### 1. Monorepo con Turborepo
- **Por qué**: Un solo repositorio facilita compartir tipos entre backend y frontend via `@focusboard/shared`, y Turborepo cachea builds para acelerar el pipeline.
- **Trade-off**: Mayor peso inicial de configuración, pero evita duplicar interfaces TypeScript.

### 2. Capas estrictas: Routes → Controllers → Services → Repositories
- **Por qué**: Cada capa tiene una responsabilidad única. Routes solo definen rutas y middleware. Controllers manejan req/res. Services tienen lógica de negocio. Repositories ejecutan SQL.
- **Ejemplo**: Para crear una sala, el flujo es:
  ```
  POST /api/v1/rooms
    → room.validation.ts (valida body)
    → createRoom() controller (extrae userId)
    → roomService.createRoom() (genera código, inicia transacción)
    → roomRepository.createRoom() + addMember() (SQL)
  ```

### 3. Zod para validación en backend y frontend
- **Por qué**: Validación declarativa en el esquema. Los mismos Zod schemas podrían compartirse. Tipos inferidos automáticamente con `z.infer`.
- **Uso**: `createSessionSchema`, `registerSchema`, `createRoomSchema` — todos parsean y tipan en un solo paso.

### 4. Cookies httpOnly para JWT en vez de localStorage
- **Por qué**: Las cookies httpOnly no son accesibles desde JavaScript, eliminando ataques XSS que robarían tokens. `sameSite: "strict"` protege contra CSRF.
- **Trade-off**: Requiere que frontend y backend estén en el mismo dominio (o CORS configurado).

### 5. Redis para caché y rate limiting
- **Por qué**: Upstash (Redis serverless) sin administración de servidor. Se usa para:
  - Cachear lista de salas públicas (30s TTL)
  - Cachear stats de Pomodoro (5min TTL)
  - Rate limiting de login (10 intentos / 15 min por IP)
  - Contar miembros activos por sala (SETs)
  - Socket.IO adapter para escalar horizontalmente

### 6. Web Worker para el timer Pomodoro
- **Por qué**: Los navegadores throttlean los `setInterval`/`setTimeout` en pestañas en background. Un Web Worker corre en un hilo separado sin throttling.

---

## Flujo de datos frontend → backend → BD

### Registro de usuario
```
RegisterForm (submit)
  → useRegisterForm.handleSubmit()
  → AuthContext.register(email, password, fullName)
  → auth.service.ts: registerUser(payload)
  → fetch POST /api/auth/register (credentials: "include")
  → auth.routes.ts → validateRegister (middleware)
  → authController.register
  → authService.register(data)
     → bcrypt.hash(password, 12)
     → userRepository.createWithSettings(data)
        → BEGIN TRANSACTION
        → INSERT INTO users
        → INSERT INTO user_settings
        → COMMIT
  → genera JWT (accessToken 15m, refreshToken 7d)
  → establece cookies httpOnly en response
  ← 201 { message, data: { accessToken, refreshToken } }
  → AuthContext.login() (guarda user en estado)
  → redirige a /dashboard
```

### Guardar sesión Pomodoro
```
TimerDisplay (timer completes)
  → handleComplete callback
  → savePomodoroSession({ taskLabel, duration, startedAt })
  → apiCall POST /api/v1/sessions
  → pomodoro-sessions.routes.ts → validateCreateSession
  → pomodoroSessionController.create
  → pomodoroSessionService.createSession(userId, data)
     → valida room membership (si aplica)
     → INSERT INTO pomodoro_sessions
  ← 201
  → onSessionSaved callback
  → Dashboard actualiza contador
```

---

## Diseño del sistema de autenticación

### Tokens
- **Access Token**: JWT, expira en 15 minutos. Claims: `{ sub: userId, email }`. Firmado con `ACCESS_TOKEN_SECRET` (mínimo 64 caracteres).
- **Refresh Token**: JWT, expira en 7 días. Claims: `{ sub: userId, jti: uuid }`. Firmado con `REFRESH_TOKEN_SECRET` (mínimo 64 caracteres).
- Ambos se almacenan en **cookies httpOnly**, no en localStorage.

### Flujo de autenticación

```
1. Register/Login → backend setea cookies accessToken + refreshToken
2. Cada request → cookie accessToken se envía automáticamente
3. verifyAccessToken middleware → lee cookie, verifica JWT, setea req.user
4. Si accessToken expiró (401) → frontend hace POST /api/auth/refresh
5. Backend verifica refreshToken, genera nuevo accessToken
6. Si refreshToken expiró → frontend redirige a /login
```

### Refresh token con revocación
- Cada refresh token tiene un `jti` (JWT ID) único (UUID v4).
- Al hacer login, se guarda un hash del refresh token + jti en la tabla `refresh_tokens`.
- Al hacer logout, se setea `revoked_at = NOW()` para ese jti.
- Al refrescar, se verifica que `revoked_at IS NULL`.

### Rate limiting de login
- Redis key: `login_attempts:{ip}`
- Máximo 10 intentos por ventana de 15 minutos.
- Respuesta: `429 Too Many Requests`.

### Protección CSRF
- `sameSite: "strict"` en cookies.
- Solo se permiten orígenes configurados en `CORS_ORIGIN` (localhost en dev).

---
