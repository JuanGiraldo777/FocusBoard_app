## ⚠️ Problemas: Redis Mock en Desarrollo → Redis Real en Producción

> Nota: este documento quedó como referencia histórica. El estado actual del proyecto requiere Redis real y se levanta con Docker Compose desde la raíz del monorepo.

### 🔴 PROBLEMA 1: PERSISTENCIA (Critical)

**En Desarrollo (Redis Mock):**

```typescript
// Datos guardados solo en RAM del proceso Node.js
const store: MockRedisStore = {};
// ↓ Se pierden cuando:
// - Reinicia el servidor
// - Redeploy de la app
// - Crash de la aplicación
```

**En Producción (Redis Real):**

```
Redis SIGUE CORRIENDO aunque el backend reinicie
→ Los rate limiting counters PERSISTEN
→ Comportamiento diferente
```

**Impacto Real:**

- En desarrollo: Usuario puede hacer 100 intentos si reinicia el servidor
- En producción: Usuario está limitado después de 10 intentos
- **INCONSISTENCIA CRÍTICA**

---

### 🔴 PROBLEMA 2: MULTI-INSTANCIA / ESCALABILIDAD

**En Desarrollo (1 servidor, Redis Mock):**

```
Servidor 1 (Node.js)
├─ RAM Local
└─ store = {
    "login_attempts:127.0.0.1": 5
  }
```

**En Producción (3 servidores, Redis Real):**

```
Load Balancer
├─ Servidor 1 → Redis Central
├─ Servidor 2 → Redis Central  (COMPARTIDO)
├─ Servidor 3 → Redis Central
```

**CON Redis Mock en Producción:**

```
Servidor 1    Servidor 2    Servidor 3
store: {      store: {      store: {
  127.0.0.1:3   127.0.0.1:4   127.0.0.1:5
}             }             }
↑ CADA UNO TIENE SU PROPIO CONTADOR
↓ Rate limit NO FUNCIONA
```

**Impacto Real:**

- Usuario puede hacer 30 intentos (10 × 3 servidores) en lugar de 10
- **BYPASS TOTAL de rate limiting en producción**

---

### 🔴 PROBLEMA 3: DATA LOSS EN DEPLOYMENTS

**En Desarrollo:**

```
npm run dev (reinicia el servidor)
→ Redis Mock se reinicia
→ Counters se resetean
→ Esto es ESPERADO en dev
```

**En Producción (si usaras Mock):**

```
Deploy v1.2.3 (kill proceso Node.js)
  ↓ Todos los datos de rate limiting se pierden
Deploy v1.2.4 (restart proceso)
  ↓ Store vacío, usuario puede intentar 10 veces OTRA VEZ
```

**Impacto Real:**

- Atacante puede explotar ventana de deployment
- Múltiples deploys = oportunidades para ataque de fuerza bruta
- **SECURITY HOLE CRÍTICA**

---

### 🟡 PROBLEMA 4: PERFORMANCE

**Redis Mock (In-Memory Búsqueda Linear):**

```javascript
async incr(key) {
  // O(1) para acceso directo: store[key] = {...}
  // ✅ Rápido en desarrollo
  // ❌ Búsquedas lineales en listas grandes: O(n)
}
```

**Redis Real:**

```
Redis C Implementation
├─ Optimizado para operaciones clave-valor
├─ Multithreading
└─ Replicación + Persistencia
```

**Impacto Real:**

- En desarrollo con 100 usuarios: Mock es rápido
- En producción con 10,000 usuarios: Mock sería lentísimo
- **DIFERENCIA EN PERFORMANCE NOCHE Y DÍA**

---

### 🟡 PROBLEMA 5: FEATURES FALTANTES

**Redis Mock (limitado):**

```typescript
// Implemented:
✅ INCR, GET, SET, DEL, EXPIRE, TTL, KEYS

// NOT Implemented:
❌ SETEX (set + expire atómico)
❌ SCAN (iterator)
❌ HSET/HGET (hashes)
❌ LPUSH/LPOP (lists)
❌ PIPELINE (multiple commands)
❌ TRANSACTIONS (MULTI/EXEC)
❌ LUA SCRIPTING
❌ PUB/SUB
❌ CLUSTER
```

**Impacto Real:**

- En desarrollo: Funciona porque usas pocas features
- En producción: Pueden necesitar HSET, LPUSH, etc.
- **SORPRESAS EN PROD**

---

### 🟡 PROBLEMA 6: COMPORTAMIENTO DIFERENTE

**Redis Mock (Decisiones simplificadas):**

