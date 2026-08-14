# Compatibilidad de progreso 0.14B

## Derivación sin migración

| Señal nueva | Origen existente | Persistencia nueva |
|---|---|---|
| Lección anchor estudiada | `AcademyLocalState.lessonProgress.completedAt` o sesión completada de una actividad perteneciente a la lección | Ninguna |
| Práctica requerida satisfecha | `academyActivitySatisfiesProgression(snapshot, activity)` | Ninguna |
| Progreso de capítulo | Anchors estudiados + prácticas requeridas según `completionPolicy` | Ninguna |
| Progreso de etapa/ruta | Agregación derivada de capítulos | Ninguna |
| Evidencia de banco | Evidencias existentes con modalidad P explícita; revisión humana solo con procedencia de revisor | Ninguna |
| Exploración opcional | Sesiones/actividades existentes fuera del denominador core | Ninguna |

## Garantías

- No se cambia el esquema local, no se reescriben perfiles y no se duplican estados calculables.
- Las 83 lecciones anchor y 83 prácticas requeridas forman el único denominador core.
- Los 30 apoyos únicos, las 8 ramas opcionales, Atlas, glosario, fuentes e historia adicional no inflan ese denominador.
- Las sesiones existentes se leen sin mutarlas; una sesión interrumpida conserva precedencia de recuperación.
- Una actividad K/V puede permitir progreso conceptual. La competencia física permanece pendiente sin modalidad P documentada.
- R no sustituye a P y una evidencia automática no se presenta como revisión humana.
- No se modifica el significado ni el resultado almacenado de ninguna actividad completada.
