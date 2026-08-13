# Aprender — persistencia, compatibilidad, pruebas y plan

Estado: plan revisado por sistemas dependientes; no autoriza iniciar el Sistema 0 ni implementar.

## 1. Estrategia de persistencia

### 1.1 Principios

- `WatchProject` sigue siendo la autoridad del reloj.
- El estado educativo se persiste fuera del payload técnico salvo enlaces mínimos futuros.
- SQLite es la autoridad en Desktop para sesiones, progreso, fuentes y expedientes.
- Los paquetes de contenido son archivos versionados y validados; no filas editadas silenciosamente.
- Los binarios se guardan por hash en un almacén de assets, no como JSON/base64 en SQLite.
- Cada escritura multi-entidad usa transacción.
- Los intentos y evidencias son append-only después de envío.
- La primera etapa es privada, local y personal: no requiere cuenta, marketplace, firma de contenido ni flujo editorial público.
- Originales privados, OCR, traducciones y explicaciones son capas separadas; los binarios privados se excluyen de exportación por defecto.

### 1.2 Almacenamiento propuesto

```text
app-data/
  watchlab.sqlite3
  learning-content/
    installed/{package-id}/{version}/...
  learning-assets/
    sha256/{prefix}/{digest}
  learning-backups/
  learning-quarantine/
```

Los paquetes integrados pueden vivir en recursos de la aplicación y registrarse como `integrated`. Los personales viven en `app-data`, se marcan `local-unsigned`, se validan normalmente y no requieren recompilar ni activar modo desarrollador.

### 1.3 Tablas

La primera migración de Aprender añade, como mínimo:

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  checksum TEXT NOT NULL
);

CREATE TABLE learning_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  locale TEXT NOT NULL,
  preferences_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

CREATE TABLE learning_content_packages (
  id TEXT NOT NULL,
  version TEXT NOT NULL,
  state TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  PRIMARY KEY (id, version)
);

CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  technical_project_id TEXT NOT NULL,
  project_fingerprint TEXT NOT NULL,
  kind TEXT NOT NULL,
  state TEXT NOT NULL,
  context_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  ended_at TEXT,
  FOREIGN KEY (profile_id) REFERENCES learning_profiles(id)
);

