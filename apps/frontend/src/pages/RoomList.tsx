import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, Plus, Search, Users } from "lucide-react";
import { joinRoom, listPublicRooms } from "../services/room.service.ts";
import type { RoomListItem } from "../services/room.service.ts";
import { normalizeRoomCode } from "../utils/room-code.ts";

export function RoomList() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0F1117]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#1C2333] shadow-sm dark:border-[#2D3748] dark:bg-[#1A1D27] dark:text-white">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#1C2333] dark:text-white">
                Salas de trabajo
              </h1>
            </div>
            <p className="mt-2 text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              Únete a una sala activa o crea una nueva para empezar a colaborar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/join-room")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#EAECF0] bg-white px-4 py-2.5 text-sm font-semibold text-[#1C2333] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm dark:border-[#2D3748] dark:bg-[#1A1D27] dark:text-white"
            >
              <Hash className="h-4 w-4" />
              Unirse por codigo
            </button>
            <button
              type="button"
              onClick={() => navigate("/create-room")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F5A623] px-4 py-2.5 text-sm font-semibold text-[#1C2333] transition-all duration-150 hover:bg-opacity-90 hover:-translate-y-0.5 hover:shadow-sm dark:bg-[#F5A623] dark:text-[#1C2333]"
            >
              <Plus className="h-4 w-4" />
              Crear sala
            </button>
          </div>
        </div>

        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar sala por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#EAECF0] bg-white py-2 pl-11 pr-4 text-sm text-[#1C2333] outline-none transition-all duration-150 placeholder:text-[#9CA3AF] focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 dark:border-[#2D3748] dark:bg-[#1A1D27] dark:text-white dark:placeholder:text-[#9CA3AF] dark:focus:border-[#F5A623] dark:focus:ring-[#F5A623]/20"
            />
          </div>
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-xl bg-[#F7F8FA] dark:bg-[#2D3748]"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-[#EAECF0] bg-white p-6 text-center dark:border-[#2D3748] dark:bg-[#1A1D27]">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => fetchRooms(debouncedSearch || undefined)}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#F5A623] px-4 py-2 text-sm font-semibold text-[#1C2333] transition-all duration-150 hover:bg-opacity-90 dark:bg-[#F5A623] dark:text-[#1C2333]"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="rounded-xl border border-[#EAECF0] bg-white px-6 py-16 text-center dark:border-[#2D3748] dark:bg-[#1A1D27]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F8FA] text-[#9CA3AF] dark:bg-[#2D3748] dark:text-[#9CA3AF]">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-medium text-[#1C2333] dark:text-white">
              No hay salas disponibles
            </h2>
            <p className="mt-2 text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              Crea la primera sala y empieza a trabajar en equipo
            </p>
            <button
              type="button"
              onClick={() => navigate("/create-room")}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-semibold text-[#1C2333] transition-all duration-150 hover:bg-opacity-90 dark:bg-[#F5A623] dark:text-[#1C2333]"
            >
              Crear sala
            </button>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const isPublicRoom =
                "is_public" in room ? Boolean(room.is_public) : true;

              return (
                <div
                  key={room.id}
                  onClick={() => void handleJoinRoom(room.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void handleJoinRoom(room.code);
                    }
                  }}
                  className="cursor-pointer rounded-xl border border-[#EAECF0] bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-[#2D3748] dark:bg-[#1A1D27]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[#1C2333] dark:text-white">
                        {room.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isPublicRoom ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
                        >
                          {isPublicRoom ? "Publica" : "Privada"}
                        </span>
                        <span className="inline-flex rounded-full bg-[#F7F8FA] px-2.5 py-1 text-xs font-semibold text-[#4B5563] dark:bg-[#2D3748] dark:text-[#9CA3AF]">
                          {room.activeMembers}/{room.max_members} miembros
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                      <div className="flex items-center gap-1 text-sm text-[#4B5563] dark:text-[#9CA3AF]">
                        <Users className="h-4 w-4" />
                        <span>{room.activeMembers} activos</span>
                      </div>
                      <span className="font-mono text-xs text-[#9CA3AF] dark:text-[#9CA3AF]">
                        {room.code}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleJoinRoom(room.code);
                    }}
                    disabled={joiningCode === room.code}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#F5A623] px-4 py-2.5 text-sm font-semibold text-[#1C2333] transition-all duration-150 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#F5A623] dark:text-[#1C2333]"
                  >
                    {joiningCode === room.code ? "Uniéndose..." : "Unirse"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
