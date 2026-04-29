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

export function useRegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    fullName: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // ─── Validaciones individuales ──────────────────────────
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

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password es requerido";
    }
    if (password.length < 8) {
      return "Password debe tener mínimo 8 caracteres";
    }
    return undefined;
  };

  const validateFullName = (fullName: string): string | undefined => {
    if (!fullName.trim()) {
      return "Nombre es requerido";
    }
    return undefined;
  };

  // ─── Validación en tiempo real ──────────────────────────
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
  const isValid = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const fullNameError = validateFullName(formData.fullName);

    return !emailError && !passwordError && !fullNameError;
  };

  // ─── Reset del formulario ──────────────────────────────
  const reset = useCallback(() => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
    });
    setErrors({});
  }, []);

  // ─── Setear error de submit (del servidor) ────────────
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
