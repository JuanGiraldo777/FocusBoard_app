import { useNavigate } from "react-router-dom";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { registerUser } from "../services/auth.service";

export function RegisterForm() {
  const navigate = useNavigate();
  const {
    formData,
    errors,
    isLoading,
    setIsLoading,
    handleChange,
    isValid,
    reset,
    setSubmitError,
  } = useRegisterForm();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validar formulario
    if (!isValid()) {
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });

      // ✅ Éxito - Las cookies HttpOnly ya están en el navegador
      // El backend las seteo automáticamente
      reset();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al registrarse";
      setSubmitError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md">
      {/* Error general de submit */}
      {errors.submit && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.submit}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="usuario@ejemplo.com"
          className={`w-full px-3 py-2 border rounded-lg outline-none transition ${
            errors.email
              ? "border-red-500 bg-red-50"
              : "border-gray-300 focus:border-blue-500"
          } disabled:bg-gray-100`}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Nombre */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-1">
          Nombre Completo
        </label>
        <input
          id="fullName"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Juan Pérez"
          className={`w-full px-3 py-2 border rounded-lg outline-none transition ${
            errors.fullName
              ? "border-red-500 bg-red-50"
              : "border-gray-300 focus:border-blue-500"
          } disabled:bg-gray-100`}
        />
        {errors.fullName && (
          <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="••••••••"
          className={`w-full px-3 py-2 border rounded-lg outline-none transition ${
            errors.password
              ? "border-red-500 bg-red-50"
              : "border-gray-300 focus:border-blue-500"
          } disabled:bg-gray-100`}
        />
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
        )}
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={isLoading || !isValid()}
        className={`w-full py-2 rounded-lg font-semibold transition ${
          isLoading || !isValid()
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Registrando..." : "Registrarse"}
      </button>

      {/* Hint de validación */}
      <p className="text-xs text-gray-500 text-center">
        Password mínimo 8 caracteres • Email válido • Nombre requerido
      </p>
    </form>
  );
}
