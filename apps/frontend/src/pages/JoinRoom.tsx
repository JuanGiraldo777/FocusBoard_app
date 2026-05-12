import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { roomService } from "../services/room.service";
import type { RoomData } from "../services/room.service";
import { isValidRoomCode, normalizeRoomCode } from "../utils/room-code";

function isAlreadyMemberError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  // Detectar por mensaje, que viaja correctamente incluso en producción
  return /ya eres miembro|miembro|already.*member/i.test(error.message);
}

export function JoinRoom() {
  const navigate = useNavigate();

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
      if (isAlreadyMemberError(err)) {
        navigate(`/room/${formattedCode}`);
        return;
      }

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

  // Estado: Éxito (redirigiendo)
  if (success) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1A1D27] flex items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-md rounded-xl border border-[#EAECF0] bg-white p-8 text-center shadow-sm dark:border-[#2D3748] dark:bg-[#1A1D27]">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#1C2333] dark:text-white mb-2">
            ¡Te has unido exitosamente!
          </h2>
          <p className="text-[#4B5563] dark:text-[#9CA3AF] mb-4">
            Redirigiendo a la sala "{success.name}"...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1A1D27] flex items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-sm rounded-xl border border-[#EAECF0] bg-white p-8 shadow-sm dark:border-[#2D3748] dark:bg-[#1A1D27]">
        <PageHeader
          title="Unirse a una sala"
          subtitle="Introduce el código de invitacion"
          backTo="/rooms"
          backLabel="Salas"
        />

        {error && (
          <div
            className={`mb-4 rounded-md px-3 py-2 text-sm ${/llena/i.test(error) ? "bg-amber-50 border border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300" : /miembro|already/i.test(error) ? "bg-blue-50 border border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300" : "bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/10"}`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
              placeholder="ABC12345"
              className="w-full rounded-md border border-[#EAECF0] bg-[#F7F8FA] px-4 py-3 text-2xl font-mono text-center tracking-widest uppercase placeholder:text-[#9CA3AF] dark:border-[#2D3748] dark:bg-[#1A1D27] dark:text-white dark:placeholder:text-[#9CA3AF]"
              maxLength={8}
              aria-label="Código de sala"
            />
            <p className="mt-2 text-xs text-[#4B5563] dark:text-[#9CA3AF]">
              Solo caracteres hexadecimales (A-F, 0-9)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 8}
            className="w-full rounded-lg bg-[#F5A623] py-3 text-sm font-semibold text-[#1C2333] transition-all duration-150 hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Uniéndose..." : "Unirse"}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center text-sm text-[#4B5563] dark:text-[#9CA3AF]">
          <span className="px-3">o</span>
        </div>

        <div className="text-center">
          <Link
            to="/rooms"
            className="text-sm font-semibold text-[#F5A623] hover:text-[#d8921e] dark:text-[#F5A623]"
          >
            Ver salas publicas
          </Link>
        </div>
      </div>
    </div>
  );
}
