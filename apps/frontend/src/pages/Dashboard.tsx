import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { useTimer } from "../hooks/useTimer.ts";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const timer = useTimer({
    focusDuration: 10,
    breakDuration: 5,
    onComplete: () => console.log("Timer completed!"),
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
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

          {/* Timer Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-8 mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Pomodoro Timer
            </h3>
            <div className="text-5xl font-bold text-indigo-600 mb-4">
              {String(Math.floor(timer.timeLeft / 60)).padStart(2, "0")}:
              {String(timer.timeLeft % 60).padStart(2, "0")}
            </div>
            <p className="text-gray-600 mb-4 capitalize">
              {timer.state === "idle" && "Listo para comenzar"}
              {timer.state === "focusing" && "Enfoque"}
              {timer.state === "break" && "Descanso"}
              {timer.state === "paused" && "En pausa"}
            </p>
            <p className="text-gray-600 mb-4">
              Sesiones completadas: {timer.sessionsCompleted}
            </p>
            <div className="flex gap-2 justify-center">
              {timer.state === "idle" && (
                <button
                  onClick={timer.start}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Comenzar
                </button>
              )}
              {timer.state === "focusing" && (
                <>
                  <button
                    onClick={timer.pause}
                    className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  >
                    Pausar
                  </button>
                  <button
                    onClick={timer.reset}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Reiniciar
                  </button>
                </>
              )}
              {timer.state === "paused" && (
                <>
                  <button
                    onClick={timer.resume}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Reanudar
                  </button>
                  <button
                    onClick={timer.reset}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Reiniciar
                  </button>
                </>
              )}
              {timer.state === "break" && (
                <button
                  onClick={timer.reset}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Siguiente Sesión
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <p className="text-gray-600">Tareas</p>
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
