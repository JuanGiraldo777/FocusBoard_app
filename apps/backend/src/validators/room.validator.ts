import { z } from "zod";

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100),
  isPublic: z.boolean().default(true),
  maxMembers: z
    .number()
    .int()
    .min(2, "Mínimo 2 participantes")
    .max(50, "Máximo 50 participantes")
    .default(10),
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;

export const listRoomsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .length(8, "El código debe tener 8 caracteres")
    .regex(/^[A-F0-9]{8}$/, "Código de sala inválido"),
});

export const roomIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("El id de sala debe ser positivo"),
});

export type RoomCodeParams = z.infer<typeof roomCodeParamsSchema>;
export type RoomIdParams = z.infer<typeof roomIdParamsSchema>;
