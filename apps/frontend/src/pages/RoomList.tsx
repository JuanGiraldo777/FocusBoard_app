import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { joinRoom, listPublicRooms } from "../services/room.service.ts";
import type { RoomListItem } from "../services/room.service.ts";
import { normalizeRoomCode } from "../utils/room-code.ts";

export function RoomList() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  // Debounce de 300ms para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchRooms = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params: { search?: string } = {};
      if (searchTerm) {
        params.search = searchTerm;
      }

      const data = await listPublicRooms(params);
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Error al cargar las salas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms(debouncedSearch || undefined);
    }, 0);

    return () => clearTimeout(timer);
  }, [debouncedSearch, fetchRooms]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleJoinRoom = async (code: string) => {
    const normalizedCode = normalizeRoomCode(code);

    try {
      setJoiningCode(normalizedCode);
      setError(null);
      await joinRoom(normalizedCode);
      navigate(`/room/${normalizedCode}`);
    } catch (err) {
      console.error("Error joining room from list:", err);
      setError("No se pudo unir a la sala. Intenta de nuevo.");
    } finally {
      setJoiningCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            FocusBoard - Salas
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/create-room")}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
            >
              Crear Sala
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Explorar Salas Públicas
          </h2>

          {/* Input de búsqueda con debounce */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Buscar salas por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Estado: Cargando */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          )}

          {/* Estado: Error */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchRooms(debouncedSearch || undefined)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Estado: Vacío */}
          {!loading && !error && rooms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 italic text-lg">
                No se encontraron salas públicas
              </p>
              <p className="text-gray-400 mt-2">
                ¡Sé el primero en crear una sala!
              </p>
            </div>
          )}

          {/* Estado: Éxito - Lista de salas */}
          {!loading && !error && rooms.length > 0 && (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-50 p-6 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {room.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Código:{" "}
                        <span className="font-mono font-bold">{room.code}</span>
                      </p>
                      <p className="text-gray-600 text-sm">
                        Máximo: {room.max_members} participantes
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {room.activeMembers}
                      </div>
                      <p className="text-gray-600 text-sm">Miembros activos</p>
                      <button
                        onClick={() => handleJoinRoom(room.code)}
                        disabled={joiningCode === room.code}
                        className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                      >
                        {joiningCode === room.code
                          ? "Uniéndose..."
                          : "Unirse a Sala"}
                      </button>
                    </div>
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