CREATE TABLE learning_event_streams (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sealed_at TEXT,
  FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

CREATE TABLE learning_events (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  UNIQUE (stream_id, sequence),
  FOREIGN KEY (stream_id) REFERENCES learning_event_streams(id)
);

CREATE TABLE practice_attempts (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  practice_id TEXT NOT NULL,
  practice_version TEXT NOT NULL,
  technical_project_id TEXT NOT NULL,
  project_fingerprint TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  event_stream_id TEXT NOT NULL,
  result_json TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  FOREIGN KEY (event_stream_id) REFERENCES learning_event_streams(id)
);

CREATE TABLE learning_evidence (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  attempt_id TEXT,
  kind TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE mastery_records (
  profile_id TEXT NOT NULL,
  knowledge_node_id TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  state TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, knowledge_node_id)
);

CREATE TABLE instruments (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

CREATE TABLE measurement_campaigns (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  technical_project_id TEXT NOT NULL,
  target_ref_json TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

CREATE TABLE measurement_observations (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  repetition INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES measurement_campaigns(id)
);

CREATE TABLE technical_sources (
  id TEXT PRIMARY KEY,
  authority_class TEXT NOT NULL,
  usage TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  original_asset_hash TEXT,
  modified_at TEXT NOT NULL
);

CREATE TABLE source_layers (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  version TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  asset_hash TEXT,
  FOREIGN KEY (source_id) REFERENCES technical_sources(id)
);

CREATE TABLE educational_project_dossiers (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  technical_project_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  modified_at TEXT NOT NULL
);
```

Se añaden índices por `profile_id`, `technical_project_id`, fechas, `practice_id`, `knowledge_node_id` y estados activos. La parte relacional sirve para búsquedas e integridad; los payloads versionados permiten evolucionar entidades ricas sin una tabla por cada subtipo.

### 1.4 Migraciones

El `initialize_database()` actual solo ejecuta `CREATE TABLE IF NOT EXISTS`. Se propone un runner Rust:

1. abre transacción exclusiva corta;
2. crea `schema_migrations` si falta;
3. compara versiones/checksums compilados;
4. aplica migraciones pendientes en orden;
5. valida `foreign_key_check` e invariantes;
6. registra versión/checksum;
7. hace rollback completo ante fallo;
8. deja copia recuperable antes de una migración destructiva futura.

Las migraciones no reescriben `projects.payload` para añadir progreso. Cualquier migración de `WatchProject` sigue en el normalizador TypeScript y debe tener fixtures de v2, v3, v4 y v5.

### 1.5 Navegador

El producto básico debe funcionar en navegador. Para contenido/progreso se propone un adapter IndexedDB con la misma interfaz de repositorios, no más claves grandes de `localStorage`. El autoguardado técnico actual puede permanecer hasta una migración independiente.

SQLite e IndexedDB deben pasar contract tests comunes. Si una capacidad (p. ej. archivos locales grandes o CAD) no existe en web, la UI declara la limitación.

## 2. Paquetes `.wplab` y portabilidad

### 2.1 Compatibilidad inmediata

El decoder actual de package v1 exige `manifest.json` y `project.json` y tolera entradas ZIP adicionales. Por tanto, la primera extensión portable puede conservar:

- `packageVersion: 1`;
- `project.json` v2–v5 sin cambios;
- entradas opcionales nuevas listadas en `includes`.

```text
learning/dossiers/{id}.json
learning/measurements/{id}.json
learning/evidence/export.json
learning/sources/index.json
learning/assets/{sha256}
```

Una versión antigua abrirá el proyecto técnico e ignorará entradas desconocidas. No verá el expediente educativo, pero tampoco perderá el reloj.

### 2.2 Privacidad y tamaño

El exportador ofrece opciones:

- solo proyecto técnico (comportamiento actual);
- proyecto + expediente seleccionado;
- proyecto + medidas;
- archivo académico completo;
- incluir fuentes seleccionadas solo mediante opt-in y filtro por `usage`.

Historial del tutor, datos de perfil, borradores y binarios `private-local`, `official-cached` o `unknown` quedan excluidos por defecto. `official-linked` aporta cita/URL, no la copia cacheada. El libro privado puede seguir resolviendo citas dentro de la instalación aunque no viaje con el paquete.

### 2.3 Evolución de packageVersion

Solo se introduce `packageVersion: 2` cuando cambien requisitos estructurales obligatorios. En ese momento se mantiene `Exportar compatible v1` y el importador acepta v1/v2. No se sube la versión solo por añadir archivos opcionales.

## 3. Compatibilidad con proyectos existentes

### 3.1 Reglas

1. Todos los proyectos v2–v5 siguen normalizándose a v5.
2. Abrir Aprender no modifica `schemaVersion`.
3. Los enlaces educativos usan `projectId` + fingerprint y selectores adaptables.
4. Un proyecto sin entidades requeridas muestra actividades parciales/no aplicables.
5. No se generan tornillos o piezas internas ficticias durante migración.
6. El informe CAD existente puede adjuntarse como claim si coincide `modifiedAt`/fingerprint; de lo contrario queda obsoleto.
7. Guardar desde Aprender sin cambios técnicos produce un `project.json` semánticamente idéntico.

### 3.2 Futuro esquema canónico v6

Un v6 solo debe aprobarse cuando exista una necesidad técnica propia de todo Watch Prototype Lab —por ejemplo, instancias arbitrarias, interfaces y geometría importada persistente—, no para almacenar lecciones.

La migración v5→v6 sería aditiva:

- conserva campos v5;
- asigna IDs estables a entidades derivables;
- crea un índice/assembly graph canónico sin eliminar la API legacy;
- registra qué entidades son reales, paramétricas o visual-only;
- ofrece downgrade compatible cuando no se usen capacidades v6 exclusivas.

## 4. Estrategia de pruebas

### 4.1 Unitarias

Cobertura por dominio:

- resolución de selectores y topologías ambiguas;
- propagación de procedencia/exactitud;
- evaluación de expresiones y criterios;
- timeline determinista;
- dependencias de montaje;
- consecuencias educativas y reversión;
- agregación de mediciones e incertidumbre;
- compatibilidad extendida y datos insuficientes;
- progreso/evidencia, retención y errores repetidos;
- redacción y presupuesto del contexto del tutor;
- migradores de contenido.

Se usan property tests para grafos, secuencias y expresiones, especialmente para garantizar que ningún estado inválido produzca un pass silencioso.

### 4.2 Integración

- `PracticeRunner` + store de sesión + proyecto fixture;
- escena + entity resolver + viewport bridge fake;
- Evidence Hub + engine preview + CAD vigente/obsoleto;
- metrología → propuesta → aplicación undoable a `WatchProject`;
- donante → evaluación → decisión → informes posteriores;
- tutor context → provider fake → actos autorizados;
- instalación/actualización/rollback de content pack;
- reanudación tras cierre en cada checkpoint transaccional.

### 4.3 Render y 3D

Dos niveles:

1. **Headless semántico:** snapshots de `ViewportIntent`, entidades visibles, cámara, overlays y timeline; estable y rápido.
2. **Visual:** capturas de escenas de referencia en WebGL controlado, comparación con umbral y revisión de diffs.

Casos mínimos:

- aislamiento y restauración;
- explosionado progresivo;
- varias secciones;
- overlay de giro/velocidad/fiabilidad;
- estados indeterminado y obsoleto;
- montaje con pieza mal asentada;
- fault injection ilustrativa;
- reduced motion;
- textos largos en español/inglés.

No se basa toda la prueba en píxeles; las relaciones y eventos se asertan semánticamente.

### 4.4 Persistencia

- migración desde base actual con `projects` y `parts` poblados;
- base vacía y migración repetida idempotente;
- fallo inyectado con rollback;
- WAL, foreign keys e índices;
- concurrencia de autoguardado/sesión;
- event stream sin huecos/duplicados;
- sellado e inmutabilidad de intentos;
- round-trip SQLite/IndexedDB mediante contract tests;
- backup/restore;
- assets ausentes o con hash incorrecto;
- export/import `.wplab` con y sin learning data;
- apertura del paquete ampliado en decoder legacy v1.

### 4.5 Contenido

- JSON Schema/Zod de todos los documentos;
- IDs y referencias;
- ciclos de prerrequisito;
- localizaciones faltantes;
- citas sin fuente/localizador;
- jerarquía de autoridad: nominal MIYOTA oficial, unidad física medida, teoría del libro y derivado educativo;
- exclusión de binarios privados/cached/unknown en exports por defecto;
- selectores contra matriz de fixtures;
- comandos no permitidos;
- escenas sin salida/restauración;
- condiciones imposibles;
- rúbricas sin evidencia observable;
- claims exactos sin proveedor exacto;
- fault scenarios sin etiqueta educativa;
- clasificación de uso e integridad;
- compatibilidad de versión de app.

Cada paquete debe tener un reporte de cobertura por movimiento/capacidad.

### 4.6 Regresión

- todos los tests actuales de `vnext`, `core`, `platform` y CAD permanecen;
- fixtures v2–v5 conservan evaluación y geometría esperada;
- Montaje/Piezas/Movimiento/Validación/Fabricación/Proyectos funcionan sin instalar contenido;
- tamaño y tiempo de arranque no cargan los packs/viewport educativo hasta entrar;
- undo/redo técnico no incluye eventos puramente educativos;
- el CAD sidecar conserva protocolo v1 mientras los nuevos comandos sean opcionales;
- los enlaces oficiales y plantillas existentes no cambian de semántica.

### 4.7 Accesibilidad

- axe u otra auditoría automatizada sobre todas las pantallas;
- navegación completa por teclado;
- foco tras cambio de paso, modal y restauración;
- nombres/estados accesibles para controles 3D equivalentes;
- anuncio no intrusivo de errores y resultados;
- contraste, zoom 200%, reflow y densidad;
- reduced motion y timeline por pasos;
- color blindness mediante patrones/iconos;
- evaluación sin penalizar adaptaciones;
- pruebas manuales con lector de pantalla sobre mapa, práctica y metrología.

### 4.8 Rendimiento y robustez

- presupuesto de frame con 3D + overlays;
- carga perezosa de área y content packs;
- cancelación de jobs CAD y cálculos largos;
- límite/muestreo de eventos de alta frecuencia;
- proyectos grandes y fuentes numerosas;
- recuperación de sesión tras crash;
- content pack malicioso: path traversal, ZIP bomb, JSON grande, links/HTML no seguros.

## 5. Plan de implementación por sistemas dependientes

El plan no reduce la visión a un MVP. Cada sistema se diseña para el alcance completo y habilita progresivamente contenido publicable.

### Sistema 0 — decisiones, contratos y fixtures

Dependencias: ninguna.

Entregables:

- decisiones de la sección 7 cerradas;
- ADRs de identidad, evidence claims, persistencia y content packs;
- fixtures MIYOTA 2035, 8215 por subsistemas y completo, 82S0/8N24 comparativos, 9015/9039 comparativos, además de scratch e híbrido para probar que el canon no queda acoplado a MIYOTA;
- fixtures documentales para jerarquía oficial/medición propia/libro privado/derivado;
- matriz de capacidades y fidelidad;
- vocabulario de exactitud visible;
- criterios de aceptación globales.

### Sistema 1 — frontera canónica y Evidence Hub

Dependencias: Sistema 0.

Entregables:

- `ProjectEntityIndex` y adapter v5;
- `CanonicalEntityRef` y resolvedor;
- fingerprints de proyecto/inputs;
- adapters de `Dimension`, `EngineeringReport`, `CadAnalysis` y compatibilidad a claims;
- estado vigente/obsoleto/indeterminado;
- pruebas contra todos los fixtures.

Sin esto no se autoriza contenido que afirme relaciones físicas.

### Sistema 2 — persistencia y contenido versionado

Dependencias: Sistema 0; puede avanzar en paralelo conceptual con Sistema 1.

Entregables:

- runner de migraciones SQLite;
- repositorios Desktop e IndexedDB;
- almacén de assets por hash;
- loader, sandbox, schemas y linter de packs;
- paquetes `integrated` y `local-unsigned` sin requisito de firma;
- instalación atómica, rollback y cuarentena;
- export `.wplab` aditivo;
- herramienta CLI de validación/autoría.

### Sistema 3 — orquestador de escena y bridge del viewport

Dependencias: Sistemas 1 y 2.

Entregables:

- `ViewportIntent`;
- captura/restauración;
- timeline determinista con velocidad/scrubbing;
- eventos semánticos;
- selectores y bindings;
- overlays registrables;
- extracción gradual de responsabilidades de `StudioViewport` sin reescritura masiva;
- harness headless y visual.

### Sistema 4 — shell UX y mapa de conocimiento

Dependencias: Sistemas 1–3.

Entregables:

- workspace Aprender y navegación secundaria;
- layout 3 paneles + dock;
- inicio contextual;
- grafo/árbol/lista accesible;
- glosario y fuentes básicas;
- reanudación de sesión;
- lazy loading y responsive.

### Sistema 5 — motor de práctica, progreso y tutor determinista

Dependencias: Sistemas 1–4.

Entregables:

- definiciones, intentos y event stream;
- criterios, pistas y rúbricas;
- Evidence de aprendizaje y mastery versionado;
- contexto estructurado del tutor;
- actos deterministas y provider fake;
- panel de evidencia/progreso;
- controles de privacidad para futuro provider.

### Sistema 6 — montaje, servicio y laboratorio de averías

Dependencias: Sistemas 1, 3 y 5; requiere activos con granularidad suficiente.

Entregables:

- DAG de operaciones;
- herramientas, tornillos, orientación y riesgos;
- estado de contaminación/lubricación;
- consecuencias educativas;
- fault injections reproducibles;
- motor de pruebas/hipótesis/diagnóstico;
- cuatro modos de práctica;
- expedientes de intento.

La publicación por movimiento se gobierna por la matriz de capacidades, no por hardcodes del viewport.

### Sistema 7 — metrología y donantes ampliados

Dependencias: Sistemas 1, 2 y 5.

Entregables:

- instrumentos, campañas y repeticiones;
- incertidumbre y promoción revisada;
- visualización de datums;
- estado `insufficient-data`;
- modificaciones y decisiones de trasplante;
- forzado auditado;
- prácticas integradas de comparación y medición.

### Sistema 8 — biblioteca técnica completa y proyectos

Dependencias: Sistemas 2, 4, 5 y 7.

Entregables:

- originales inmutables, capas y anotaciones;
- PDF local, fuentes oficiales enlazadas/cacheadas, OCR y traducciones privadas por capas;
- clasificación de uso y exportación deny-by-default para binarios privados;
- búsqueda y vínculos contextuales;
- dossiers, hitos, BOM, decisiones y artefactos;
- exportación selectiva;
- checklist personal opcional de revisión técnica/pedagógica.

### Sistema 9 — expansión de fidelidad y contenido

Dependencias: todos los anteriores.

Trabajo continuo:

- anatomía completa del MIYOTA 2035;
- topologías mecánicas arbitrarias en el canon cuando se apruebe v6;
- servicio profundo MIYOTA 8215 y comparación 82S0/8N24;
- comparación de serie 82 con 9015/9039 y ampliación 9100/9120;
- overlays adicionales calibrados;
- contenido avanzado del libro privado y, cuando exista soporte, simulaciones de alta relojería y complicaciones;
- adapter opcional de tutor IA;
- herramientas de autoría visual y traducción.

## 6. Criterios de salida por sistema

Un sistema no se considera terminado solo por mostrar UI. Debe tener:

- contratos y migraciones versionados;
- pruebas unitarias/integración/accesibilidad pertinentes;
- estados vacío, parcial, error y offline;
- documentación de alcance físico;
- fixtures de al menos cuarzo y mecánico;
- telemetría local/diagnósticos sin datos personales;
- reversibilidad y compatibilidad verificadas.

## 7. Registro de decisiones revisado y fecha límite

### D01 — nombre y posición

**Recomendación:** etiqueta de navegación `Aprender`; identidad editorial `Watchmaking Academy` dentro del área. Confirmar si el producto será bilingüe desde la primera entrega.

### D02 — primer movimiento con granularidad de servicio

**Recomendación revisada:** MIYOTA 2035 para cuarzo y MIYOTA 8215 como calibre mecánico profundo. 82S0/8N24 permiten comparación abierta dentro de la familia 82; 9015/9039 introducen la serie 90; 9100/9120 y otros amplían complicaciones. Contenido, fixtures y activos iniciales priorizan MIYOTA, pero contratos, selectores y modelo canónico siguen siendo multimarca. El 8215 se presenta por subsistemas sin borrar del canon rotor, automático ni calendario.

### D03 — alcance del futuro modelo canónico v6

Confirmar si se autoriza diseñar instancias arbitrarias, fasteners, interfaces y assembly graph como evolución general de Watch Prototype Lab. Sin esa decisión, desmontaje granular quedará limitado a movimientos con adapter externo y capacidades declaradas.

### D04 — fidelidad física publicable

Definir vocabulario y umbrales para `visual-only`, `ilustrativa`, `reglas`, `analítica`, `kernel-backed` y `validada físicamente`. Aprobar quién puede certificar cada nivel.

### D05 — perfil de usuario

**Recomendación:** múltiples perfiles locales opcionales, uno por defecto sin login. Decidir si se requiere cifrado, PIN o portabilidad entre equipos.

### D06 — fuentes privadas, procedencia y exportación

**Recomendación revisada:** producto privado/local con procedencia obligatoria y `usage` simple: `private-local`, `official-linked`, `official-cached`, `user-created`, `shareable` o `unknown`. Se permiten documentos locales, OCR, traducciones y anotaciones privadas; originales y derivados permanecen separados. Los binarios privados/cached/unknown no se exportan por defecto. No construir ahora territorios, marketplace, firma general ni flujo jurídico/editorial público. **D06 deja de ser B0** y debe cerrarse antes de persistir fuentes en el Sistema 2.

### D07 — autoría y revisión

**Recomendación revisada:** mantener IDs, versiones, manifiestos, JSON Schema, hashes, dependencias, Markdown restringido y ausencia de código arbitrario. Paquetes de aplicación `integrated`; paquetes personales `local-unsigned`, válidos sin modo desarrollador. Firma, marketplace y roles obligatorios de autor/revisor/publicador quedan aplazados; puede conservarse un checklist o metadata opcional de revisión.

### D08 — modelo de dominio y evaluación

**Recomendación:** estados basados en evidencia y algoritmo versionado, sin gamificación opaca. Validar pesos, retención, independencia de evidencias y política de reevaluación.

### D09 — tutor

Decidir si la primera versión incluye solo tutor determinista o también adapter IA. Si hay proveedor externo: consentimiento, datos enviados, retención, redacción, coste y funcionamiento offline.

### D10 — metrología

Definir exigencia de trazabilidad: resolución mínima, calibración, unidades, cobertura de incertidumbre y quién puede promover mediciones al proyecto.

### D11 — donantes forzados

**Recomendación:** conservar evaluación original, exigir justificación y riesgos aceptados y ejecutar todos los informes después del trasplante. Confirmar si un proyecto con forzado recibe una marca persistente global.

### D12 — persistencia web

Confirmar si el navegador es superficie educativa soportada o solo modo de consulta. Esto decide la prioridad de IndexedDB y límites de archivos/assets.

### D13 — formato portable

**Recomendación:** extensión aditiva de `.wplab` v1 al principio, exportación educativa opt-in y sin tutor privado. Confirmar qué expediente debe viajar por defecto.

### D14 — dispositivos e interacción

Definir soporte mínimo de ratón, trackpad, táctil, teclado y posible SpaceMouse. Confirmar si prácticas de montaje se publican en pantallas pequeñas.

### D15 — accesibilidad

Confirmar objetivo WCAG (recomendado AA), idiomas, soporte de lector de pantalla y adaptaciones que no penalizan evaluación.

### D16 — estrategia editorial inicial

**Recomendación revisada:** fundamentos/documentación → ISA 8172 conocido → MIYOTA 2035 completo → fundamentos mecánicos → MIYOTA 8215 por subsistemas → servicio, lubricación, regulación y diagnóstico del 8215 → 82S0/8N24 → serie 82 frente a serie 90 → 9015/9039 → 9100/9120 y otros complejos → alta relojería desde el libro privado → donantes/híbrido → reloj completo. El detalle de 14 etapas queda fijado en `APRENDER-CONTENIDO.md` y `APRENDER-DECISIONES.md`.

### D17 — nombres de piezas bilingües

Definir glosario normativo español–inglés, tratamiento de términos sin traducción única y si se muestran ambos nombres siempre o por preferencia.

### D18 — almacenamiento y backups

Definir cuota de fuentes/activos, política de limpieza, backups automáticos y recuperación de expedientes.

## 8. Recomendación de arranque

No comenzar por añadir el botón `Aprender` o una lección en `StudioViewport`. Primero aprobar **D01, D02, D03, D04, D07, D08 y D13**; después se podrá iniciar el Sistema 0. Estas siete B0 fijan identidad, movimientos de referencia, canon, fidelidad, contrato declarativo, evaluación y compatibilidad. D06 ya no bloquea el arranque porque la distribución pública está fuera del alcance; su modelo local simple debe quedar cerrado antes de persistir fuentes en el Sistema 2.

El usuario aprobó las siete decisiones B0 el 2026-07-22. Sistema 0 se ejecutó sin iniciar Sistema 1; el inventario exacto, las desviaciones justificadas y sus criterios de salida están en `APRENDER-SISTEMA-0.md`.

### Reconciliación con la implementación de Sistema 0

- La frontera real es `src/learning`, aislada de React, el store y `StudioViewport.tsx`.
- El paquete v1 se valida como representación materializada; el loader ZIP se mantiene en Sistema 2 para fijar allí límites de descompresión.
- `.wplab` permanece en `packageVersion: 1`; Sistema 0 solo define el dossier opcional y prueba que el lector actual ignora entradas aditivas.
- v6 no sustituye todavía `WatchProject` v5: existe como canon validado y proyección de lectura pura.
