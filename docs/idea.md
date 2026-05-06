# FocusBoard - Documento de requisitos v1.0

## Problema que resuelve

La procrastinacion no se combate con mas listas de tareas. Se combate con compromiso publico, estructura de tiempo y friccion minima para empezar. FocusBoard ataca el momento del arranque, no la organizacion.

## Usuario objetivo

Estudiantes, developers junior en practicas, o cualquier persona que trabaja en remoto o en equipo y necesita estructura para no perder el dia.

## Funcionalidades principales

| #   | Funcionalidad            | Descripcion                                          |
| --- | ------------------------ | ---------------------------------------------------- |
| 1   | Autenticacion            | Registro y login de usuarios.                        |
| 2   | Sesiones Pomodoro        | Timer configurable (25/5 min por defecto).           |
| 3   | Tarea del bloque         | El usuario declara que va a hacer antes de arrancar. |
| 4   | Salas compartidas        | Crear o unirse a salas con otros usuarios.           |
| 5   | Presencia en tiempo real | Ver quien esta trabajando en tu sala (WebSockets).   |
| 6   | Historial de sesiones    | Cuantos pomodoros completaste hoy y esta semana.     |
| 7   | Panel de audio personal  | Sonidos ambiente.            |

## Funcionalidades opcionales

- Reacciones o emojis entre usuarios de la sala (por ejemplo: "animo").
- Modo silencioso (no ves a los demas, solo tu timer).
- Meta diaria de pomodoros.
- Sonidos de notificacion al terminar un bloque.

## Mejoras futuras

- Estadisticas avanzadas con graficas semanales y mensuales.
- Integracion con GitHub para detectar commits durante sesiones.
- Sistema de rachas (streaks) para motivar consistencia.
- App movil con React Native.
- Notificaciones push cuando alguien de tu sala empieza una sesion.

## Arquitectura del stack

| Capa                | Tecnologia                                       | Responsabilidad                            |
| ------------------- | ------------------------------------------------ | ------------------------------------------ |
| Frontend            | React + TypeScript + Tailwind                    | UI, timer, panel de audio y salas.         |
| Backend             | Node.js + Express                                | API REST + WebSockets (Socket.io).         |
| Base de datos       | Aiven (PostgreSQL)                               | Usuarios, sesiones, salas e historial.     |
| Despliegue frontend | Vercel                                           | Produccion accesible.                      |
| Despliegue backend  | Render                                           | Servidor siempre activo.                   |
| Cron                | cron-job.org                                     | Limpiar salas vacias y tareas programadas. |
| Audio               | Spotify SDK + YouTube IFrame API + Web Audio API | Panel de audio personal por usuario.       |

## Flujo principal del usuario

1. Registro o login.
2. Dashboard personal.
3. Crear o unirse a una sala.
4. Declarar tarea del bloque.
5. Elegir audio (opcional).
6. Iniciar sesion Pomodoro.
7. Ver companeros trabajando en tiempo real.
8. Descanso y repetir.
9. Ver historial del dia.
