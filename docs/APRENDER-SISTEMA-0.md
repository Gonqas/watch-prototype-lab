# Aprender — Sistema 0: contratos, identidad canónica y fundamentos

Estado: **implementado y verificado** el 2026-07-22. Este documento describe únicamente Sistema 0; no autoriza ni inicia Sistema 1.

## 1. Objetivo y resultado

Sistema 0 establece contratos estables para que escenas, evaluación, tutor, biblioteca, donantes y metrología puedan referenciar la misma verdad técnica. La aplicación conserva su comportamiento anterior: no hay pantalla, ruta, renderer, store ni persistencia educativa nuevos.

Los siete ADR B0 aceptados están en [`docs/adr`](./adr/README.md). La implementación se mantiene aislada en `src/learning` y consume el modelo `vnext`; no depende de la arquitectura antigua.

## 2. Alcance implementado

- Identidad técnica `learning` y seis familias de IDs canónicos con marca.
- Canon v6 general, abierto y multimarca para definiciones, instancias, ensamblajes, interfaces, dependencias y movimientos.
- Validación estructural y semántica: cardinalidad, unicidad, pertenencia, huérfanos y ciclos.
- Ciclo de vida de instancias y política explícita de borrado.
- Índice de entidades y selectores semánticos limitados.
- Adaptador de lectura v5→v6 con IDs sintéticos deterministas y round-trip controlado.
- Detector de características que exigen persistir en v6.
- Perfiles G/K/P y separación estructural de educación, ingeniería, evidencia y propuestas.
- Autoridad, procedencia, licencia/uso y política conservadora de exportación de fuentes.
- Contrato materializado de `.wplab-learning-pack`, JSON Schema, Zod y validación semántica.
- Contrato de escena declarativa sin renderer.
- Sesiones, eventos, competencias, evidencias, reglas, progreso y evaluación determinista.
- Dossier educativo opcional para `.wplab` sin cambiar el contenedor actual.
- Fixtures v5, v6, MIYOTA 8215, scratch/multimarca y paquete educativo contractual.

## 3. No objetivos respetados

No se han implementado UI de Aprender, navegación, mapa de conocimiento, renderer, desmontaje, averías, tutor/IA, biblioteca, OCR/PDF, almacenamiento de progreso, IndexedDB, backups, metrología, importación automática, modelos 3D, migración global a v6 ni cambios en `StudioViewport.tsx`.

Tampoco se han modificado el store, SQLite, el encoder `.wplab`, el sidecar CAD ni el modelo v5 de producción. Sistema 0 no contiene contenido que deba presentarse como curso real.

## 4. Arquitectura y rutas

```text
src/learning/
├── identity.ts                         IDs y fingerprints deterministas
├── canonical.ts                        canon v6, validación, ciclo de vida e índice
├── adapters/projectV5.ts               proyección pura v5 → v6
├── fidelity.ts                         G/K/P y resultados separados
├── sources.ts                          autoridad, procedencia y uso
├── scenes.ts                           DSL declarativa de escena
├── assessment.ts                       evidencia, sesiones y evaluador puro
├── portability.ts                      dossier opcional .wplab
├── content/learningPack.ts             tipos y validación runtime del paquete
├── content/schemas/
│   └── learning-pack-v1.schema.json    esquema interoperable inicial
├── fixtures/canonicalFixtures.ts       v5, v6, MIYOTA y scratch
├── fixtures/learningPackFixtures.ts    paquete válido e inválido
└── index.ts                            frontera pública futura
```

Los tests están junto a los módulos. No hay todavía una ruta de aplicación: `learning` es una identidad contractual, no una pantalla.

## 5. Canon técnico y estado educativo

`CanonicalAssembly` es la representación física autoritativa. Contiene:

- `PartDefinition`: qué es una pieza; categoría abierta y clasificación `known`, `placeholder` o `unknown`;
- `PartInstance`: pieza física concreta, incluso si comparte definición con otra;
- `AssemblyInterface`: relación funcional o de montaje con dos o más participantes;
- `AssemblyDependency`: precedencia parcial con obligatoriedad, herramientas, precondiciones, riesgos y motivo;
- `MovementReference`: referencia trazable, sin imponer fabricante al núcleo;
- `ProjectEntityIndex`: resolución contra la versión concreta del ensamblaje.

`LearningSession.reversibleState` solo conserva selección, ocultación, aislamiento, explosionado, errores simulados, anotaciones, respuestas e hipótesis. Ninguno de esos campos modifica automáticamente `CanonicalAssembly` ni el proyecto v5. `ProjectChangeProposal` es un objeto separado y no se aplica por sí mismo.

### 5.1 Identidad

| Tipo | Prefijo | Uso |
| --- | --- | --- |
| `PartDefinitionId` | `pd_` | definición compartida por piezas equivalentes |
| `PartInstanceId` | `pi_` | una pieza física concreta |
| `AssemblyInterfaceId` | `ai_` | interfaz funcional o de montaje |
| `AssemblyDependencyId` | `ad_` | precedencia de desmontaje/montaje |
| `MovementReferenceId` | `mr_` | referencia documental de calibre |
| `AssemblyId` | `ay_` | ensamblaje concreto |

