# Project Management — FocusBoard

> Metodología: **Kanban** vía Trello

---

## Organización del trabajo con Trello (Kanban)

Cada funcionalidad o bug se representa como una **tarjeta** en Trello. Las tarjetas avanzan por columnas que representan el estado actual del trabajo.

No hay sprints fijos. El equipo toma tarjetas del backlog según capacidad, respetando un **WIP (Work In Progress)** de máximo 2 tarjetas por persona.

---

## Columnas del tablero

| Columna | Propósito |
|---------|-----------|
| **Backlog** | Ideas, features pendientes, bugs reportados. Sin priorizar. |
| **To Do (Priorizado)** | Tarjetas listas para trabajar, ordenadas por prioridad. Tienen criterios de aceptación definidos. |
| **In Progress** | Tarjetas en desarrollo activo. Máximo 2 por persona. |
| **Review** | Código terminado, esperando code review de otro miembro del equipo. |
| **Testing** | Aprobado en code review, pendiente de pruebas manuales en localhost. |
| **Done** | Probado y funcionando en desarrollo. Listo para despliegue. |

---

## División de funcionalidades en subtareas

Cada funcionalidad grande se divide en subtareas usando **checklists dentro de la tarjeta**. Ejemplo real del proyecto:

```
Feature: Historial de productividad
  [ ] Backend: endpoint GET /api/v1/sessions/today
  [ ] Backend: endpoint GET /api/v1/sessions/week
  [ ] Backend: endpoint GET /api/v1/sessions/stats
  [ ] Frontend: componente History con Recharts
  [ ] Frontend: servicio history.service.ts
  [ ] Frontend: estado vacío y skeleton loading
  [ ] Testing manual en navegador
```

### Criterios para dividir:
- Cada subtarea debe poder ser **commiteada individualmente** sin romper la rama principal
- Las subtareas de backend y frontend son separadas
- Las pruebas son siempre la última subtarea

---

## Flujo de una tarjeta desde Backlog hasta Done

```
Backlog
  ↓ (priorizar y asignar)
To Do
  ↓ (iniciar trabajo)
In Progress
  ↓ (crear PR, asignar revisor)
Review
  ↓ (revisor aprueba)
Testing
  ↓ (pruebas manuales pasan)
Done
```

### Reglas del flujo:

1. **Backlog → To Do**: El equipo prioriza semanalmente. Se asignan criterios de aceptación.
2. **To Do → In Progress**: El desarrollador mueve la tarjeta y crea una rama con formato `feature/nombre-corto` o `fix/nombre-corto`.
3. **In Progress → Review**: Se abre un Pull Request en GitHub. Se asigna un revisor distinto al autor. La tarjeta se mueve a Review.
4. **Review → Testing**: El revisor aprueba el PR (o solicita cambios). Si hay cambios, vuelve a In Progress.
5. **Testing → Done**: Las pruebas manuales de la checklist pasan. Se mergea el PR a `main`.

### Ejemplo de tarjeta completa:

**Título:** `Rediseñar página History con Recharts`

**Checklist:**
- [x] Componente History con gráfica de barras semanal
- [x] Stats cards: pomodoros totales, tiempo enfocado, racha
- [x] Loading skeleton con animación
- [x] Estado vacío con CTA a Dashboard
- [x] Dark mode compatible
- [x] Testing manual cross-browser

**Comentarios:**
- Se usó `ResponsiveContainer` de Recharts para mobile
- Los colores se adaptan al tema oscuro automáticamente
- La racha se calcula con window function en PostgreSQL

---
