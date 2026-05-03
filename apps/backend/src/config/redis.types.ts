/**
 * Interfaz común para cliente Redis (real o mock)
 * Define todos los métodos utilizados en la aplicación
 */
export interface IRedisClient {
  // Métodos de Strings
  get(key: string): Promise<string | number | null>;
  set(key: string, value: string | number, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;

  // Métodos de Sets
  sAdd(key: string, ...members: string[]): Promise<void>;
  sCard(key: string): Promise<number>;
  sRem(key: string, ...members: string[]): Promise<void>;
  sMembers(key: string): Promise<string[]>;
}
