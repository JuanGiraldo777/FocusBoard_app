// ─── Usuario ────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

// ─── Sala ───────────────────────────────────────────────
export interface Room {
  id: string
  name: string
  code: string
  isPublic: boolean
  ownerId: string
  maxMembers: number
  memberCount: number
  createdAt: string
}

// ─── Sesion Pomodoro ────────────────────────────────────
export type SessionStatus = 'completed' | 'cancelled' | 'interrupted'

export interface PomodoroSession {
  id: string
  userId: string
  roomId: string | null
  taskLabel: string
  durationMinutes: number
  status: SessionStatus
  startedAt: string
  endedAt: string | null
}

// ─── Estado de usuario en sala (WebSocket) ──────────────
export type UserStatus = 'focusing' | 'break' | 'idle'

export interface RoomMember {
  userId: string
  name: string
  avatarUrl: string | null
  status: UserStatus
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