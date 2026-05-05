## Cron: Limpieza de salas inactivas (ROOMS_06)

Descripción rápida

- Endpoint: `GET /api/v1/cron/cleanup`
- Protegido por header `X-Cron-Secret` (valor en `apps/backend/.env` → `CRON_SECRET`).
- Respuesta: `{ deleted: number }` donde `deleted` es la cantidad de salas eliminadas.
- Si el header no coincide, responde `401`.

Uso desde cron-job.org

1. Crear nuevo job en cron-job.org con método `GET` y URL `https://<TU_HOST>/api/v1/cron/cleanup`.
2. Añadir header HTTP `X-Cron-Secret` con el mismo valor que tengas en `apps/backend/.env`.
3. Programar frecuencia: `cada 1 hora`.

Ejemplo de `curl` (prueba local):

```bash
curl -i -H "X-Cron-Secret: focusboard_dev_cron_secret" \
  http://localhost:3000/api/v1/cron/cleanup
```

Notas operativas

- En desarrollo `apps/backend/.env` contiene `CRON_SECRET=focusboard_dev_cron_secret`. Cambiar por un valor fuerte en producción.
- El job hace:
  - `DELETE FROM rooms WHERE last_activity < NOW() - INTERVAL '24 hours'` (ejecutado desde el repositorio)
  - `DEL room:{code}:members` y `DEL room:{code}:activity` en Redis para cada sala borrada.
- No hay cambios en frontend para esta tarea.

Seguridad

- Asegúrate de proteger el endpoint con un firewall o que el secret sólo lo conozca cron-job.org y tu infraestructura. Considera restringir el origen IP si tu proveedor lo permite.

Logs

- cron-job.org mostrará la respuesta `{ deleted: N }` en su historial; también puedes habilitar alertas si la respuesta no es 200.

## Redis real con Docker

Redis es obligatorio para el backend. En desarrollo, la forma recomendada de levantarlo es con Docker desde la raíz del monorepo:

```bash
docker compose up -d redis
```

Eso publica Redis en `localhost:6379`, así que el backend puede seguir usando:

```bash
REDIS_URL=redis://localhost:6379
```

Flujo recomendado:

1. Arranca Redis con Docker.
2. Arranca el backend con `npm run dev`.
3. Verifica en consola que aparece `✓ Redis conectado` y que Socket.IO configura el adapter.

Si más adelante quieres correr también el backend dentro de Docker, entonces sí habría que añadir un `Dockerfile` de la app y cambiar `REDIS_URL` a `redis://redis:6379` dentro de ese contenedor.
