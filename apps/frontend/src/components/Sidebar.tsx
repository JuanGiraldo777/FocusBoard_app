import { useMemo } from "react";
import type { ComponentType } from "react";
import {
  BarChart2,
  LayoutDashboard,
  LogOut,
  Moon,
  Music,
  Sun,
  Users,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo_focusboard.png";

interface NavigationItem {
  id: string;
  label: string;
  to?: string;
  icon: ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "rooms",
    label: "Salas",
    to: "/rooms",
    icon: Users,
  },
  {
    id: "history",
    label: "Historial",
    to: "/history",
    icon: BarChart2,
  },
  {
    id: "audio",
    label: "Audio",
    icon: Music,
  },
];

/**
 * Obtiene las iniciales del nombre completo del usuario.
 * Usa useMemo para evitar recálculo innecesario.
 * @param fullName - Nombre completo del usuario
 * @returns Iniciales (máximo 2 caracteres) o "FB" por defecto
 */
function getInitials(fullName: string | null | undefined): string {
  if (!fullName) {
    return "FB";
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "FB";
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("");
}

/**
 * Componente que renderiza la barra lateral de navegación de FocusBoard.
 * Se usa en Layout.tsx para proporcionar navegación principal,
 * selector de tema y botón de cierre de sesión.
 * Incluye navegación activa con bordes y estados hover.
 */
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = useMemo(() => getInitials(user?.fullName), [user?.fullName]);

  /**
   * Maneja el cierre de sesión del usuario.
   * Redirige al login tras logout exitoso.
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className="w-60 h-screen sticky top-0 border-r border-[#EAECF0] bg-white dark:bg-[#1A1D27] dark:border-[#2D3748] flex flex-col font-sans">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-3 px-4 py-5 border-b border-[#EAECF0] dark:border-[#2D3748] text-left hover:bg-[#F7F8FA] dark:hover:bg-[#2D3748] transition-colors duration-150"
      >
        <img
          src={logo}
          alt="FocusBoard"
          className="h-8 w-8 rounded-sm object-contain"
        />
        <span className="text-xl font-bold text-[#1C2333] dark:text-white">
          FocusBoard
        </span>
      </button>

      <nav className="flex-1 py-4" aria-label="Navegacion principal">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = item.to ? location.pathname === item.to : false;
            const Icon = item.icon;

            if (!item.to) {
              return (
                <li key={item.id} className="px-2">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-r-md text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-[#2D3748] transition-colors duration-150"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.id} className="px-2">
                <NavLink
                  to={item.to}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-r-md transition-colors duration-150 ${
                    isActive
                      ? "bg-[#F7F8FA] dark:bg-[#2D3748] text-[#1C2333] dark:text-white font-semibold border-l-2 border-[#F5A623]"
                      : "text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-[#2D3748]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-[#EAECF0] dark:border-[#2D3748] p-3 space-y-2">
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="h-9 w-9 rounded-full bg-[#F5A623] text-[#1C2333] flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1C2333] dark:text-white truncate">
              {user?.fullName ?? "Usuario"}
            </p>
            <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] truncate">
              {user?.email ?? "sin-email@focusboard.app"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-[#2D3748] transition-colors duration-150"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span>{theme === "dark" ? "Tema claro" : "Tema oscuro"}</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[#4B5563] dark:text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-[#2D3748] transition-colors duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  );
}
