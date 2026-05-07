# Formularios — FocusBoard Frontend

---

## Índice

- [RegisterForm](#registerform)
- [LoginForm](#loginform)
- [CreateRoom](#createroom)
- [JoinRoom](#joinroom)
- [Sistema de validación en tiempo real](#sistema-de-validación-en-tiempo-real)

---

## RegisterForm

**Archivo:** `src/components/RegisterForm.tsx`  
**Hook:** `useRegisterForm` (`src/hooks/useRegisterForm.ts`)

### Campos

| Campo | Tipo | Validación |
|-------|------|------------|
| `email` | `string` | Requerido, formato email regex |
| `fullName` | `string` | Requerido, no vacío |
| `password` | `string` | Requerido, mínimo 8 caracteres |

### Estructura del formulario

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <label htmlFor="fullName">Nombre completo</label>
    <input
      id="fullName"
      name="fullName"
      type="text"
      value={formData.fullName}
      onChange={handleChange}
      placeholder="Tu nombre completo"
    />
    {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
  </div>

  <div>
    <label htmlFor="email">Correo electrónico</label>
    <input
      id="email"
      name="email"
      type="email"
      value={formData.email}
      onChange={handleChange}
      placeholder="tu@email.com"
    />
    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
  </div>

  <div>
    <label htmlFor="password">Contraseña</label>
    <input
      id="password"
      name="password"
      type="password"
      value={formData.password}
      onChange={handleChange}
      placeholder="Mínimo 8 caracteres"
    />
    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
  </div>

  <button type="submit" disabled={isLoading || !isValid()}>
    {isLoading ? "Creando cuenta..." : "Crear cuenta"}
  </button>
</form>
```

### Submit

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isValid()) return;

  setIsLoading(true);
  try {
    await register(formData.email, formData.password, formData.fullName);
    navigate("/dashboard");
  } catch (err) {
    const message = err instanceof AppError ? err.message : "Error al registrarse";
    setSubmitError(message);
  } finally {
    setIsLoading(false);
  }
};
```

### Estados de error manejados
- `409`: Email duplicado → "El email ya está registrado"
- `400`: Validación del backend → detalles de campos inválidos

---

## LoginForm

**Archivo:** `src/components/LoginForm.tsx`  
**Hook:** `useLoginForm` (`src/hooks/useLoginForm.ts`)

### Campos

| Campo | Tipo | Validación |
|-------|------|------------|
| `email` | `string` | Requerido, formato email |
| `password` | `string` | Requerido (sin mínimo) |

### Submit

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isValid()) return;

  setIsLoading(true);
  try {
    await login(formData.email, formData.password);
    navigate("/dashboard");
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.statusCode === 429
          ? "Demasiados intentos. Intenta de nuevo en 15 minutos."
          : err.statusCode === 403
            ? "Cuenta desactivada. Contacta al soporte."
            : err.message
        : "Error al iniciar sesión";
    setSubmitError(message);
  } finally {
    setIsLoading(false);
  }
};
```

### Estados de error manejados
- `401`: Credenciales inválidas
- `429`: Demasiados intentos (rate limit)
- `403`: Cuenta desactivada
- Conexión: "Error de conexión con el servidor"

---

## CreateRoom

**Archivo:** `src/pages/CreateRoom.tsx`  
**Hook:** `useState` (sin hook de formulario personalizado)

### Campos

| Campo | Tipo | Validación |
|-------|------|------------|
| `name` | `string` | 3-100 caracteres |
| `isPublic` | `boolean` | Radio: Public (true) / Private (false) |
| `maxMembers` | `number` | 2-50 |

### UI del formulario

```tsx
<form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
  <div>
    <label>Nombre de la sala</label>
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Ej: Estudio matutino"
    />
    {error && <p className="text-red-500 text-sm">{error}</p>}
  </div>

  <div>
    <label>Visibilidad</label>
    <div className="grid grid-cols-2 gap-4">
      <button type="button" onClick={() => setIsPublic(true)}
        className={isPublic ? "ring-2 ring-[#F5A623]" : ""}>
        <Globe className="w-5 h-5" />
        <span>Pública</span>
      </button>
      <button type="button" onClick={() => setIsPublic(false)}
        className={!isPublic ? "ring-2 ring-[#F5A623]" : ""}>
        <Lock className="w-5 h-5" />
        <span>Privada</span>
      </button>
    </div>
  </div>

  <div>
    <label>Máximo de miembros</label>
    <input
      type="number"
      value={maxMembers}
      onChange={(e) => setMaxMembers(Number(e.target.value))}
      min={2} max={50}
    />
  </div>

  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Creando..." : "Crear sala"}
  </button>
</form>
```

### Submit

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (name.length < 3) { setError("El nombre debe tener al menos 3 caracteres"); return; }
  if (maxMembers < 2 || maxMembers > 50) { setError("Máximo de miembros entre 2 y 50"); return; }

  setIsSubmitting(true);
  try {
    const room = await roomService.createRoom({ name, isPublic, maxMembers });
    navigate(`/room/${room.code}`);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error al crear sala");
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## JoinRoom

**Archivo:** `src/pages/JoinRoom.tsx`

### Campo

| Campo | Tipo | Validación |
|-------|------|------------|
| `code` | `string` | Exactamente 8 caracteres hex mayúsculas |

### Input con auto-formato

```tsx
<input
  value={formattedCode}
  onChange={(e) => {
    const raw = e.target.value;
    const normalized = raw.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8);
    setCode(normalized);
    setError(null);
  }}
  placeholder="Ej: A3F9B1C2"
  maxLength={8}
  className="font-mono text-2xl tracking-widest text-center"
/>
```

Usa la función utilitaria `normalizeRoomCode()` que:
1. Convierte a mayúsculas
2. Elimina caracteres no hex
3. Limita a 8 caracteres

### Estados visuales

| Estado | Estilo | Mensaje |
|--------|--------|---------|
| Código inválido | Borde rojo | "El código debe tener exactamente 8 caracteres" |
| Sala llena | Fondo ámbar | "La sala está llena" |
| Ya miembro | Fondo azul claro | "Ya eres miembro de esta sala" |
| Éxito | Fondo verde | "Te has unido a ..." (auto-redirect 1.5s) |
| Error genérico | Fondo rojo | Mensaje del servidor |

---

## Sistema de validación en tiempo real

### Cómo funciona

Cada hook de formulario (`useRegisterForm`, `useLoginForm`) implementa validación por campo que se ejecuta en cada `onChange`:

```ts
// Registro de validadores individuales
const validators: Record<string, (value: string) => string | undefined> = {
  email: (v) => !v ? "El email es obligatorio"
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Formato de email inválido"
    : undefined,
  password: (v) => !v ? "La contraseña es obligatoria"
    : v.length < 8 ? "Mínimo 8 caracteres"
    : undefined,
  fullName: (v) => !v ? "El nombre es obligatorio" : undefined,
};

// handleChange solo valida el campo modificado
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
  setErrors((prev) => ({
    ...prev,
    [name]: validators[name]?.(value),
  }));
  setSubmitError(null); // limpia error del servidor al escribir
};

// isValid() valida todos los campos al submit
const isValid = (): boolean => {
  const newErrors: FormErrors = {};
  for (const field of Object.keys(validators)) {
    const error = validators[field](formData[field]);
    if (error) newErrors[field as keyof FormErrors] = error;
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Flujo visual

1. Usuario escribe → `handleChange` → valida ese campo → muestra/oculta error inmediatamente
2. Usuario hace submit → `isValid()` → valida todos → si hay errores, se muestran todos
3. Usuario corrige → `handleChange` → error de ese campo desaparece al instante

### Botón de submit deshabilitado

```tsx
<button disabled={isLoading}>
  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
</button>
```

No se deshabilita por validación (el usuario puede ver los errores al hacer click), solo por estado de carga.

---
