import { z } from "zod";

export const createSessionSchema = z.object({
  taskLabel: z.string().min(3, "Task label must be at least 3 characters"),
  duration: z.number().positive("Duration must be greater than 0"),
  roomId: z.number().optional(),
  startedAt: z.string().datetime("Invalid datetime format")
});

export type CreateSessionRequest = z.infer<typeof createSessionSchema>;
