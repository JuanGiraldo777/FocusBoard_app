# FocusBoard

![Deploy](https://img.shields.io/badge/Frontend-Vercel-000?style=flat-square&logo=vercel)
![Deploy](https://img.shields.io/badge/API-Render-000?style=flat-square&logo=render)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

App de productividad Pomodoro con salas colaborativas en tiempo real.  
Combina sesiones de foco estructuradas con presencia social para combatir la procrastinación.

---

## Demo

*Completar después del despliegue:*

| Frontend (Vercel) | `https://focusboard.vercel.app` |
|-------------------|----------------------------------|
| API (Render)      | `https://focusboard-api.onrender.com` |
| Health Check      | `https://focusboard-api.onrender.com/health` |

**Pantallas principales:**
- `/login` / `/register` — Autenticación con validación en tiempo real
- `/dashboard` — Temporizador Pomodoro + progreso diario
- `/rooms` — Listado de salas públicas con búsqueda
- `/room/:code` — Sala colaborativa con miembros en tiempo real
- `/history` — Historial con gráfica semanal (Recharts)

---

## Stack tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Frontend | React | 19.x | UI por componentes |
| Frontend | TypeScript | 5.7 | Tipado estático |
| Frontend | Vite | 8.x | Build & dev server |
| Frontend | Tailwind CSS | 4.x | Estilos con dark mode |
| Frontend | React Router | 7.x | Enrutamiento SPA |
| Frontend | Recharts | 2.x | Gráficas de productividad |
| Frontend | Socket.IO Client | 4.x | WebSocket - salas |
| Frontend | Lucide React | latest | Iconos SVG |
| Backend | Node.js | 22.x | Runtime |
| Backend | Express | 4.x | Framework HTTP |
| Backend | TypeScript | 5.7 | Tipado estático |
| Backend | PostgreSQL (pg) | 8.x | Base de datos relacional |
| Backend | Redis (ioredis) | 5.x | Caché, rate limiting, Socket.IO adapter |
| Backend | Socket.IO | 4.x | WebSocket server |
| Backend | Zod | 3.x | Validación de esquemas |
| Backend | jsonwebtoken | 9.x | JWT |
| Backend | bcrypt | 5.x | Hashing de contraseñas |
| Infraestructura | Turborepo | 2.x | Monorepo orquestador |
| Infraestructura | Aiven | PostgreSQL 15+ | Base de datos en la nube |
| Infraestructura | Upstash | Redis 7 | Caché serverless |
| Infraestructura | Vercel | — | Hosting frontend |
| Infraestructura | Render | — | Hosting API |

---

## Estructura del repositorio

```
focusboard/
├── package.json              # Raíz del monorepo (npm workspaces + Turbo)
├── turbo.json                # Pipeline de tareas con caché
├── .gitignore
│
├── apps/
│   ├── backend/              # API REST + WebSocket + migraciones BD
│   │   ├── src/
│   │   │   ├── config/       # Variables de entorno, pool PostgreSQL, Redis
│   │   │   ├── routes/       # Definición de rutas Express
│   │   │   ├── controllers/  # Manejadores request/response
│   │   │   ├── services/     # Lógica de negocio
│   │   │   ├── repositories/ # Consultas SQL
│   │   │   ├── middleware/   # Auth, validación, rate limiting
│   │   │   ├── validators/   # Esquemas Zod
│   │   │   ├── sockets/      # Eventos Socket.IO
│   │   │   ├── migrations/   # Migraciones de base de datos
│   │   │   ├── mappers/      # DB → DTO
│   │   │   └── types/        # Interfaces y tipos
│   │   └── .env.example
│   │
│   └── frontend/             # SPA React + Tailwind
│       ├── src/
│       │   ├── components/   # 10 componentes UI
│       │   ├── pages/        # 9 páginas
│       │   ├── hooks/        # 6 hooks personalizados
│       │   ├── context/      # AuthContext, ThemeContext
│       │   ├── services/     # Capa de red (fetch + apiCall)
│       │   ├── utils/        # api.ts, timer.worker.ts
│       │   ├── types/        # Interfaces de tipos
│       │   └── config/       # env.ts
│       └── .env.example
│
├── packages/
│   └── shared/               # @focusboard/shared
│       └── src/index.ts      # Interfaces compartidas (User, Room, etc.)
│
└── docs/                     # Documentación
    ├── design.md
    ├── components.md
    ├── hooks.md
    ├── context.md
    ├── routing.md
    ├── forms.md
    ├── api.md
    ├── api-client.md
    ├── project-management.md
    ├── deployment.md
    └── testing.md
```

---

## Requisitos previos

- **Node.js** v20+
- **npm** v10+
- **PostgreSQL** 15+ (local o Aiven)
- **Redis** 7+ (Upstash o local)

---

## Instalación y desarrollo local

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/focusboard.git
cd focusboard
npm install
```

### 2. Configurar variables de entorno

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

Generar secretos JWT:

```bash
openssl rand -hex 32   # ACCESS_TOKEN_SECRET
openssl rand -hex 32   # REFRESH_TOKEN_SECRET (distinto)
```

Editar `apps/backend/.env` con los valores generados y las URLs de PostgreSQL y Redis.

### 3. Crear base de datos y migrar

```bash
# Solo si usas PostgreSQL local
createdb focusboard

# Las migraciones se ejecutan automáticamente al iniciar el backend.
# Para ejecutarlas manualmente:
npm run build -w @focusboard/backend
```

### 4. Iniciar en modo desarrollo

```bash
npm run dev
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |
| Health   | http://localhost:3000/health |

---

## Scripts disponibles

| Comando | Descripción | Dónde ejecutar |
|---------|-------------|----------------|
| `npm run dev` | Inicia frontend + backend concurrentemente | Raíz |
| `npm run build` | Build producción de todos los workspaces | Raíz |
| `npm run lint` | ESLint en todos los workspaces | Raíz |
| `npm run dev -w @focusboard/backend` | Solo backend | Raíz |
| `npm run dev -w @focusboard/frontend` | Solo frontend | Raíz |
| `npm run dev` (backend) | `tsx watch src/index.ts` | `apps/backend` |
| `npx tsc --noEmit` (backend) | Type check sin emitir | `apps/backend` |
| `npm run dev` (frontend) | `vite` con HMR | `apps/frontend` |
| `npm run build` (frontend) | `tsc -b && vite build` | `apps/frontend` |

---

## Variables de entorno

### Backend (`apps/backend/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `NODE_ENV` | No | `development` | Entorno de ejecución |
| `PORT` | No | `3000` | Puerto del servidor |
| `DATABASE_URL` | Sí | — | Cadena de conexión PostgreSQL |
| `REDIS_URL` | Sí | — | Cadena de conexión Redis (Upstash con TLS) |
| `ACCESS_TOKEN_SECRET` | Sí | — | Secreto JWT (mínimo 64 caracteres) |
| `REFRESH_TOKEN_SECRET` | Sí | — | Secreto JWT (mínimo 64 caracteres) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Origen permitido para CORS |
| `CRON_SECRET` | Sí | — | Secreto para endpoint de cron |

### Frontend (`apps/frontend/.env.local`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `VITE_API_URL` | Sí | `http://localhost:3000` | URL base de la API |

---

## Despliegue

| Servicio | Plataforma | Instrucciones |
|----------|-----------|---------------|
| Frontend | Vercel | Conectar repo → Framework: Vite → Root: `apps/frontend` → Variables de entorno |
| Backend | Render | Web Service → Root: `apps/backend` → Build: `npm run build` → Start: `node dist/index.js` → Variables de entorno |
| BD | Aiven | Plan free → PostgreSQL 15+ → Copiar `DATABASE_URL` |
| Redis | Upstash | Base de datos serverless → Copiar `REDIS_URL` |
| Cron | cron-job.org | GET `https://api/cleanup` cada 24h con header `x-cron-secret` |

> Para instrucciones detalladas: [docs/deployment.md](docs/deployment.md)

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [design.md](docs/design.md) | Arquitectura del sistema, decisiones técnicas, flujo de datos y diseño de autenticación |
| [components.md](docs/components.md) | Catálogo de componentes y páginas con props y tipos |
| [hooks.md](docs/hooks.md) | Hooks personalizados: useTimer, useAuth, useRegisterForm, useSocket |
| [context.md](docs/context.md) | AuthContext, ThemeContext, persistencia en localStorage |
| [routing.md](docs/routing.md) | Sistema de rutas, ProtectedRoute, PublicRoute y 404 |
| [forms.md](docs/forms.md) | Formularios y validación en tiempo real |
| [api.md](docs/api.md) | Documentación completa de la API REST (18 endpoints) |
| [api-client.md](docs/api-client.md) | Capa de red del frontend: apiCall(), servicios, refresh automático |
| [project-management.md](docs/project-management.md) | Metodología Kanban con Trello |
| [deployment.md](docs/deployment.md) | Guía detallada de despliegue en Vercel, Render, Aiven y Upstash |
| [testing.md](docs/testing.md) | Plan de pruebas y resultados del análisis estático |

---

## Licencia

MIT
