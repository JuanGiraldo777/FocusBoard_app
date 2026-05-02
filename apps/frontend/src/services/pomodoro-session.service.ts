import { apiCall } from "../utils/api.ts";

interface CreateSessionData {
  taskLabel: string;
  duration: number;
  roomId?: number;
  startedAt: string;
}

export async function savePomodoroSession(data: CreateSessionData): Promise<void> {
  await apiCall("/api/v1/sessions", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
