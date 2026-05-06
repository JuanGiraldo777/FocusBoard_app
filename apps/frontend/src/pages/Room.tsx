import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { useSocket } from "../hooks/useSocket.ts";
import { roomService } from "../services/room.service.ts";
import type { RoomData } from "../services/room.service.ts";
import {
  Users,
  Copy,
  LogOut,
  Target,
  Coffee,
  Music,
  ChevronDown,
} from "lucide-react";
import { TimerDisplay } from "../components/TimerDisplay.tsx";
import { AmbientSoundControls } from "../components/AmbientSoundControls.tsx";

export function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { members, roomDeleted } = useSocket(code || "");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"leave" | "delete" | null>(
    null,
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

  // UI state for collapsible audio panel
  const [audioOpen, setAudioOpen] = useState(false);

  // Extended member type for optional fields coming from socket
  type ExtendedMember = (typeof members)[number] & {
    name?: string;
    timeLeft?: number;
  };

  if (loadingRoom) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1A1D27]">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-[#F7F8FA] dark:bg-[#2D3748] rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1A1D27] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-[#EAECF0] dark:border-[#2D3748] bg-white dark:bg-[#1A1D27] p-8 shadow-sm text-center">
          <p className="text-red-600 mb-4">{roomError}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-[#F5A623] text-[#1C2333] font-semibold rounded-lg hover:bg-opacity-90 transition"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1A1D27]">
      <header className="border-b border-[#EAECF0] dark:border-[#2D3748] bg-white dark:bg-[#1A1D27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[#1C2333] dark:text-white">
                {roomTitle}
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 bg-[#F7F8FA] dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748] px-2 py-1 rounded text-sm font-mono text-[#1C2333] dark:text-white">
                  <span className="text-xs">{code}</span>
                  <button
                    onClick={copyCode}
                    className="ml-1 text-[#1C2333] dark:text-white hover:opacity-80"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-white dark:bg-[#17202a] border border-[#EAECF0] dark:border-[#2D3748] text-sm">
                  <Users className="h-4 w-4 text-[#1C2333] dark:text-white" />
                  <span className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                    {members.length} miembros activos
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const confirmed = window.confirm("¿Salir de la sala?");
                if (confirmed) handleLeaveRoom();
              }}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#1C2333] dark:text-white bg-transparent border border-[#EAECF0] dark:border-[#2D3748] hover:bg-[#F7F8FA] dark:hover:bg-[#131417] disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Salir de la sala
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-transparent text-[#1C2333] dark:text-white border border-[#EAECF0] dark:border-[#2D3748] hover:bg-[#F7F8FA] dark:hover:bg-[#131417]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Miembros */}
        <section className="lg:col-span-2 space-y-6">
          {actionError && (
            <div className="rounded-lg p-4 bg-red-50 text-red-700 border border-red-200">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="rounded-lg p-4 bg-green-50 text-green-700 border border-green-200">
              {actionSuccess}
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF]">
              En la sala ahora
            </h3>
            {members.length === 0 ? (
              <p className="mt-3 text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                No hay miembros en la sala
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4">
                {(members as ExtendedMember[]).map((member) => {
                  const isYou = member.userId === user?.id;
                  const displayName = isYou
                    ? (user?.fullName ?? `U${member.userId}`)
                    : `Usuario ${member.userId}`;
                  const initials = String(displayName)
                    .split(" ")
                    .map((p: string) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={member.socketId}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-[#1A1D27] border border-[#EAECF0] dark:border-[#2D3748]"
                    >
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold ${isYou ? "bg-[#F5A623] text-[#1C2333]" : "bg-[#F7F8FA] dark:bg-[#2D3748] text-[#1C2333] dark:text-white"}`}
                      >
                        {initials}
                      </div>
                      <div className="text-sm font-medium text-[#1C2333] dark:text-white">
                        {displayName}
                      </div>

                      <div className="mt-1">
                        {member.status === "focusing" ? (
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">
                            <Target className="h-3 w-3" />
                            <span>Enfocado</span>
                          </div>
                        ) : member.status === "break" ? (
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                            <Coffee className="h-3 w-3" />
                            <span>Descanso</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
                            <span>Inactivo</span>
                          </div>
                        )}

                        {"timeLeft" in member &&
                          typeof (member as any).timeLeft === "number" && (
                            <div className="mt-2 text-xs text-[#4B5563] dark:text-[#9CA3AF]">
                              {Math.floor((member as any).timeLeft / 60)}:
                              {String((member as any).timeLeft % 60).padStart(
                                2,
                                "0",
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Tu sesión (card destacada) */}
        <aside className="space-y-6">
          <div className="rounded-xl border-2 border-[#F5A623] p-6 bg-white dark:bg-[#1A1D27]">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#1C2333] dark:text-white">
                Tu sesión
              </h4>
              <div className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                {user?.fullName ?? ""}
              </div>
            </div>

            <div className="mt-4">
              <TimerDisplay />
            </div>

            <div className="mt-4 text-sm italic text-[#4B5563] dark:text-[#9CA3AF]">
              {/* If task declared, TimerDisplay shows it; otherwise user can declare desde el modal */}
            </div>
            <div className="mt-4 text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              Progreso:{" "}
              <span className="font-semibold text-[#F5A623]">
                {/* placeholder */}0
              </span>{" "}
              sesiones completadas
            </div>
          </div>

          {/* Panel Audio colapsable */}
          <div className="rounded-xl border border-[#EAECF0] dark:border-[#2D3748] bg-white dark:bg-[#1A1D27]">
            <button
              onClick={() => setAudioOpen((s) => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <Music className="h-5 w-5 text-[#1C2333] dark:text-white" />
                <span className="font-medium text-[#1C2333] dark:text-white">
                  Audio ambiente
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-[#1C2333] dark:text-white ${audioOpen ? "rotate-180" : ""}`}
              />
            </button>

            {audioOpen && (
              <div className="px-4 pb-4">
                <AmbientSoundControls
                  options={[]}
                  selectedSoundId={"rain" as any}
                  selectedSoundLabel={"--"}
                  selectedSoundDescription={""}
                  volume={0}
                  status={"idle" as any}
                  error={null}
                  onSelectSound={() => {}}
                  onVolumeChange={() => {}}
                />
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Room;
