import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { roomService } from "../services/room.service.ts";
import type { RoomData } from "../services/room.service.ts";
import { isValidRoomCode, normalizeRoomCode } from "../utils/room-code.ts";
import { isValidRoomCode, normalizeRoomCode } from "../utils/room-code.ts";

export function JoinRoom() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RoomData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedCode = normalizeRoomCode(code);
    if (!isValidRoomCode(formattedCode)) {
      setError("El código debe tener exactamente 8 caracteres hexadecimales");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const room = await roomService.joinRoom(formattedCode);
      setSuccess(room);

      // Redirigir automáticamente a la vista de la sala
      setTimeout(() => {
        navigate(`/room/${room.code}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Error joining room:", err);
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response
          ?.data?.message === "string"
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Error al unirse a la sala";
      setError(message ?? "Error al unirse a la sala");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Estado: Éxito (redirigiendo)
  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
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
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Te has unido exitosamente!
            </h2>
            <p className="text-gray-600 mb-4">
              Redirigiendo a la sala "{success.name}"...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            FocusBoard - Unirse a Sala
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Unirse a una Sala
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Código de la sala (8 caracteres)
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(normalizeRoomCode(e.target.value));
                }}
                placeholder="Ej: A3F8B2C9"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg tracking-wider text-center"
                maxLength={8}
                style={{ textTransform: "uppercase" }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Solo caracteres hexadecimales (A-F, 0-9)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 8}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uniéndose..." : "Unirse a Sala"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/rooms")}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              ← Volver a lista de salas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
