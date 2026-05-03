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

interface MockRedisSets {
  [key: string]: Set<string>;
}

class RedisMock {
  private store: MockRedisStore = {};
  private sets: MockRedisSets = {};

  /**
   * SET: Guarda una clave-valor
   */
  async set(
    key: string,
    value: string | number,
    options?: { EX?: number },
  ): Promise<void> {
    const expiresInSeconds = options?.EX;
    this.store[key] = {
      value,
      expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : null,
    };
  }

  /**
   * GET: Obtiene el valor de una clave
   */
  async get(key: string): Promise<string | number | null> {
    const item = this.store[key];

    if (!item) return null;

    // Verificar expiración
    if (item.expiresAt && Date.now() > item.expiresAt) {
      delete this.store[key];
      return null;
    }

    return item.value;
  }

  /**
   * DEL: Elimina una clave
   */
  async del(key: string): Promise<void> {
    delete this.store[key];
  }

  /**
   * INCR: Incrementa un valor numérico
   */
  async incr(key: string): Promise<number> {
    const item = this.store[key];

    // Verificar expiración
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      delete this.store[key];
    }

    if (!this.store[key]) {
      this.store[key] = { value: 1, expiresAt: null };
      return 1;
    }

    const currentValue = Number(this.store[key].value);
    const newValue = currentValue + 1;
    this.store[key].value = newValue;
    return newValue;
  }

  /**
   * EXPIRE: Setea expiración en segundos
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (this.store[key]) {
      this.store[key].expiresAt = Date.now() + seconds * 1000;
    }
  }

  /**
   * FLUSHALL: Limpia todas las claves
   */
  async flushall(): Promise<void> {
    Object.keys(this.store).forEach((key) => {
      delete this.store[key];
    });
    Object.keys(this.sets).forEach((key) => {
      delete this.sets[key];
    });
  }

  /**
   * KEYS: Obtiene todas las claves que coincidan con un patrón
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    const allKeys = [
      ...Object.keys(this.store),
      ...Object.keys(this.sets)
    ];
    return allKeys.filter((key) => regex.test(key));
  }

  /**
   * TTL: Obtiene el tiempo de expiración en segundos
   */
  async ttl(key: string): Promise<number> {
    const item = this.store[key];

    if (!item) return -2; // Key does not exist
    if (!item.expiresAt) return -1; // Key exists but has no expiration

    const ttlMs = item.expiresAt - Date.now();
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    return ttlSeconds > 0 ? ttlSeconds : -2;
  }

  // ==================== MÉTODOS DE SETS ====================

  /**
   * SADD: Añade miembros a un Set
   */
  async sAdd(key: string, ...members: string[]): Promise<void> {
    if (!this.sets[key]) {
      this.sets[key] = new Set<string>();
    }
    members.forEach((member) => {
      this.sets[key].add(member);
    });
  }

  /**
   * SCARD: Devuelve el número de miembros del Set
   */
  async sCard(key: string): Promise<number> {
    if (!this.sets[key]) return 0;
    return this.sets[key].size;
  }

  /**
   * SREM: Elimina miembros del Set
   */
  async sRem(key: string, ...members: string[]): Promise<void> {
    if (!this.sets[key]) return;
    members.forEach((member) => {
      this.sets[key].delete(member);
    });
    // Limpiar clave si el set está vacío
    if (this.sets[key].size === 0) {
      delete this.sets[key];
    }
  }

  /**
   * SMEMBERS: Devuelve todos los miembros del Set
   */
  async sMembers(key: string): Promise<string[]> {
    if (!this.sets[key]) return [];
    return Array.from(this.sets[key]);
  }
}

export const createRedisMock = (): RedisMock => new RedisMock();
