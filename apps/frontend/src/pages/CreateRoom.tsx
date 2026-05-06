import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { createRoom } from "../services/room.service.ts";

export function CreateRoom() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    isPublic: true,
    maxMembers: 10,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (formData.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }
    if (formData.name.length > 100) {
      newErrors.name = "El nombre no puede exceder 100 caracteres";
    }
    if (formData.maxMembers < 2 || formData.maxMembers > 50) {
      newErrors.maxMembers =
        "El número de participantes debe estar entre 2 y 50";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const room = await createRoom(formData);
      // Redirigir automáticamente a la sala tras crear
      navigate(`/room/${room.code}`);
    } catch (error: unknown) {
      console.error("Error creating room:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { errors?: unknown } } }).response?.data
          ?.errors
      ) {
        const apiErrors: { [key: string]: string } = {};
        (
          error as {
            response: {
              data: { errors: Array<{ field: string; message: string }> };
            };
          }
        ).response.data.errors.forEach((err) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1A1D27]">
      <header className="border-b border-[#EAECF0] dark:border-[#2D3748] bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/rooms")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1C2333] dark:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Salas
          </button>
          <div className="ml-4">
            <h1 className="text-2xl font-semibold text-[#1C2333] dark:text-white">
              Crear sala de trabajo
            </h1>
            <p className="mt-1 text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              Configura tu espacio de enfoque compartido
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-xl border border-[#EAECF0] bg-white p-8 shadow-sm dark:border-[#2D3748] dark:bg-[#1A1D27]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#1C2333] dark:text-white mb-2"
              >
                Nombre de la sala
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-[#EAECF0] bg-white px-4 py-2 text-sm text-[#1C2333] placeholder:text-[#9CA3AF] focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 dark:border-[#2D3748] dark:bg-[#1A1D27] dark:text-white dark:placeholder:text-[#9CA3AF]"
                placeholder="Ej: Dev Team, Study Group..."
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <p className="block text-sm font-medium text-[#1C2333] dark:text-white mb-3">
                Visibilidad
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer rounded-lg border p-4 ${formData.isPublic ? "border-[#F5A623]/40 bg-[#F7F8FA] dark:bg-[#2D3748]" : "border-[#EAECF0] bg-white dark:bg-[#1A1D27] dark:border-[#2D3748]"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white border border-[#EAECF0] dark:bg-[#1A1D27] dark:border-[#2D3748]">
                      <Globe className="h-5 w-5 text-[#1C2333] dark:text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1C2333] dark:text-white">
                        Pública
                      </div>
                      <div className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">
                        Cualquiera puede unirse con el código
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    name="visibility"
                    checked={formData.isPublic}
                    onChange={() =>
                      setFormData({ ...formData, isPublic: true })
                    }
                  />
                </label>

                <label
                  className={`cursor-pointer rounded-lg border p-4 ${!formData.isPublic ? "border-[#F5A623]/40 bg-[#F7F8FA] dark:bg-[#2D3748]" : "border-[#EAECF0] bg-white dark:bg-[#1A1D27] dark:border-[#2D3748]"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white border border-[#EAECF0] dark:bg-[#1A1D27] dark:border-[#2D3748]">
                      <Lock className="h-5 w-5 text-[#1C2333] dark:text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1C2333] dark:text-white">
                        Privada
                      </div>
                      <div className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">
                        Acceso solo mediante invitación
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    name="visibility"
                    checked={!formData.isPublic}
                    onChange={() =>
                      setFormData({ ...formData, isPublic: false })
                    }
                  />
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="maxMembers"
                className="block text-sm font-medium text-[#1C2333] dark:text-white mb-2"
              >
                Máximo de miembros
              </label>
              <input
                id="maxMembers"
                type="number"
                min={2}
                max={50}
                value={formData.maxMembers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxMembers: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full rounded-lg border border-[#EAECF0] bg-white px-4 py-2 text-sm text-[#1C2333] placeholder:text-[#9CA3AF] focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 dark:border-[#2D3748] dark:bg-[#1A1D27] dark:text-white"
              />
              {errors.maxMembers && (
                <p className="mt-1 text-sm text-red-600">{errors.maxMembers}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#F5A623] py-3 text-sm font-semibold text-[#1C2333] transition-all duration-150 hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear sala"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