```typescript
async expire(key, seconds): Promise<void> {
  if (store[key]) {
    store[key].expiresAt = Date.now() + seconds * 1000;
  }
  // ¿Qué pasa si key no existe?
  // ¿Qué pasa si seconds es negativo?
  // ✅ Mock tiene comportamiento simplificado
}
```

**Redis Real:**

```
EXPIRE key 0     → Borra la key (diferente del Mock)
EXPIRE key -1    → Error (diferente del Mock)
EXPIRE noexist   → 0 (Handled diferente)
```

**Impacto Real:**

- Edge cases funcionan en dev pero fallan en prod
- **BUGS QUE NO VES HASTA PRODUCCIÓN**

---

## ✅ SOLUCIÓN: ESTRATEGIA RECOMENDADA

### **Opción 1: Abstractión (Recomendado) 🏆**

```typescript
// 1. Crear interfaz común
interface CacheClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
}

// 2. Implementación para Mock
class RedisMock implements CacheClient { ... }

// 3. Implementación para Redis Real
class RedisClient implements CacheClient {
  constructor(private client: redis.RedisClient) {}
}

// 4. Factory en config
export function createCacheClient(): CacheClient {
  if (process.env.NODE_ENV === 'production') {
    return new RedisClient(realRedisClient);
  }
  return new RedisMock();
}
```

**Ventajas:**

- ✅ Mismo código en dev y prod
- ✅ Fácil cambiar de Mock a Real
- ✅ Tests pueden usar Mock
- ✅ Producción usa Redis real

---

### **Opción 2: Docker Compose (Más Realista) 🐳**

```yaml
# docker-compose.yml
version: "3.8"
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  app:
    build: .
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis
```

**Ventajas:**

- ✅ Redis real en desarrollo
- ✅ Mismo entorno que producción
- ✅ Sin sorpresas en prod
- ✅ Solo `docker-compose up` para empezar

---

### **Opción 3: Híbrida (Mi Recomendación) 👌**

```typescript
// .env
USE_REDIS_MOCK = true; // dev
USE_REDIS_MOCK = false; // prod

// config/redis.ts
if (process.env.USE_REDIS_MOCK === "true") {
  // Desarrollo: Fast startup, sin dependencias
  return createRedisMock();
}

// Producción: Redis real requerido
const client = createClient({ url: env.REDIS_URL });
await client.connect();
return client;
```

**Ventajas:**

- ✅ Rápido en desarrollo sin configurar Redis
- ✅ Producción con Redis real y validaciones
- ✅ Tests pueden usar mock
- ✅ Evita sorpresas

---

## 📋 RESUMEN DE PROBLEMAS

| Problema                 | Severidad  | Impacto                     | Solución                 |
| ------------------------ | ---------- | --------------------------- | ------------------------ |
| Data loss en restart     | 🔴 CRÍTICA | Contador se resetea         | Usar Redis real o Docker |
| Multi-instancia bypass   | 🔴 CRÍTICA | 10x más intentos permitidos | Usar Redis central       |
| Security hole en deploy  | 🔴 CRÍTICA | Ventana de ataque           | Usar Redis persistente   |
| Performance diferente    | 🟡 ALTA    | Lento en prod               | Usar Redis real          |
| Features faltantes       | 🟡 MEDIA   | Edge cases                  | Abstractión + Tests      |
| Comportamiento diferente | 🟡 MEDIA   | Bugs en prod                | Usar Redis real          |

---

## 🎯 RECOMENDACIÓN FINAL

**Para tu proyecto:**

1. **HOY (Desarrollo):**
   - ✅ Mantén Redis Mock (rápido, sin dependencias)
   - ✅ Sirve para testing y desarrollo local

2. **PRE-PRODUCCIÓN:**
   - 📝 Instala Redis real
   - 📝 Cambia a `USE_REDIS_MOCK=false`
   - 📝 Prueba con múltiples instancias

3. **PRODUCCIÓN:**
   - 🔒 Redis real (preferiblemente con persistencia)
   - 🔒 Redis Cluster o Sentinel para HA
   - 🔒 Backups diarios
   - 🔒 Monitoreo de memoria

4. **MEJOR PRÁCTICA:**
   - Usar Docker Compose en desarrollo
   - Mismo `docker-compose.yml` que producción
   - "Si funciona en local, funciona en prod"

---

## 🚀 PRÓXIMOS PASOS

¿Quieres que:

1. ✅ Cree `docker-compose.yml` para Redis real en desarrollo
2. ✅ Abstracción mejor para Redis Mock/Real
3. ✅ Tests que validen comportamiento en ambos
4. ✅ Dejar como está (Mock para dev es ok por ahora)
