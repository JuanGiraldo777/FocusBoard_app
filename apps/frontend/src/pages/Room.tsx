import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { useSocket } from "../hooks/useSocket.ts";
import { roomService } from "../services/room.service.ts";
import type { RoomData } from "../services/room.service.ts";

export function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { members, isConnected, roomDeleted } = useSocket(code || "");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"leave" | "delete" | null>(
    null,
  );

  const isOwner = useMemo(
    () => Boolean(room && user && room.owner_id === user.id),
    [room, user],
  );

  const roomTitle = room?.name || (code ? `Sala ${code}` : "Sala");

  useEffect(() => {
    let mounted = true;

    const fetchRoom = async () => {
      if (!code) {
        if (mounted) {
          setRoomError("Código de sala inválido");
          setLoadingRoom(false);
        }
        return;
      }

      try {
        setLoadingRoom(true);
        setRoomError(null);
        const roomData = await roomService.getRoomByCode(code);
        if (mounted) {
          setRoom(roomData);
        }
      } catch (error) {
        console.error("Error fetching room:", error);
        if (mounted) {
          setRoomError("No se pudo cargar la sala");
        }
      } finally {
        if (mounted) {
          setLoadingRoom(false);
        }
      }
    };

    fetchRoom();

    return () => {
      mounted = false;
    };
  }, [code]);

  useEffect(() => {
    if (!roomDeleted) {
      return;
    }

    setActionSuccess("La sala fue eliminada por el owner");
    navigate("/dashboard", { replace: true });
  }, [roomDeleted, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setActionSuccess("Código copiado al portapapeles");
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (!code) {
      setActionError("Código de sala inválido");
      return;
    }

    try {
      setActionLoading("leave");
      setActionError(null);
      setActionSuccess(null);

      await roomService.leaveRoom(code);

      setActionSuccess("Saliste de la sala correctamente");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error leaving room:", error);
      setActionError("No se pudo salir de la sala");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!room) {
      setActionError("Sala no cargada");
      return;
    }

    const confirmed = window.confirm(
      "Esta acción eliminará la sala permanentemente. ¿Deseas continuar?",
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading("delete");
      setActionError(null);
      setActionSuccess(null);

      await roomService.deleteRoom(room.id);

      setActionSuccess("Sala eliminada exitosamente");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error deleting room:", error);
      setActionError("No se pudo eliminar la sala");
    } finally {
      setActionLoading(null);
    }
  };

  if (loadingRoom) {
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
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomError) {
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
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-red-600 mb-4">{roomError}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">FocusBoard</h1>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm text-gray-600">Código: </span>
              <span className="font-mono font-bold">{code}</span>
              <button
                onClick={copyCode}
                className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Copiar
              </button>
            </div>
            <div
              className={`px-4 py-2 rounded-lg ${isConnected ? "bg-green-50" : "bg-red-50"}`}
            >
              <span className="text-sm">
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <div className="px-4 py-2 bg-indigo-50 rounded-lg">
              <span className="text-sm text-indigo-700">
                Miembros activos: {members.length}
              </span>
            </div>
            <button
              onClick={handleLeaveRoom}
              disabled={actionLoading !== null}
              className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "leave" ? "Saliendo..." : "Salir de Sala"}
            </button>
            {isOwner && (
              <button
                onClick={handleDeleteRoom}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "delete" ? "Eliminando..." : "Eliminar Sala"}
              </button>
            )}
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
          {actionError && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
              {actionSuccess}
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-800 mb-6">{roomTitle}</h2>

          {!isConnected && (
            <div className="mb-4 p-4 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              Conexión en tiempo real inactiva. Intentando reconectar...
            </div>
          )}

          {/* Lista de miembros */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Miembros en línea ({members.length})
            </h3>

            {members.length === 0 ? (
              <p className="text-gray-500 italic">No hay miembros en línea</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div
                    key={member.socketId}
                    className={`p-4 rounded-lg border-l-4 ${
                      member.status === "focusing"
                        ? "border-red-500 bg-red-50"
                        : member.status === "break"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          Usuario #{member.userId}
                        </p>
                        <p className="text-sm text-gray-600">
                          Estado:{" "}
                          <span
                            className={`font-medium ${
                              member.status === "focusing"
                                ? "text-red-600"
                                : member.status === "break"
                                  ? "text-green-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {member.status === "focusing"
                              ? "Enfoque"
                              : member.status === "break"
                                ? "Descanso"
                                : "Inactivo"}
                          </span>
                        </p>
                      </div>
                      {member.userId === user?.id && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                          Tú
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TODO: Timer de Pomodoro */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500">Timer de Pomodoro próximamente...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;
