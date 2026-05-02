import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { getTodaySessions, getWeekSessions, getStats, getDailyGoal, formatTime, formatDateTime, formatDay } from "../services/history.service.ts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

export function History() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [weekSessions, setWeekSessions] = useState<WeekDay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number>(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [today, week, statsData, goal] = await Promise.all([
          getTodaySessions(),
          getWeekSessions(),
          getStats(),
          getDailyGoal()
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Calculate progress towards daily goal
  const todayCompleted = todaySessions.filter(s => s.status === 'completed').length;
  const goalProgress = Math.min((todayCompleted / dailyGoal) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">FocusBoard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">FocusBoard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Historial de Pomodoros
          </h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalPomodoros || 0}</div>
              <p className="text-gray-600">Total Pomodoros</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatTime(stats?.totalMinutes || 0)}</div>
              <p className="text-gray-600">Tiempo Total</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats?.currentStreak || 0} días</div>
              <p className="text-gray-600">Racha Actual</p>
            </div>
          </div>

          {/* Daily Progress */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Progreso de Hoy</h3>
            <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-600 mt-2">
              {todayCompleted} de {dailyGoal} pomodoros completados
            </p>
          </div>

          {/* Weekly Chart */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Pomodoros esta Semana</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekSessions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(day) => formatDay(day)}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [
                      `${value} sesiones`,
                      'Cantidad'
                    ]}
                    labelFormatter={(day) => formatDay(day)}
                  />
                  <Bar dataKey="count" fill="#4f46e5">
                    {weekSessions.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Sessions List */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Sesiones de Hoy</h3>
            {todaySessions.length === 0 ? (
              <p className="text-gray-500 italic">No hay sesiones hoy</p>
            ) : (
              <div className="space-y-4">
                {todaySessions.map((session) => (
                  <div 
                    key={session.id}
                    className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{session.task_label}</h4>
                        <p className="text-gray-600 text-sm">
                          {formatDateTime(session.started_at)} - Duración: {formatTime(session.duration / 60)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status === 'completed' ? 'Completada' : session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
