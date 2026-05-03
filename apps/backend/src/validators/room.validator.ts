import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  isPublic: z.boolean().default(true),
  maxMembers: z.number().int().min(2, "Mínimo 2 participantes").max(50, "Máximo 50 participantes").default(10)
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;

export const listRoomsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
