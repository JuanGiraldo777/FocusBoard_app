// ─── Usuario ────────────────────────────────────────────
export interface User {
  id: number
  email: string
  fullName: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
}

// ─── Sala ───────────────────────────────────────────────
export interface Room {
  id: number
  ownerId: number
  name: string
  description: string | null
  isPrivate: boolean
  inviteCode: string | null
  createdAt: string
}

// ─── Sesion Pomodoro ────────────────────────────────────
export type SessionStatus = 'completed' | 'cancelled' | 'interrupted'

export interface PomodoroSession {
  id: number
  userId: number
  roomId: number | null
  taskLabel: string | null
  durationSeconds: number
  status: SessionStatus
  startedAt: string
  endedAt: string | null
}

// ─── Estado de usuario en sala (WebSocket) ──────────────
export type UserStatus = 'focusing' | 'break' | 'idle'

export interface RoomMember {
  roomId: number
  userId: number
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

// ─── Configuracion de usuario ───────────────────────────
export interface UserSettings {
  userId: number
  focusDurationMin: number
  shortBreakMin: number
  longBreakMin: number
  dailyGoal: number
  soundEnabled: boolean
  theme: string
}

// ─── Respuestas de la API ────────────────────────────────
export interface ApiSuccess<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code: string
  details?: unknown
}