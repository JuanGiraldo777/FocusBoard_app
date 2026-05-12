import { apiCall } from "../utils/api";

export interface RoomData {
  id: number;
  name: string;
  code: string;
  is_public: boolean;
  max_members: number;
  owner_id: number;
  last_activity: string;
  created_at: string;
}

export interface RoomListItem {
  id: number;
  name: string;
  code: string;
  max_members: number;
  owner_id: number;
  last_activity: string;
  member_count: number;
  activeMembers: number;
}

interface CreateRoomRequest {
  name: string;
  isPublic: boolean;
  maxMembers: number;
}

/**
 * Llama a la API para crear una nueva sala.
 * @param data - Datos de la sala (name, isPublic, maxMembers)
 * @returns Promesa con RoomData de la sala creada
 */
export async function createRoom(data: CreateRoomRequest): Promise<RoomData> {
  const response = await apiCall<{ message: string; data: RoomData }>(
    "/api/v1/rooms",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return response.data;
}

/**
 * Llama a la API para obtener una sala por su código.
 * @param code - Código único de 8 caracteres
 * @returns Promesa con RoomData de la sala
 */
export async function getRoomByCode(code: string): Promise<RoomData> {
  const response = await apiCall<{ data: RoomData }>(`/api/v1/rooms/${code}`);
  return response.data;
}

/**
 * Llama a la API para unirse a una sala por código.
 * @param code - Código único de 8 caracteres
 * @returns Promesa con RoomData de la sala
 */
export async function joinRoom(code: string): Promise<RoomData> {
  const response = await apiCall<{ message: string; data: RoomData }>(
    `/api/v1/rooms/${code}/join`,
    {
      method: "POST",
    },
  );
  return response.data;
}

/**
 * Llama a la API para salir de una sala.
 * @param code - Código único de la sala
 * @returns Promesa vacía
 */
export async function leaveRoom(code: string): Promise<void> {
  await apiCall<{ message: string }>(`/api/v1/rooms/${code}/leave`, {
    method: "DELETE",
  });
}

/**
 * Llama a la API para eliminar una sala (solo owner).
 * @param roomId - ID interno de la sala
 * @returns Promesa vacía
 */
export async function deleteRoom(roomId: number): Promise<void> {
  await apiCall<{ message: string }>(`/api/v1/rooms/${roomId}`, {
    method: "DELETE",
  });
}

export interface ListRoomsParams {
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Llama a la API para listar salas públicas.
 * Acepta parámetros de búsqueda y paginación.
 * @param params - Parámetros opcionales (search, limit, offset)
 * @returns Promesa con array de RoomListItem
 */
export async function listPublicRooms(
  params?: ListRoomsParams,
): Promise<RoomListItem[]> {
  const queryParams = new URLSearchParams();

  if (params?.search) queryParams.append("search", params.search);
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  const query = queryParams.toString();
  const url = `/api/v1/rooms${query ? `?${query}` : ""}`;

  const response = await apiCall<{ data: RoomListItem[] }>(url);
  return response.data.map((room) => ({
    ...room,
    activeMembers: room.member_count,
  }));
}

/**
 * Servicio de salas que agrupa todas las funciones.
 * Se usa en componentes y páginas para operaciones con salas.
 */
export const roomService = {
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  deleteRoom,
  listPublicRooms,
};
