import { apiCall } from "../utils/api.ts";

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

export async function getRoomByCode(code: string): Promise<RoomData> {
  const response = await apiCall<{ data: RoomData }>(`/api/v1/rooms/${code}`);
  return response.data;
}

export async function joinRoom(code: string): Promise<RoomData> {
  const response = await apiCall<{ message: string; data: RoomData }>(
    `/api/v1/rooms/${code}/join`,
    {
      method: "POST",
    },
  );
  return response.data;
}

export async function leaveRoom(code: string): Promise<void> {
  await apiCall<{ message: string }>(`/api/v1/rooms/${code}/leave`, {
    method: "DELETE",
  });
}

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

export const roomService = {
  createRoom,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  deleteRoom,
  listPublicRooms,
};
