import { useState, useCallback } from "react";

export interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  submit?: string;
}

export interface FormData {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Hook que gestiona el estado y validación del formulario de registro.
 * Incluye validación en tiempo real y validación completa antes de envío.
 * @returns { formData, errors, isLoading, setIsLoading, handleChange, isValid, reset, setSubmitError }
 */
export function useRegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    fullName: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // ─── Validaciones individuales ──────────────────────────

  /**
   * Valida el formato de email usando regex básica
   * @param email - Email a validar
   * @returns Mensaje de error o undefined si es válido
   */
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email es requerido";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email inválido";
    }
    return undefined;
  };

  /**
   * Valida la contraseña (mínimo 8 caracteres)
   * @param password - Contraseña a validar
   * @returns Mensaje de error o undefined si es válido
   */
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password es requerido";
    }
    if (password.length < 8) {
      return "Password debe tener mínimo 8 caracteres";
    }
    return undefined;
  };

  /**
   * Valida el nombre completo (no vacío)
   * @param fullName - Nombre a validar
   * @returns Mensaje de error o undefined si es válido
   */
  const validateFullName = (fullName: string): string | undefined => {
    if (!fullName.trim()) {
      return "Nombre es requerido";
    }
    return undefined;
  };

  // ─── Validación en tiempo real ──────────────────────────
  /**
   * Maneja el cambio en inputs y valida el campo modificado
   * Usa useCallback para evitar recreación innecesaria
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validar campo específico
    let error: string | undefined;
    if (name === "email") {
      error = validateEmail(value);
    } else if (name === "password") {
      error = validatePassword(value);
    } else if (name === "fullName") {
      error = validateFullName(value);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
      submit: undefined, // Limpiar error de submit
    }));
  }, []);

  // ─── Validación completa del formulario ────────────────
  /**
   * Valida todos los campos del formulario antes del envío
   * @returns true si el formulario es válido, false si hay errores
   */
  const isValid = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const fullNameError = validateFullName(formData.fullName);

    return !emailError && !passwordError && !fullNameError;
  };

  // ─── Reset del formulario ──────────────────────────────
  /**
   * Reinicia el formulario y errores a valores iniciales
   * Usa useCallback para evitar recreación innecesaria
   */
  const reset = useCallback(() => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
    });
    setErrors({});
  }, []);

  // ─── Setear error de submit (del servidor) ────────────
  /**
   * Establece un error de submit proveniente del servidor
   * Usa useCallback para evitar recreación innecesaria
   * @param error - Mensaje de error del servidor
   */
  const setSubmitError = useCallback((error: string) => {
    setErrors((prev) => ({
      ...prev,
      submit: error,
    }));
  }, []);

  return {
    formData,
    errors,
    isLoading,
    setIsLoading,
    handleChange,
    isValid,
    reset,
    setSubmitError,
  };
}
