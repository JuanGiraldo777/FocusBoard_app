import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { createRoom } from "../services/room.service.ts";

export function CreateRoom() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            FocusBoard - Crear Sala
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
            Crear Nueva Sala
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre de la sala */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: Estudio Grupal"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Visibilidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilidad
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.isPublic}
                    onChange={() =>
                      setFormData({ ...formData, isPublic: true })
                    }
                    className="mr-2"
                  />
                  Pública
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isPublic}
                    onChange={() =>
                      setFormData({ ...formData, isPublic: false })
                    }
                    className="mr-2"
                  />
                  Privada
                </label>
              </div>
            </div>

            {/* Límite de participantes */}
            <div>
              <label
                htmlFor="maxMembers"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Máximo de participantes
              </label>
              <input
                id="maxMembers"
                type="number"
                min="2"
                max="50"
                value={formData.maxMembers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxMembers: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.maxMembers && (
                <p className="mt-1 text-sm text-red-600">{errors.maxMembers}</p>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear Sala"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
