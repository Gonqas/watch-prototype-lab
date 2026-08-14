# Compatibilidad de progreso 0.14B.1

## Reconocimiento aditivo

| Caso | Resultado |
|---|---|
| `lessonProgress.completedAt` existe | explicit |
| Sesión completada antes o durante el cierre 0.14B | legacy-inferred |
| Sesión nueva posterior sin lectura explícita | none; no acredita teoría |

El corte determinista de reconocimiento legacy es `2026-08-14T12:45:00.000Z`. La preferencia y los registros originales no se reescriben.

- Ninguna base, sesión, evidencia, evaluación o proyección se migra.
- `legacy-inferred` evita retroceso y puede mostrar: “Progreso reconocido de una actividad anterior; puedes revisar la teoría.”
- No se reabre obligatoriamente teoría ya reconocida.
- Las nuevas actividades no crean `completedAt` ni se convierten silenciosamente en estudio explícito.
- Los IDs, esquemas persistidos y ocho paquetes permanecen intactos.
