# Pipeline de imágenes metrológicas

```mermaid
sequenceDiagram
  actor U as Persona
  participant UI as UI
  participant R as Rust
  participant FS as Object store
  participant DB as learning.sqlite3
  U->>UI: Elegir JPEG/PNG/WebP
  UI->>R: ruta + job + perfil + espécimen
  R->>R: leer por bloques y SHA-256
  R->>FS: staging
  R->>R: detectar contenido y decodificar
  R->>FS: original inmutable + miniatura WebP
  R->>DB: transacción objeto/asset/referencias/job
  DB-->>UI: IDs, dimensiones y deduplicación
```

El límite es 250 MB. La extensión no determina el formato. Cancelación limpia staging; corrupción produce job `failed`; cancelación produce `cancelled`. El ID de imagen incluye perfil, unidad y hash. El blob se deduplica por SHA; las referencias expresan propiedad y uso.

Rotar, invertir, contraste, brillo, zoom, pan y anotación son operaciones no destructivas. Los originales no se rotan, recortan, anotan ni recomprimen. La miniatura se carga antes que el original. HEIC, profundidad monocular, fotogrametría y reconocimiento automático quedan fuera.
