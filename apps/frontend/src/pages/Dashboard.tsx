import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { TimerDisplay } from "../components/TimerDisplay.tsx";
import { useEffect, useState } from "react";
import { getTodaySessionsCount } from "../services/dashboard.service.ts";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    fetchTodayCount();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSessionSaved = () => {
    fetchTodayCount();
  };

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
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Bienvenido {user?.fullName || "a FocusBoard"}!
          </h2>
          <p className="text-gray-600 mb-6">
            Sesión iniciada como:{" "}
            <span className="font-semibold">{user?.email}</span>
          </p>

          {/* Timer Component */}
          <TimerDisplay 
            focusDuration={25 * 60} 
            breakDuration={5 * 60}
            onSessionSaved={handleSessionSaved}
          />

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? "..." : todayCount}
              </div>
              <p className="text-gray-600">Pomodoros Hoy</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-gray-600">Completadas</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <p className="text-gray-600">En Progreso</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
