# Academia relojera 0.7 — arquitectura pedagógica, implementación y ruta maestra

Fecha de cierre técnico: 2026-07-29  
Aplicación mínima: Watch Prototype Lab 0.7.0  
Contenido declarativo: 0.4.0  
Auditoría de partida: `docs/APRENDER-AUDITORIA-ACADEMIA-0.7.md`

## 1. Resultado

La Academia deja de ser una colección de fichas y prácticas sueltas. La aplicación dispone ahora de un único plan de estudio, explica antes de evaluar, registra intentos solo cuando la persona confirma una respuesta, diferencia finalización de dominio y programa repasos de recuperación en sesiones posteriores.

El objetivo de producto queda definido como **llegar a diseñar un reloj mecánico desde cero**, pero la interfaz distingue de forma explícita:

- conocimiento actualmente disponible;
- base educativa o estructural todavía no validada como ingeniería;
- capacidades futuras de cálculo, CAD, fabricación, metrología y taller;
- competencia virtual frente a destreza física.

La aplicación no afirma que las cuatro rutas actuales basten para fabricar un movimiento propio. Hace visible el recorrido que falta y evita conceder una acreditación que el sistema no puede demostrar.

La Academia es deliberadamente **multimarca y orientada al dominio relojero general**. MIYOTA aporta dos primeros casos bien documentados; no es el centro del plan, no define las competencias y no limita los futuros movimientos, prácticas o proyectos. La base transversal de cálculo se documenta en `docs/APRENDER-INGENIERIA-RELOJERA.md`.

## 2. Política de fuentes

### 2.1 MIYOTA 2035 y MIYOTA 8215

Toda identidad, dato nominal, dimensión, instrucción, referencia de pieza o afirmación específica de estos calibres debe proceder de:

- página oficial MIYOTA;
- especificación oficial;
- plano oficial;
- manual oficial;
- lista de piezas o vista explosionada oficial.

Registros verificados:

