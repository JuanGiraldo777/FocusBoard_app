import { env } from './config/env.ts'
import { connectDB } from './config/database.ts'
import { createApp } from './app.ts'

const startServer = async (): Promise<void> => {
  console.log('Iniciando FocusBoard Backend...')

  // Verificar conexión a PostgreSQL
  await connectDB()

  // Crear y inicializar Express
  const app = createApp()

  // Iniciar servidor
  const port = parseInt(env.PORT, 10)
  app.listen(port, () => {
    console.log(` Servidor corriendo en http://localhost:${port}`)
  })
}

startServer()
  .catch((error) => {
    console.error('Error iniciando servidor:', error)
    process.exit(1)
  })