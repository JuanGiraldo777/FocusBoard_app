# Despliegue — FocusBoard

## Contenido

- [Frontend (Vercel)](#frontend-vercel)
- [Backend (Render)](#backend-render)
- [Base de datos (Aiven)](#base-de-datos-aiven)
- [Redis (Upstash)](#redis-upstash)
- [Cron (cron-job.org)](#cron-cron-joborg)

---

## Frontend (Vercel)

1. Ir a [vercel.com](https://vercel.com) e importar el repositorio de GitHub
2. Configurar:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `npm run build` (Vercel lo detecta automáticamente)
   - **Output Directory:** `dist`
3. Variables de entorno:
   | Variable | Valor |
   |----------|-------|
   | `VITE_API_URL` | `https://tu-backend.onrender.com` |
4. Desplegar

---

## Backend (Render)

1. Ir a [render.com](https://render.com) y crear un **Web Service**
2. Conectar el repositorio de GitHub
3. Configurar:
   - **Root Directory:** `apps/backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/index.js`
   - **Plan:** Free
4. Variables de entorno (todas requeridas):
   | Variable | Descripción |
   |----------|-------------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | De Aiven (ver abajo) |
   | `REDIS_URL` | De Upstash (ver abajo) |
   | `ACCESS_TOKEN_SECRET` | `openssl rand -hex 32` |
   | `REFRESH_TOKEN_SECRET` | `openssl rand -hex 32` (distinto) |
   | `CORS_ORIGIN` | `https://tu-frontend.vercel.app` |
   | `CRON_SECRET` | String aleatorio |
5. Desplegar

---

## Base de datos (Aiven)

1. Ir a [aiven.io](https://aiven.io) y crear cuenta
2. Crear servicio **PostgreSQL** (plan free — 1 GB RAM, 5 GB disco)
3. Una vez creado, copiar `DATABASE_URL` del panel **Connection Info**
4. **Opcional:** Usar Aiven Client para correr migraciones:

```bash
# Instalar Aiven Client
brew install aiven-client

# Listar servicios
avn service list

# Obtener URI directa
avn service connection-info focusboard-postgres
```

---

## Redis (Upstash)

1. Ir a [upstash.com](https://upstash.com) y crear cuenta
2. Crear base de datos Redis (plan free — 256 MB)
3. Copiar `REDIS_URL` del panel (formato `rediss://default:token@host:6379`)

---

## Cron (cron-job.org)

1. Ir a [cron-job.org](https://cron-job.org) y crear cuenta
2. Crear un nuevo cron job:
   - **URL:** `https://tu-backend.onrender.com/api/v1/cron/cleanup`
   - **Method:** GET
   - **Headers:** `x-cron-secret: tu-cron-secret`
   - **Schedule:** Every 24 hours
3. Guardar

Este endpoint elimina salas con `last_activity` mayor a 24 horas.

---

## Verificación post-despliegue

```bash
# Health check
curl https://tu-backend.onrender.com/health
# → { "status": "ok" }

# Registro de prueba
curl -X POST https://tu-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"12345678","fullName":"Test"}'
# → 201 { "message": "Usuario registrado correctamente", "data": {...} }
```