- [MIYOTA 2035](https://miyotamovement.com/product/2035/)
- [MIYOTA 8215](https://miyotamovement.com/product/8215/)

`npm run learning:miyota-sources:verify` verificó los diez recursos oficiales y sus SHA-256. Los paquetes ejecutables `wplab.horology.quartz-miyota2035` y `wplab.horology.miyota8215` no contienen ninguna referencia `source.horology.private-book.*`.

### 2.2 Libro privado de relojería mecánica

El PDF privado aportado por la usuaria se usa únicamente como fuente secundaria de teoría general:

- construcción de relojes mecánicos;
- herramientas y trabajo de taller;
- ruedas y piñones;
- muelle y barrilete;
- escape;
- volante y espiral;
- diseño general de movimientos.

No es una fuente sobre MIYOTA y no sustenta geometría, piezas, procedimientos ni datos del 2035 o 8215. Permanece en fundamentos mecánicos y en la futura ruta de construcción; no se redistribuye, no se integra como activo del paquete y no se reproduce.

### 2.3 Jerarquía epistemológica

El contenido conserva la separación entre:

1. dato oficial;
2. identidad oficial;
3. observación;
4. medición;
5. deducción documental;
6. reconstrucción estimada;
7. simulación educativa;
8. desconocido.

Una animación no eleva la autoridad del dato. Una proporción visual no se convierte en dimensión y una reconstrucción R2 o G2/K2/P0 no se denomina gemelo exacto.

## 3. Secuencia de estudio

El orden canónico para el objetivo de diseño mecánico es:

1. **Orientación funcional relojera.** Vocabulario, anatomía, cadenas de energía y procedencia.
2. **Fundamentos del reloj mecánico.** Relaciones causales, tren, escape, oscilador, puesta en hora, automático y calendario sobre un modelo conceptual.
3. **Lectura comparada de calibres reales.** Documentación oficial, estructura, montaje virtual y diagnóstico conceptual. MIYOTA 8215 y 2035 son los primeros casos por disponibilidad de fuentes, no la meta.
4. **Matemáticas, física y metrología.** Unidades, oscilador, energía, tolerancias, capacidad de proceso y fiabilidad con resultados trazables.
5. **Diseño y fabricación.** Tren, escape, espiral, barrilete, materiales, ajustes, CAD y procesos.
6. **Prototipo y reloj propio.** Requisitos, montaje, medición, iteración y dossier técnico.

El sistema no salta a una prueba porque la persona declare experiencia previa. La familiaridad solo modifica recomendaciones; el dominio requiere evidencia.

## 4. Ciclo pedagógico implementado

Cada unidad sigue el ciclo:

1. preparar;
2. observar;
3. comprender;
4. practicar con apoyo;
5. demostrar sin ayuda;
6. transferir a otro contexto;
7. recuperar después de 1, 7 y 21 días.

Las lecciones presentan primero:

- modelo mental;
- entrada, interfaz, cambio y salida;
- ejemplo resuelto;
- lista de comprobación;
- aplicación a un reloj propio;
- frontera de fuentes.

Las prácticas especializadas ya no reutilizan tres preguntas genéricas. Cada actividad tiene una escena específica, pregunta, razonamiento estructurado, feedback causal, pistas, tutor y transferencia ligados a su objetivo.

## 5. Ayudas e intentos

- Escribir o cambiar una opción modifica solo un borrador local.
- El intento se registra al pulsar **Comprobar respuesta**.
- Ninguna pista aparece antes del primer intento.
- La orientación, el subsistema, la propiedad funcional y la comparación se abren tras un intento.
- La aproximación a la respuesta y la explicación posterior requieren al menos dos intentos.
- Los pasos futuros permanecen bloqueados hasta completar el actual.
- Un comando rechazado se muestra en el workspace sin derribar toda la Academia.

Esto evita que escribir una frase genere decenas de intentos, que una pista revele la solución antes de pensar o que un fallo local se presente como error global.

## 6. Tutor contextual

El tutor implementado es determinista y acotado; no utiliza IA generativa. Cambia su orientación según:

- ausencia de intentos;
- pieza seleccionada;
- respuesta incorrecta;
- razonamiento pendiente de revisión;
- fuentes declaradas.

Puede orientar, formular preguntas socráticas, señalar una fuente y proponer remediación. No puede:

- inventar datos;
- evaluar una respuesta abierta;
- sustituir la evidencia;
- presentar simulación como validación de ingeniería;
- revelar una corrección de error conceptual antes de un intento incorrecto.

La arquitectura queda preparada para un tutor futuro, pero su autoridad seguirá siendo `coach-not-assessor`.

## 7. Evaluación y estados

Se separan seis estados de actividad:

- no iniciada;
- en curso;
- finalizada;
- demostrada;
- transferida;
- retenida.

Finalizar una sesión no equivale a demostrar. Las actividades de demostración necesitan evidencia independiente y al menos dos resultados aceptados. Las transferencias se identifican con una regla específica `.transfer`. Retención exige otra sesión posterior y el intervalo real correspondiente.

Las respuestas estructuradas se guardan como razonamiento propio, pero no se califican por longitud. Si requieren revisión:

- quedan visibles;
- la interfaz explica que no se han calificado;
- el motor las excluye de la acreditación automática;
- la evaluación usa únicamente evidencia determinista válida.

Las adaptaciones de accesibilidad no cuentan como ayudas y el tiempo no penaliza.

## 8. Repaso espaciado

La cola de repaso:

- prioriza fechas vencidas;
- respeta aplazamientos;
- inicia la práctica con `mode=retention`;
- pide recuperar antes de volver a enseñar;
- permite cambiar de actividad para variar el contexto;
- registra el repaso como retención, no como una repetición ordinaria.

El plan único usa esta prioridad:

1. recuperar una sesión interrumpida;
2. atender un repaso vencido;
3. remediar una competencia en práctica;
4. continuar la ruta activa;
5. avanzar por el currículo canónico.

## 9. Persistencia

El estado de Academia ya no queda dividido de forma incoherente:

- el perfil conserva `academyStateV1`;
- las preferencias de interfaz, onboarding, notas, capturas, métricas y aplazamientos se hidratan desde el perfil;
- una copia local permite arranque y recuperación rápida;
- gana la versión con `updatedAt` más reciente;
- el borrado de perfil elimina también el estado local asociado;
- sesiones, evidencias, evaluaciones y dominio se agregan por páginas de hasta 250 registros hasta reunir el total, sin truncar silenciosamente en 40.

Límites ampliados:

- capturas: 64;
- métricas UX: 500;
- sesiones, evidencias, evaluaciones y dominio: paginación completa.

El contenido instalado y el progreso siguen siendo locales. No existe sincronización remota implícita.

## 10. Accesibilidad y composición

La escala de texto ahora afecta a las reglas en píxeles y rem de:

- navegación;
- encabezados;
- tarjetas;
- lector de lecciones;
- preguntas;
- botones;
- paneles laterales;
- controles del viewport;
- resultados y preferencias.

La normalización es reproducible mediante `npm run learning:text-scale`. A 1,20× y 1,45× se activan composiciones de reflujo: menos columnas, lector y visual apilados, panel contextual horizontal o apilado y workspace de una sola columna cuando es necesario.

También se conservan:

- enlace para saltar al contenido;
- foco al navegar;
- título de documento por superficie;
- alternativa textual;
- reduced motion;
- señales independientes del color.

## 11. Métricas posteriores a la intervención

| Métrica | Resultado |
|---|---:|
| Paquetes reales | 4 |
| Versión declarativa | 0.4.0 |
| Conceptos | 57 |
| Lecciones | 43 |
| Prácticas | 96 |
| Escenas empaquetadas | 129 |
| Palabras en bloques de lección | 37.884 |
| Bloque más corto | 795 palabras |
| Preguntas totales | 255 |
| Preguntas distintas | 174 |
| Actividades de demostración | 12 |
| Actividades de transferencia | 5 |
| Pistas disponibles antes de intentar | 0 |
| Conceptos aislados | 0 |
| Referencias al libro en paquetes MIYOTA | 0 |

La Ruta 0 mantiene exactamente sus seis escenas normativas. Las especializaciones añaden 86 escenas de práctica específicas: 20 para 2035, 29 para fundamentos mecánicos y 37 para 8215.

## 12. Ruta maestra hacia un reloj propio

La portada muestra ocho niveles:

1. lenguaje y lectura funcional — disponible;
2. arquitectura mecánica — base disponible;
3. lectura comparada de calibres — base estructural disponible; MIYOTA 8215 es el primer caso;
4. matemáticas, física y metrología — laboratorio inicial disponible;
5. diseño de tren, escape y oscilador — base de tren ideal y oscilador disponible; curso incompleto;
6. CAD, tolerancias, materiales y fabricación — futuro;
7. prototipo, montaje y validación física — futuro;
8. proyecto integral de reloj propio — futuro.

Los niveles futuros no son tarjetas decorativas: fijan el contrato de alcance para los próximos paquetes. Cada uno necesitará fuentes, problemas graduados, modelos, rúbricas, evidencias y criterios de aceptación propios. El nivel 4 ya dispone de una primera implementación nativa y de un cuaderno separado por proyecto.

## 13. Compatibilidad

- Los paquetes 0.4.0 requieren aplicación 0.7.0.
- Las dependencias internas usan `^0.4.0`.
- La evidencia histórica conserva `packageVersion` y `activityVersion`; no se reinterpreta como evidencia 0.4.0.
- Si falta el binario exacto de una sesión histórica, la recuperación ya no ofrece una reanudación imposible: conserva la revisión de solo lectura y permite iniciar un intento nuevo sobre el paquete actual, enlazado mediante `originSessionId`.
- Un fallo al preparar una recuperación deja la sesión en estado `failed`, conserva los datos y muestra un error accionable; no queda un botón aparentemente inerte ni una sesión atrapada en `recovering`.
- `.wplab`, `WatchProject` y las bases existentes no se mutan desde una práctica educativa.
- Los nuevos campos de transferencia del dominio son opcionales al leer proyecciones antiguas.
- `academyStateV1` se almacena dentro de preferencias educativas sin invalidar perfiles previos.
- El cuaderno de ingeniería usa `wplab.engineering-notebook.v1:<projectId>` y no altera `.wplab` ni `WatchProject`.

## 14. Automatización y archivos principales

Migración editorial reproducible:

```text
npm run learning:academy-upgrade
```

Normalización de escala:

```text
npm run learning:text-scale
```

Verificación oficial:

```text
npm run learning:miyota-sources:verify
```

Validación de cada paquete:

```text
npx tsx scripts/learning-content.ts validate learning-content/<paquete>
```

La comprobación visual se realizó en el navegador integrado sobre portada, lección, ficha de actividad, recuperación histórica, workspace, animación, respuesta explícita, repaso y preferencias. Se verificó reflujo al 150 %, ausencia de desbordamiento horizontal a 1280 px y en composición estrecha, activación real del mecanismo y ausencia de feedback antes de pulsar `Comprobar respuesta`.

Verificación de cierre:

- cuatro paquetes 0.4.0 validados sin diagnósticos editoriales;
- diez recursos oficiales MIYOTA verificados con sus hashes;
- `npm run verify` correcto;
- 76 archivos de prueba y 351 pruebas superadas;
- compilación TypeScript y build de producción correctos.

Archivos de arquitectura:

- `src/learning/academy/academyStudyPlan.ts`
- `src/learning/academy/academyCatalog.ts`
- `src/learning/academy/academyPedagogy.ts`
- `src/learning/academy/watchmakerJourney.ts`
- `src/learning/academy/academyLocalState.ts`
- `src/learning/application/service.ts`
- `src/learning/ui/LearningActivityWorkspace.tsx`
- `src/learning/ui/EngineeringLabSurface.tsx`
- `src/core/horology-engineering/`
- `scripts/upgrade-academy-completeness.mjs`
- `scripts/normalize-learning-text-scale.mjs`

## 15. Límites y siguiente deuda honesta

La mejora cierra defectos de arquitectura pedagógica y hace ejecutable el estudio actual. No sustituye el trabajo editorial futuro que requiere llegar a fabricar un reloj. Permanecen fuera del alcance actual:

- física validada de fricción, lubricación, choque y desgaste;
- dimensionado completo de un movimiento fabricable;
- modelos geométricos R4 medidos;
- catálogo completo de tolerancias y ajustes de fabricación;
- práctica física supervisada;
- revisión humana remota;
- tutor conversacional;
- CAD de fabricación y cadena CAM;
- acreditación profesional.

La regla para los siguientes sistemas es: **no añadir más actividades hasta que cada nueva capacidad tenga explicación previa, práctica deliberada, transferencia, repaso, fuente adecuada y evidencia que el sistema pueda evaluar honestamente**.
