import { apiCall } from "../utils/api";

interface SessionData {
  id: number;
  task_label: string;
  duration: number;
  status: string;
  started_at: string;
  ended_at: string;
}

interface WeekData {
  day: string;
  count: number;
  total_duration: number;
}

interface StatsData {
  totalPomodoros: number;
  totalMinutes: number;
  currentStreak: number;
}

interface DailyGoal {
  daily_goal: number;
}

export async function getTodaySessions(): Promise<SessionData[]> {
  const response = await apiCall<{ data: SessionData[] }>("/api/v1/sessions/today");
  return response.data;
}

export async function getWeekSessions(): Promise<WeekData[]> {
  const response = await apiCall<{ data: WeekData[] }>("/api/v1/sessions/week");
  return response.data;
}

export async function getStats(): Promise<StatsData> {
  const response = await apiCall<{ data: StatsData }>("/api/v1/sessions/stats");
  return response.data;
}

export async function getDailyGoal(): Promise<number> {
  try {
    const response = await apiCall<{ data: DailyGoal }>(
      "/api/v1/user/settings",
    );
    return response.data.daily_goal || 8;
  } catch (error) {
    console.error("Error fetching daily goal:", error);
    return 8;
  }
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatter.format(date);
}

export function formatDay(dateString: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  return formatter.format(date);
}