El algoritmo sintético está versionado como `v5-projection-1`. Usa ID de proyecto y clave semántica heredada; no usa nombres traducidos ni índices visuales. Los fingerprints de contrato usan FNV-1a de 64 bits sobre JSON con claves ordenadas: detectan cambios, pero no son hashes de seguridad. Los activos usan SHA-256 mediante Web Crypto.

### 5.2 Ciclo de vida

| Operación | Garantía |
| --- | --- |
| crear | rechaza ID repetido y referencias inválidas |
| actualizar | conserva ID, incrementa revisión y fecha |
| duplicar | crea ID distinto y registra `derivedFrom` |
| sustituir | enlaza original y sustituto sin confundirlos |
| trasplantar | conserva proyecto/instancia donante |
| desactivar | conserva entidad y relaciones |
| borrar | marca `deleted`; por defecto rechaza referencias |
| borrar en cascada | requiere política explícita y elimina relaciones afectadas |
| importar | aplica Zod y validación semántica |
| resolver | devuelve `resolved`, `missing`, `ambiguous` o `unsupported` |

Las dependencias son un grafo dirigido acíclico. La validación rechaza ciclos y referencias huérfanas. Las piezas desconocidas permanecen `unknown` o `placeholder`; no se sustituyen por datos inventados.

## 6. Frontera v5→v6

`projectV5ToCanonical` es una proyección de lectura pura. No muta el proyecto, no escribe en el store, no modifica SQLite y no convierte el archivo. Sus entidades llevan `persistence: synthetic-v5`.

`roundTripV5Projection` devuelve un clon del proyecto fuente solo si la proyección conserva su fingerprint, sigue siendo v5 y no contiene características v6. El salto persistido será necesario al añadir:

- múltiples instancias canónicas de una definición;
- tornillos o rubíes explícitos;
- interfaces canónicas persistidas;
- dependencias de montaje;
- topología arbitraria;
- piezas adicionales no expresables en v5;
- referencias externas de geometría.

El detector existe, pero Sistema 0 no implementa el escritor v6 ni el flujo de confirmación. Abrir v5 sigue siendo no destructivo.

## 7. Fidelidad y autoridad

`FidelityProfile` conserva tres ejes independientes: `G0…G4`, `K0…K4` y `P0…P4`. No calcula una puntuación global ni usa `isExact`.

Los discriminantes impiden intercambiar `EvidenceClaim`, `EducationalSimulationResult`, `EngineeringValidationResult` y `ProjectChangeProposal`. Observación, fuente, cálculo, inferencia e hipótesis también son tipos explícitos. Cada claim conserva método, perfil, fiabilidad, incertidumbre opcional, limitaciones, fingerprint, fecha, versión y fuentes.

Las autoridades iniciales son `official-miyota`, `physical-unit-observation`, `private-book-theory` y `educational-derived`. El uso es `private-local`, `official-linked`, `official-cached`, `user-created`, `shareable` o `unknown`. Por defecto se embebe `shareable`/`user-created`, se referencia `official-linked` y se excluye el resto. No hay biblioteca ni almacenamiento de PDFs en Sistema 0.

## 8. Paquete declarativo

La representación lógica validada de `.wplab-learning-pack` v1 corresponde a esta estructura futura:

```text
manifest.json
content/blocks/*.json
content/lessons/*.json
content/activities/*.json
content/scenes/*.json
content/competencies/*.json
content/evidence/*.json
content/rubrics/*.json
content/glossary/*.json
assets/<contenido-identificado-por-hash>
```

El manifiesto fija versión de formato, SemVer, ID, autores, idiomas, dependencias, capacidades, movimientos, activos, hashes, procedencia, entradas y versión mínima de aplicación. Admite `integrated` y `local-unsigned`.

La validación runtime aplica Zod y después comprueba rutas, referencias, IDs duplicados, correspondencia con el manifiesto, Markdown, tamaño y profundidad. Los límites iniciales del JSON materializado son 5 MiB y 32 niveles. Se rechazan rutas absolutas, unidades Windows, `..`, barras inversas, HTML y esquemas `javascript:`.

El JSON Schema especifica el sobre y el manifiesto. Zod más la validación semántica son normativos para estructuras internas y referencias cruzadas. La autorización posterior de Sistema 1 amplió expresamente su alcance para incluir el loader ZIP y cerrar allí los límites de descompresión; su implementación se documenta en [`APRENDER-SISTEMA-1.md`](./APRENDER-SISTEMA-1.md).

## 9. Escenas y selectores

`EducationalScene` declara cámara, selección, visibilidad, ocultación, aislamiento, explosionado, sección, velocidad, timeline, operaciones animadas, overlays, flechas, etiquetas, resaltados, texto, pasos, preguntas, éxito, restauración y capacidades.

