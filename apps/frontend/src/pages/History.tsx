import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import {
  getTodaySessions,
  getWeekSessions,
  getStats,
  getDailyGoal,
  formatTime,
  formatDateTime,
  formatDay,
} from "../services/history.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, Flame, CheckCircle, ArrowRight } from "lucide-react";

interface Session {
  id: number;
  task_label: string;
  duration: number;
  status: string;
  started_at: string;
  ended_at: string;
}

interface WeekDay {
  day: string;
  count: number;
  total_duration: number;
}

interface Stats {
  totalPomodoros: number;
  totalMinutes: number;
  currentStreak: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

/**
 * Componente que renderiza el historial de productividad del usuario.
 * Se usa en la ruta "/history" y está envuelto en Layout.
 * Incluye: estadísticas cards, gráfica semanal de Recharts,
 * selector de periodo (Hoy/Semana/Mes) y lista de sesiones de hoy.
 * Soporta estados: loading (skeleton), vacío y con datos.
 */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-800 dark:text-white">
          {formatDay(label || "")}
        </p>
        <p className="text-sm text-[#F5A623]">{`${payload[0].value} sesiones`}</p>
      </div>
    );
  }
  return null;
};

export function History() {
  const navigate = useNavigate();
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [weekSessions, setWeekSessions] = useState<WeekDay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [, setDailyGoal] = useState<number>(8);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  /**
   * Obtiene todos los datos del historial al montar el componente.
   * Usa Promise.all para paralelizar las peticiones.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [today, week, statsData, goal] = await Promise.all([
          getTodaySessions(),
          getWeekSessions(),
          getStats(),
          getDailyGoal(),
        ]);

        setTodaySessions(today);
        setWeekSessions(week);
        setStats(statsData);
        setDailyGoal(goal);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1C2333] p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-[#2D3748] rounded w-48"></div>
            <div className="h-10 bg-gray-200 dark:bg-[#2D3748] rounded w-72"></div>
          </div>
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-[#2D3748] rounded w-24 mb-4"></div>
                <div className="h-10 bg-gray-200 dark:bg-[#2D3748] rounded w-16"></div>
              </div>
            ))}
          </div>
          {/* Chart Skeleton */}
          <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-[#2D3748] rounded w-48 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-[#2D3748] rounded"></div>
          </div>
          {/* Sessions List Skeleton */}
          <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-[#2D3748] rounded w-48 mb-4"></div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-[#2D3748] rounded mb-3 last:mb-0"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1C2333] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          title="Historial"
          subtitle="Tu productividad a lo largo del tiempo"
          actions={
            <div className="flex gap-1 bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-lg p-1">
              {["Hoy", "Esta semana", "Este mes"].map((tab) => {
                const value =
                  tab === "Hoy"
                    ? "today"
                    : tab === "Esta semana"
                      ? "week"
                      : "month";
                return (
                  <button
                    key={tab}
                    onClick={() => setPeriod(value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      period === value
                        ? "bg-[#F5A623] text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2D3748]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pomodoros completados */}
          <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Pomodoros completados
            </p>
            <div className="text-4xl font-bold text-[#F5A623]">
              {stats?.totalPomodoros || 0}
            </div>
          </div>
          {/* Tiempo total enfocado */}
          <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Tiempo total enfocado
            </p>
            <div className="text-4xl font-bold text-gray-800 dark:text-white">
              {stats?.totalMinutes
                ? (() => {
                    const h = Math.floor(stats.totalMinutes / 60);
                    const m = stats.totalMinutes % 60;
                    return `${h}h ${m}m`;
                  })()
                : "0h 0m"}
            </div>
          </div>
          {/* Racha actual */}
          <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Racha actual
            </p>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-[#F5A623]">
                {stats?.currentStreak || 0}
              </span>
              <Flame className="w-6 h-6 text-[#F5A623]" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                dias consecutivos
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Pomodoros esta Semana
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekSessions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(day) => formatDay(day)}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#EAECF0" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#EAECF0" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#F5A623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Sessions List */}
        <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
            Sesiones de hoy
          </h2>
          {todaySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <BarChart2 className="w-16 h-16 text-gray-300 dark:text-[#2D3748] mx-auto" />
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                Sin sesiones todavia
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-md">
                Inicia tu primer Pomodoro para ver tu historial aqui
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] text-white rounded-lg hover:bg-[#F5A623]/90 transition-colors"
              >
                Ir al Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EAECF0] dark:divide-[#2D3748]">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center py-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {session.task_label}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(session.duration / 60)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDateTime(session.started_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
