# Plan de Pruebas Manuales — FocusBoard

> **Frontend:** http://localhost:5173  
> **Backend:** http://localhost:3000  
> **Fecha:** 07/05/2026

---

## AUTH

- [ ] **Registro con datos válidos** → redirige a `/dashboard`
- [ ] **Registro con email duplicado** → error 409 visible
- [ ] **Registro con password < 8 chars** → error de validación
- [ ] **Login con credenciales correctas** → redirige a `/dashboard`
- [ ] **Login con credenciales incorrectas** → error 401 visible
- [ ] **Logout** → redirige a `/login` y no puede volver al dashboard
- [ ] **Recargar página autenticado** → sigue autenticado (persistencia JWT)

---

## TIMER

- [ ] **Iniciar timer** → cuenta regresiva visible en SVG circular
- [ ] **Pausar y reanudar** → tiempo restante correcto
- [ ] **Timer focus completa** → pasa automáticamente a break
- [ ] **Break completa** → vuelve a idle, `sessionsCompleted + 1`
- [ ] **Recargar durante sesión** → restaura el timer (persistencia sessionStorage)
- [ ] **Cambiar de pestaña** → timer sigue corriendo (Web Worker)
- [ ] **Notificación del sistema** → se muestra al completar focus

---

## SALAS

- [ ] **Crear sala pública** → aparece en listado de salas
- [ ] **Unirse por código** → aparece como miembro
- [ ] **Ver miembros en tiempo real** → WebSocket funciona (Socket.io)
- [ ] **Salir de sala** → desaparece del listado de miembros
- [ ] **Eliminar sala (owner)** → sala ya no visible

---

## HISTORIAL

- [ ] **Sesiones del día se guardan en BD** → aparecen en "Sesiones de hoy"
- [ ] **Historial muestra sesiones correctas** → task_label, duración, timestamp
- [ ] **Gráfica semanal se renderiza** → Recharts con datos de 7 días
- [ ] **Estadísticas** → totalPomodoros, totalMinutes, currentStreak correctos
- [ ] **Estado vacío** → mensaje "Sin sesiones todavía" + botón "Ir al Dashboard"

---

## UI/UX

- [ ] **Dark mode toggle** → funciona en todas las páginas
- [ ] **Responsive en mobile (375px)** → layout se adapta correctamente
- [ ] **Sin errores en consola del navegador** → F12 → Console
- [ ] **Todos los botones de navegación funcionan** → Header/PageHeader links
- [ ] **Loading skeleton** → visible mientras se cargan datos

---

