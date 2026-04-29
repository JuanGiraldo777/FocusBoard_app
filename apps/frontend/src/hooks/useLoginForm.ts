import { useState, useCallback } from "react";

export interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export interface FormData {
  email: string;
  password: string;
}

export function useLoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
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
      return "Contraseña es requerida";
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

    return !emailError && !passwordError;
  };

  // ─── Reset del formulario ──────────────────────────────
  const reset = useCallback(() => {
    setFormData({
      email: "",
      password: "",
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
