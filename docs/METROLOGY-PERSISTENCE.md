# Persistencia metrológica

## Bases y migración

No existe una tercera SQLite. Desktop usa la migración 2, transaccional y con checksum, sobre `learning.sqlite3`; rechaza versiones futuras y crea backup previo. Web usa stores nuevos dentro del contrato IndexedDB learning. Las tablas mínimas del encargo, incluido `inspection_plans`, están presentes.

```mermaid
flowchart LR
  S["stage objeto"] --> V["validar formato, tamaño y SHA"]
  V --> T["transacción SQLite"]
  T --> O["objeto + referencia + asset"]
  O --> C["commit"]
  T -->|fallo| R["rollback DB + limpiar archivos nuevos"]
```

## Object store y GC

```mermaid
flowchart TD
  B["Blob SHA-256"] --> R{"Referencias"}
  R -->|una o más| K["Conservar"]
  R -->|cero| P["Previsualizar huérfano"]
  P --> C["Confirmación explícita"]
  C --> H["Verificar ruta y hash"]
  H --> D["Eliminar físicamente y marcar deleted"]
```

## Backup y recuperación

```mermaid
flowchart LR
  M["Backup metadatos"] --> MM["SQLite/JSON + manifiesto + omisiones"]
  F["Backup completo"] --> FM["SQLite + manifiesto + objetos SHA"]
  FM --> P["Previsualizar restauración"]
  P --> X{"Ausentes o conflictos"}
  X -->|Sí| B["Bloquear"]
  X -->|No| S["Backup completo de seguridad"]
  S --> R["Restaurar DB y objetos sin sobrescritura silenciosa"]
```

Un backup de metadatos declara cada objeto omitido. El completo copia y verifica objetos. Restaurar exige el hash exacto del manifiesto previsualizado; un blob distinto en destino bloquea la operación. Staging abandonado se limpia al arrancar.
