# Watch Prototype Lab · cierre 0.14F

## Inicio seguro

- Commit inicial: 086b73eeb1b6d73aca4af4c9e497fd0d825562d6.
- Rama: main.
- Árbol inicial: clean; no había cambios ajenos que mezclar.
- Informes históricos 0.14A–0.14E descubiertos: 79; digest combinado 085477ac8849684cb8ef18de11081267717ce830605f9a3c1b5f8b94211fa65f.

## Corpus e integridad

| Paquetes | Rutas | Módulos | Lecciones | Actividades | Digest |
| ---: | ---: | ---: | ---: | ---: | --- |
| 8 | 24 | 217 | 222 | 289 | 5098aef19660130a4ee6a08749e5aedcf99ecb3ad15f9acffe7bdb034a4eae7f |

`learning-content/` y `reference-library/originals/` permanecen deliberadamente intactos. Se conservaron todos los IDs, el progreso, mastery, sesiones, notas, marcadores, deep links y aliases.

## Resultado de fase

- 0.14E continúa construible y sus 12 informes son idénticos.
- 0.14F es la fase activa única de la interfaz.
- 6 lecciones de etapa 0, 49 apartados visibles completos y 8 presentaciones de actividades históricas.
- 6 claims: 3 revisados con localizador y 3 limitados sin inventar precisión.
- 6 visuales esenciales: 5 nuevos y 1 reutilizado/versionado.
- 5 briefs de fotografía real pendientes; ninguno cuenta como visual.
- 7 prácticas personales opcionales; el total curricular sigue siendo 289.
- Cola de revisión personal: 22 entradas únicas, todas sin valoración inventada.
- Capturas 0.14F registradas: 16.

## Archivos de la entrega

### Creados

- `src/learning/academy/reader/personal/`: 23 módulos separados por contratos, registro, 0.14E histórica y 0.14F activa.
- `scripts/academy-stage0-curation.ts`, `scripts/academy-audit/academy-stage0-curation.test.tsx` y `scripts/academy-audit/academy-stage0-qa-snapshot.ts`.
- 16 salidas `ACADEMY-*-0.14F.*` bajo `docs/generated/`.
- 16 capturas únicas bajo `docs/academy-ux/screenshots/0.14F/`.

### Modificados

- `package.json` y el generador/prueba 0.14E, únicamente para integrar 0.14F sin contaminar sus salidas.
- Estado local, prerrequisitos y contratos del lector: `academyLocalState.ts`, `academyPathPrerequisites.ts`, la fachada `academyPersonalCurriculum.ts`, `academyReaderModel.ts`, `academyReaderDocument.ts`, `academyReaderReview.ts` y `academyReader3dPresentation.ts`.
- Superficies visibles: `LearningSurfaces.tsx`, `AcademyContinuousLessonSurface.tsx`, `AcademyEditorialReviewSurface.tsx` y sus dos hojas de estilo.

### Eliminados y deliberadamente intactos

- No se eliminó ningún archivo rastreado. Se borraron únicamente renders PDF, logs, PID y utilidades temporales bajo `.cache/`.
- Permanecen intactos `learning-content/`, `reference-library/originals/`, los informes 0.14A–0.14E, los IDs, las rutas visibles, los paquetes, las bases, el progreso, mastery, sesiones, notas y marcadores.

## Compatibilidad, pruebas y seguridad

Resultados declarados por la validación final: stage0Audit=passed, previousAudits=passed, typescript=passed, eslint=passed, vitest=passed · 621/621, build=passed · 1.27 s final en caliente; 7.97 s primera medida, verify=passed · segunda ejecución; el primer intento agotó un timeout histórico y el caso pasó aislado en 9.72 s, diffCheck=passed, npmAudit=passed · 0 vulnerabilidades.

No hay recetas químicas, procedimientos históricos accionables, fotografías artificiales ni evidencia digital presentada como destreza física. Bulova se usa como progresión pedagógica localizada; TM como método histórico; MIYOTA como fuente oficial o caso de aplicación cuando corresponde.

## Rendimiento medido

- Mediana local en caliente hasta texto utilizable: 228 ms (3 recorridos: 186/367/228 ms).
- Mediana local en caliente hasta el visual esencial: 286 ms (3 recorridos: 318/268/286 ms).
- Curación 0.14F: 10 módulos TypeScript y 88185 bytes de fuente.
- Registro personal completo: 23 módulos TypeScript y 159962 bytes de fuente; continúa detrás de la superficie de Academia cargada de forma diferida.
- Payload semántico de los seis visuales: 6568 bytes antes de compresión. Fuentes de UI medidas: lector 32599 bytes y actividades 108632 bytes.
- Primera build de producción medida: 7.97 s; build final en caché caliente: 1.27 s. Chunks emitidos: fase 0.14F 147.48 kB (41.93 kB gzip), lector continuo 21.66 kB (6.5 kB gzip) y superficie de actividades 96.09 kB (23.95 kB gzip).
- La memoria no dispone de una API comparable en este entorno y queda como desconocida. El build mantiene avisos de chunks de contenido superiores a 500 kB; el chunk específico 0.14F permanece por debajo de ese umbral.

## Riesgos y siguiente paso

Las fotografías reales siguen pendientes, la claridad personal permanece en “not-reviewed” hasta que la valores y las fuentes limitadas no se elevan a revisadas. El QA forzado con navegaciones consecutivas mostró avisos de rendimiento y conflictos de versión no creciente al persistir el perfil; no bloquearon la lectura, pero requieren reproducirse y aislarse antes de ampliar la curación. Para 0.14G conviene abrir personalmente las seis lecciones, realizar al menos una práctica opcional y decidir si la etapa 0 ya permite empezar sin confusión antes de curar fundamentos de etapa 1.

La etapa 0 se ha curado como experiencia de entrada personal en español.

MIYOTA 2035 continúa siendo un caso de aplicación documentado y no el centro del aprendizaje de banco o herramientas.

No se han creado traducciones, usuarios, revisores externos, certificaciones ni acreditaciones de destreza física.

Las prácticas personales son opcionales, locales, autodocumentadas y no alteran el progreso curricular.
