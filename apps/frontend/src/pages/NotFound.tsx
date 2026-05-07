import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

/**
 * Página que renderiza un error 404 cuando la ruta no existe.
 * Se usa como fallback en App.tsx con la ruta path="*".
 * Muestra un ícono, mensaje y botón para volver al dashboard.
 */
export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#1C2333] flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <AlertCircle className="w-20 h-20 text-[#9CA3AF] dark:text-[#2D3748] mx-auto" />
        <div>
          <h1 className="text-4xl font-bold text-[#1C2333] dark:text-white mb-2">
            Página no encontrada
          </h1>
          <p className="text-[#9CA3AF] dark:text-gray-400">
            La página que buscas no existe o ha sido movida
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5A623] text-white rounded-lg hover:bg-[#F5A623]/90 transition-colors"
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  );
}
