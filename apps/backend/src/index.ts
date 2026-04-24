import { env } from './config/env.ts'
import { connectDB } from './config/database.ts'

const startServer = async (): Promise<void> => {
  console.log('🚀 Iniciando FocusBoard Backend...')

  // Verificar conexión a PostgreSQL
  await connectDB()

  // Arrancar servidor
  console.log(`✅ Servidor corriendo en http://localhost:${env.PORT}`)
}

startServer()