import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Componente que renderiza el diseño principal de la aplicación.
 * Proporciona la estructura de dos columnas: Sidebar + contenido principal.
 * Se usa en App.tsx para envolver todas las páginas protegidas.
 * El contenido principal tiene max-w-6xl y centrado para mejor legibilidad.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-[#0F1117] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0F1117]">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
