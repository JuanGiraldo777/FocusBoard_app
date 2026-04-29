/**
 * Redis Mock Server para desarrollo sin Redis instalado
 * Simula el comportamiento de Redis completamente
 */

interface MockRedisStore {
  [key: string]: {
    value: string | number;
    expiresAt: number | null;
  };
}

const store: MockRedisStore = {};

class RedisMock {
  /**
   * SET: Guarda una clave-valor
   */
  async set(
    key: string,
    value: string | number,
    expiresAt?: number,
  ): Promise<void> {
    store[key] = {
      value,
      expiresAt: expiresAt ? Date.now() + expiresAt * 1000 : null,
    };
  }

  /**
   * GET: Obtiene el valor de una clave
   */
  async get(key: string): Promise<string | number | null> {
    const item = store[key];

    if (!item) return null;

    // Verificar expiración
    if (item.expiresAt && Date.now() > item.expiresAt) {
      delete store[key];
      return null;
    }

    return item.value;
  }

  /**
   * DEL: Elimina una clave
   */
  async del(key: string): Promise<void> {
    delete store[key];
  }

  /**
   * INCR: Incrementa un valor numérico
   */
  async incr(key: string): Promise<number> {
    const item = store[key];

    // Verificar expiración
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      delete store[key];
    }

    if (!store[key]) {
      store[key] = { value: 1, expiresAt: null };
      return 1;
    }

    const currentValue = Number(store[key].value);
    const newValue = currentValue + 1;
    store[key].value = newValue;
    return newValue;
  }

  /**
   * EXPIRE: Setea expiración en segundos
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (store[key]) {
      store[key].expiresAt = Date.now() + seconds * 1000;
    }
  }

  /**
   * FLUSHALL: Limpia todas las claves
   */
  async flushall(): Promise<void> {
    Object.keys(store).forEach((key) => {
      delete store[key];
    });
  }

  /**
   * KEYS: Obtiene todas las claves que coincidan con un patrón
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return Object.keys(store).filter((key) => regex.test(key));
  }

  /**
   * TTL: Obtiene el tiempo de expiración en segundos
   */
  async ttl(key: string): Promise<number> {
    const item = store[key];

    if (!item) return -2; // Key does not exist
    if (!item.expiresAt) return -1; // Key exists but has no expiration

    const ttlMs = item.expiresAt - Date.now();
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    return ttlSeconds > 0 ? ttlSeconds : -2;
  }
}

export const createRedisMock = (): RedisMock => new RedisMock();
