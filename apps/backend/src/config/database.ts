import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

// ─── Configuración de la base de datos PostgreSQL ──────────────────────
// Este archivo configura el pool de conexiones a PostgreSQL usando
// las credenciales del archivo .env. Maneja reconexiones automáticas
// y cierre limpio del pool al apagar el servidor.

// Pool de conexiones — máximo 10 conexiones simultáneas
// idleTimeoutMillis: cierra conexiones inactivas tras 30s para liberar recursos
// connectionTimeoutMillis: error si no conecta en 2s para fallar rápido
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
})

// Verificar conexión al arrancar y cerrar el proceso si falla
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message)
  process.exit(1)
})

export const db = {
  /**
   * Ejecuta una query SQL parametrizada contra la base de datos
   * @param text - Query SQL con placeholders $1, $2, etc.
   * @param params - Array de parámetros para la query
   * @returns Resultado de la query con rows y metadata
   */
  query: (text: string, params?: unknown[]) => pool.query(text, params),

  /**
   * Obtiene una conexión del pool para usar en transacciones
   * @returns Cliente de PostgreSQL para usar en transacciones BEGIN/COMMIT/ROLLBACK
   */
  getClient: () => pool.connect(),
}

/**
 * Verifica que la base de datos esté respondiendo correctamente
 * @returns true si la conexión es exitosa, false si hay error
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

/**
 * Conecta a PostgreSQL y verifica la conexión al arrancar el servidor
 * Registra los handlers de cierre limpio (SIGTERM, SIGINT) para liberar el pool
 * @throws Error si no se puede conectar, detiene el proceso con exit(1)
 */
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('PostgreSQL conectado correctamente')
  } catch (error) {
    console.error('Error conectando a PostgreSQL:', error)
    process.exit(1)
  }

  // Cierre limpio del pool al apagar el servidor
  const shutdown = async () => {
    await pool.end()
    console.log('Pool de PostgreSQL cerrado correctamente')
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
