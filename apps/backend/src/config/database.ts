import pg from 'pg'
import { env } from './env.ts'

const { Pool } = pg

// Pool de conexiones — máximo 10 conexiones simultáneas
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,    // cierra conexiones inactivas tras 30s
  connectionTimeoutMillis: 2000, // error si no conecta en 2s
})

// Verificar conexión al arrancar
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message)
  process.exit(1)
})

export const db = {
  // Ejecutar una query
  query: (text: string, params?: unknown[]) => pool.query(text, params),

  // Obtener una conexión del pool (para transacciones)
  getClient: () => pool.connect(),
}

export const healthCheck = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}

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