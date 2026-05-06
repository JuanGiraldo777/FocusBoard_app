import { useAuth } from "../hooks/useAuth.ts";
import { TimerDisplay } from "../components/TimerDisplay.tsx";
import { useEffect, useState } from "react";
import { getTodaySessionsCount } from "../services/dashboard.service.ts";
import { BarChart2, Users } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [todayCount, setTodayCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchTodayCount = async () => {
    try {
      const count = await getTodaySessionsCount();
      setTodayCount(count);
    } catch (error) {
      console.error("Error fetching today's count:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const count = await getTodaySessionsCount();
        if (mounted) setTodayCount(count);
      } catch (error) {
        console.error("Error fetching today's count:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSessionSaved = () => {
    fetchTodayCount();
  };

  const dailyGoal = 8;
  const goalProgress = Math.min((todayCount / dailyGoal) * 100, 100);
  const firstName = user?.fullName?.split(" ")[0] || "Usuario";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getFormattedDate = () => {
    const now = new Date();
    const days = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[#1C2333] dark:text-white">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
          {getFormattedDate()}
        </p>
        <p className="text-sm italic text-[#4B5563] dark:text-[#9CA3AF]">
          ¿Qué vas a lograr hoy?
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Timer Card */}
        <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-6">
          <TimerDisplay
            focusDuration={25 * 60}
            breakDuration={5 * 60}
            onSessionSaved={handleSessionSaved}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart2 className="w-5 h-5 text-[#F5A623]" />
              <h2 className="text-lg font-semibold text-[#1C2333] dark:text-white">
                Progreso de hoy
              </h2>
            </div>

            {/* Counter */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#F5A623]">
                  {loading ? "..." : todayCount}
                </span>
                <span className="text-lg text-[#4B5563] dark:text-[#9CA3AF]">
                  / {dailyGoal}
                </span>
              </div>
              <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] mt-2">
                objetivo diario
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-[#EAECF0] dark:bg-[#2D3748] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F5A623] transition-all duration-300"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wide">
                Últimas sesiones
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                    Cargando...
                  </p>
                ) : todayCount === 0 ? (
                  <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                    Aún no hay sesiones hoy
                  </p>
                ) : (
                  Array.from({ length: Math.min(3, todayCount) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-[#EAECF0] dark:border-[#2D3748] last:border-0"
                      >
                        <div>
                          <p className="text-sm text-[#1C2333] dark:text-white">
                            Sesión {i + 1}
                          </p>
                          <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">
                            {new Date(
                              Date.now() - i * 3600000,
                            ).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-[#F5A623]">
                          25 min
                        </span>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>

          {/* Active Room Card (placeholder) */}
          <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-[#F5A623]" />
              <h2 className="text-lg font-semibold text-[#1C2333] dark:text-white">
                Sala activa
              </h2>
            </div>
            <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              No estás en ninguna sala en este momento
            </p>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-[#F5A623] mb-2">
            {loading ? "..." : todayCount}
          </div>
          <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wide">
            Pomodoros hoy
          </p>
        </div>
        <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-[#F5A623] mb-2">
            {loading ? "..." : `${todayCount * 25}`} min
          </div>
          <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wide">
            Tiempo enfocado
          </p>
        </div>
        <div className="bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-[#F5A623] mb-2">0</div>
          <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wide">
            Racha actual
          </p>
        </div>
      </div>
    </div>
  );
}
