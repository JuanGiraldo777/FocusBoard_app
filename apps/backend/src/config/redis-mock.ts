import type { IRedisClient } from "./redis.types.js";

/**
 * Mock de Redis en memoria para desarrollo y fallback
 * Implementa la misma interfaz IRedisClient que el cliente real
 */

interface StoredString {
  value: string | number;
  expiresAt: number | null;
}

export function createRedisMock(): IRedisClient {
  // Almacén interno para strings
  const strings = new Map<string, StoredString>();

  // Almacén interno para sets
  const sets = new Map<string, Set<string>>();

  /**
   * Verifica si una clave ha expirado
   */
  function isExpired(expiresAt: number | null): boolean {
    if (expiresAt === null) return false;
    return Date.now() > expiresAt;
  }

  /**
   * Limpia claves expiradas del almacén
   */
  function cleanExpired(): void {
    for (const [key, data] of strings.entries()) {
      if (isExpired(data.expiresAt)) {
        strings.delete(key);
      }
    }
  }

  return {
    // ===== MÉTODOS DE STRINGS =====

    async get(key: string): Promise<string | number | null> {
      cleanExpired();
      const data = strings.get(key);

      if (!data) return null;
      if (isExpired(data.expiresAt)) {
        strings.delete(key);
        return null;
      }

      return data.value;
    },

    async set(
      key: string,
      value: string | number,
      options?: { EX?: number },
    ): Promise<void> {
      let expiresAt: number | null = null;

      if (options?.EX) {
        expiresAt = Date.now() + options.EX * 1000;
      }

      strings.set(key, { value, expiresAt });
    },

    async del(key: string): Promise<void> {
      strings.delete(key);
    },

    async incr(key: string): Promise<number> {
      cleanExpired();
      const data = strings.get(key);

      let currentValue = 0;
      if (data && !isExpired(data.expiresAt)) {
        const parsed = Number(data.value);
        if (!isNaN(parsed)) {
          currentValue = parsed;
        }
      }

      const newValue = currentValue + 1;
      strings.set(key, { value: newValue, expiresAt: data?.expiresAt ?? null });

      return newValue;
    },

    async expire(key: string, seconds: number): Promise<void> {
      const data = strings.get(key);

      if (data && !isExpired(data.expiresAt)) {
        strings.set(key, {
          value: data.value,
          expiresAt: Date.now() + seconds * 1000,
        });
      }
    },

    async ttl(key: string): Promise<number> {
      cleanExpired();
      const data = strings.get(key);

      if (!data) return -2; // Clave no existe
      if (data.expiresAt === null) return -1; // Clave existe sin expiración

      if (isExpired(data.expiresAt)) {
        strings.delete(key);
        return -2;
      }

      const ttlMs = data.expiresAt - Date.now();
      return Math.ceil(ttlMs / 1000);
    },

    async keys(pattern: string): Promise<string[]> {
      cleanExpired();

      // Convertir patrón glob simple (* = cualquier cosa) a regex
      const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escapar caracteres especiales excepto *
        .replace(/\*/g, ".*"); // * se convierte en .*

      const regex = new RegExp(`^${regexPattern}$`);

      const matchingKeys: string[] = [];
      for (const key of strings.keys()) {
        if (!isExpired(strings.get(key)!.expiresAt) && regex.test(key)) {
          matchingKeys.push(key);
        }
      }

      return matchingKeys;
    },

    // ===== MÉTODOS DE SETS =====

    async sAdd(key: string, ...members: string[]): Promise<void> {
      if (!sets.has(key)) {
        sets.set(key, new Set());
      }

      const set = sets.get(key)!;
      for (const member of members) {
        set.add(member);
      }
    },

    async sCard(key: string): Promise<number> {
      const set = sets.get(key);
      return set ? set.size : 0;
    },

    async sRem(key: string, ...members: string[]): Promise<void> {
      const set = sets.get(key);
      if (!set) return;

      for (const member of members) {
        set.delete(member);
      }

      // Si el set está vacío, eliminar la clave
      if (set.size === 0) {
        sets.delete(key);
      }
    },

    async sMembers(key: string): Promise<string[]> {
      const set = sets.get(key);
      return set ? Array.from(set) : [];
    },
  };
}
