import { z } from "zod";

/**
 * Esquema para validar creación de sesión Pomodoro.
 * taskLabel: string no vacío, duration en segundos, startedAt ISO string.
 */
export const createSessionSchema = z.object({
  roomId: z.number().optional(),
  taskLabel: z.string().min(1, "Task label is required"),
  duration: z.number().min(60, "Duration must be at least 60 seconds"),
  startedAt: z.string().datetime("Invalid datetime format"),
});

export type CreateSessionPayload = z.infer<typeof createSessionSchema>;
