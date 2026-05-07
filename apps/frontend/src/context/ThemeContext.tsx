import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Determina el tema inicial basado en localStorage o preferencia del sistema
 * Usa matchMedia para detectar si el usuario prefiere dark mode
 * @returns "light" o "dark"
 */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Provider que gestiona el tema claro/oscuro de FocusBoard.
 * Persiste el tema en localStorage y aplica clase "dark" al html.
 * Se usa en toda la app envuelto en <ThemeProvider>.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Aplica el tema al DOM y guarda en localStorage
  useEffect(() => {
    const root = document.documentElement;

    window.localStorage.setItem("theme", theme);
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  /**
   * Valor memoizado que expone theme y toggleTheme
   * Usa useMemo para evitar recreación innecesaria del contexto
   */
  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook que expone el contexto de tema.
 * Debe usarse dentro de ThemeProvider.
 * @returns ThemeContextType con theme y toggleTheme
 * @throws Error si se usa fuera de ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
