import { z } from 'zod'
import dotenv from 'dotenv'

// Carga el archivo .env antes de validar
dotenv.config()

// Esquema de validación — define qué variables son obligatorias y su tipo
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().min(1, 'REDIS_URL es obligatoria'),

  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET debe tener mínimo 32 caracteres'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET debe tener mínimo 32 caracteres'),

  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN es obligatoria'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET es obligatoria'),
})

// Validar al arrancar — si falla, el servidor no inicia
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variables de entorno inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1) // Para el servidor inmediatamente
}

export const env = parsed.data