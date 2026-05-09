import { z } from 'zod'

// Solo cargar dotenv en desarrollo — en producción las variables
// vienen del panel de Render directamente como variables de sistema
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv')
  dotenv.default.config()
}

// Esquema de validación — define qué variables son obligatorias y su tipo
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().min(1, 'REDIS_URL es obligatoria'),
  ACCESS_TOKEN_SECRET: z.string().min(64, 'ACCESS_TOKEN_SECRET debe tener mínimo 64 caracteres'),
  REFRESH_TOKEN_SECRET: z.string().min(64, 'REFRESH_TOKEN_SECRET debe tener mínimo 64 caracteres'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN es obligatoria'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET es obligatoria'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variables de entorno inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data