import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/user.repository.ts'
import { env } from '../config/env.ts'

// ─── Tipos ──────────────────────────────────────────────
export interface RegisterData {
  email: string
  password: string
  fullName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─── Helpers de tokens ──────────────────────────────────
const generateTokens = (userId: number, email: string): AuthTokens => {
  const accessToken = jwt.sign(
    { sub: userId, email },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { sub: userId },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}

// ─── Servicio ────────────────────────────────────────────
export const authService = {

  register: async (data: RegisterData): Promise<AuthTokens> => {

    // 1. Verificar si el email ya existe
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      const error = new Error('El email ya está registrado')
      ;(error as any).statusCode = 409
      throw error
    }

    // 2. Hashear la contraseña
    const passwordHash = await bcrypt.hash(data.password, 12)

    // 3. Crear usuario + settings en transacción
    const user = await userRepository.createWithSettings({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
    })

    // 4. Generar tokens
    return generateTokens(user.id, user.email)
  },
}