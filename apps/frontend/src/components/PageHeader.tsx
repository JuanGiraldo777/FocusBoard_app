import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

/**
 * Componente que renderiza el encabezado de página con título y acciones.
 * Se usa en todas las páginas internas para navegación contextual.
 * Soporta botón de regreso (backTo), subtítulo y acciones en la derecha.
 * El diseño usa flexbox con justify-between y items-start.
 */
export function PageHeader({ title, subtitle, backTo, backLabel, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-start mb-8">
      <div className="flex items-start gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2D3748] text-gray-600 dark:text-gray-300 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel && <span>{backLabel}</span>}
          </button>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-[#1C2333] dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[#9CA3AF] dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
