# Propuestas geométricas y CAD candidato

```mermaid
sequenceDiagram
  participant C as Comparación
  participant P as Propuesta
  participant R as Revisor humano
  participant B as Bridge CAD
  participant F as Fixture canónico
  C->>P: Crear draft con evidencia y alcance
  R->>P: Aprobar para candidato
  P->>B: Patch versionado, automaticApplication=false
  B->>B: Clonar proyecto y fingerprint original
  B->>B: Validar unidad y referencia
  B->>B: Ejecutar sidecar con timeout/cancelación
  B-->>R: Resultado, stderr acotado y diff
  F-->>R: Permanece sin cambios
  R->>B: Aceptar nueva versión o rollback
```

Estados: `draft`, `needs-more-evidence`, `ready-for-review`, `approved`, `rejected`, `superseded`, `implemented` y `validated`. Solo una transición válida y revisada puede crear candidato. El sidecar captura stderr en un buffer de 16 KiB, limita líneas, vence a 120 s, permite cancelar y reiniciar un proceso colgado.

La previsualización puede superponer nominal, medido y contorno candidato, pero no convierte el delta visual en prueba de encaje. La aceptación crea una nueva versión; nunca reescribe la anterior. El rollback usa la copia canónica anterior y su fingerprint.
