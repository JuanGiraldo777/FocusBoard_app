import { Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";
import logo from "../assets/logo_focusboard.png";
import { useTheme } from "../context/ThemeContext";

function Register() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen bg-[#F7F8FA] dark:bg-[#0F1117] flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(245,166,35,0.12),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(28,35,51,0.08),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top,_rgba(245,166,35,0.12),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.04),_transparent_28%)]" />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"
        }
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#EAECF0] bg-white text-[#1C2333] shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-[#2D3748] dark:bg-[#1A1D27] dark:text-white"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <div className="relative w-full max-w-md mx-auto rounded-2xl border border-[#EAECF0] bg-white p-8 shadow-sm dark:border-[#2D3748] dark:bg-[#1A1D27]">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-6 flex items-center gap-3">
            <img
              src={logo}
              alt="FocusBoard"
              className="h-10 w-10 rounded-xl object-cover dark:opacity-95"
            />
            <span className="text-lg font-semibold tracking-tight text-[#1C2333] dark:text-white">
              <span>Focus</span>
              <span className="text-[#F5A623]">Board</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-[#1C2333] dark:text-white">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-[#9CA3AF] dark:text-[#9CA3AF]">
            Empieza a enfocarte hoy
          </p>
        </div>

        <div className="mt-8">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-[#4B5563] dark:text-[#9CA3AF]">
          Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#F5A623] transition-colors duration-150 hover:text-[#d8921e] dark:text-[#F5A623] dark:hover:text-[#ffb340]"
          >
            Inicia sesion
          </Link>
        </p>
      </div>

      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-[#9CA3AF] dark:text-[#9CA3AF]">
        FocusBoard — Enfocate en lo que importa
      </p>
    </div>
  );
}

export default Register;
