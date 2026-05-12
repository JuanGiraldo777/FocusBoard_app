import { apiCall } from "../utils/api";

interface TodaySessionsResponse {
  data: {
    count: number;
  };
}

export async function getTodaySessionsCount(): Promise<number> {
  try {
    const response = await apiCall<TodaySessionsResponse>("/api/v1/sessions/today-count");
    return response.data.count;
  } catch (error) {
    console.error("Error fetching today's sessions:", error);
    return 0;
  }
}