Los selectores admitidos son por instancia, definición, rol, subsistema, calibre, interfaz, etiqueta o consulta limitada. La consulta solo permite igualdad sobre `category`, `classification`, `manufacturer` y `reference`, con un máximo de ocho cláusulas. No existe expresión evaluable ni código arbitrario.

## 10. Evaluación y sesiones

Los estados son exactamente `not_started`, `introduced`, `practising`, `demonstrated` y `retained`. `evaluateAssessment` filtra evidencia por competencia/tipo/puntuación, ordena por ID, aplica mínimos de evidencias/sesiones/separación temporal y conserva versión, IDs, fingerprint y explicación. Un evento de compleción aislado no produce dominio.

La sesión fija versiones de paquete, actividad y rúbrica, proyecto o plantilla, fingerprint inicial, capacidades y estado reversible. No hay IA en la decisión.

## 11. Compatibilidad `.wplab`

`LearningDossierManifest` y `LearningExportSelection` modelan una entrada futura opt-in. El encoder actual no se ha cambiado y `packageVersion` sigue siendo 1. Un test añade `learning/dossier.json` a un ZIP existente y demuestra que el decoder actual lo ignora mientras recupera el proyecto.

Se excluyen por defecto perfil global, progreso e historial completos, tutor, PDFs privados, cachés y activos de licencia desconocida. Sistema 0 no persiste ni exporta todavía un dossier real.

## 12. Fixtures y pruebas

- v5: proyecto MIYOTA 2035 con ID/fechas fijos y proyección sin mutación;
- v6: platina, definición de tornillo, dos instancias, interfaz, dependencia, procedencia y G/K/P;
- MIYOTA 8215: referencia documental oficial, sin despiece, geometría o relaciones internas inventadas;
- scratch/multimarca: categoría abierta sin dependencia de MIYOTA;
- paquete educativo: concepto, escena, actividad, competencia, plantilla de evidencia, rúbrica, claim G/K/P y proyecto de solo lectura;
- paquete inválido: traversal y HTML para comprobar rechazo.

Los tests cubren IDs, fingerprints, v5→v6, round-trip, motivos de persistencia, cardinalidad, huérfanos, ciclos, ciclo de vida, resolución, serialización, G/K/P, autoridad, paquete/Markdown/rutas/límites/SHA-256, evaluación/sesión y tolerancia `.wplab` a entradas futuras.

## 13. Decisiones técnicas y desviaciones justificadas

1. Se usa `src/learning`, una frontera pequeña alineada con el identificador aprobado y aislada de UI.
2. No se añade dependencia de hashing: Web Crypto cubre SHA-256; los fingerprints síncronos se etiquetan `fnv1a64`.
3. El JSON Schema especifica exhaustivamente sobre/manifiesto; Zod evita duplicar como segunda fuente manual todo el esquema profundo.
4. El fixture MIYOTA es documental, no una reconstrucción física, para no inventar despiece.
5. El dossier `.wplab` solo se modela y prueba como entrada desconocida; no se cambia producción.

## 14. Limitaciones y deuda conocida

- No hay `WatchProject` v6 persistido, migrador de escritura ni downgrade.
- El índice está en memoria y no está conectado al store.
- El borrado es lógico; compactación/tombstones persistidos quedan por diseñar.
- FNV no autentica ni resiste colisiones hostiles.
- El JSON Schema no sustituye la validación semántica Zod.
- Sistema 0 no incluía loader ZIP ni límites de descompresión. Esa deuda se cerró en Sistema 1; firma y sandbox de activos siguen pendientes.
- Faltan política final de licencias, cuotas, caché, persistencia y backups.
- No hay renderer ni matriz real de capacidades del viewport.
- El evaluador cubre umbrales, no rúbricas compuestas o revisión humana.
- La compatibilidad externa de dossiers debe verificarse antes de distribuirlos.

Actualización posterior: Sistema 4A cerró la falta de workspace y pipeline de autoría mediante una ampliación aditiva de `learning-pack-v1`. No modificó los contratos canónicos ni `.wplab`; véanse [`APRENDER-SISTEMA-4A.md`](./APRENDER-SISTEMA-4A.md) y [`APRENDER-AUTORIA-CONTENIDO.md`](./APRENDER-AUTORIA-CONTENIDO.md).

## 15. Criterios y propuesta para Sistema 1

Sistema 1 solo puede comenzar tras aprobar un alcance que consuma estos contratos, mantenga el overlay reversible, defina capacidades del viewport, trate selectores ausentes/ambiguos, no persista v6 implícitamente, preserve separación educativa/técnica, funcione offline con contenido integrado y pruebe restauración del estado.

La aprobación posterior sustituyó esta propuesta mínima por un runtime completo y general. El resultado implementado, todavía sin autoría, tutor ni progreso persistente, se describe en [`APRENDER-SISTEMA-1.md`](./APRENDER-SISTEMA-1.md).
