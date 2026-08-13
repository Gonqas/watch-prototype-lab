# Aprender — auditoría integral de Academia 0.7

Fecha de auditoría: 29 de julio de 2026  
Alcance: contenido, currículo, estudio, evaluación, progreso, tutor, experiencia, accesibilidad, persistencia y validación.  
Modo: solo lectura. Esta auditoría no modifica código de producción ni contenido pedagógico.

## 1. Veredicto ejecutivo

Academia tiene una base técnica y conceptual valiosa, pero todavía no alcanza el estándar de una formación relojera completa y fiable.

La infraestructura está por delante del producto educativo:

- existen contratos declarativos, procedencia, fidelidad G/K/P, modelos reversibles, evidencia, sesiones, perfiles, accesibilidad y límites físicos;
- la primera ruta ya explica mucho mejor que la versión inicial;
- la experiencia visual es notablemente más clara y el movimiento de los modelos ya tiene propósito;
- sin embargo, las especializaciones todavía están formadas en gran medida por contenido migrado y plantillas repetidas;
- el sistema mide con frecuencia reconocimiento donde el título promete comprensión, ejecución, diagnóstico o dominio;
- varias promesas de estudio —diagnóstico, personalización, transferencia, tutor y consolidación— existen como metadatos, pero todavía no gobiernan el recorrido real;
- cuatro fallos funcionales contaminan intentos, progreso o datos del usuario.

La conclusión no es «rehacer Academia». Es conservar su núcleo y cambiar el orden de trabajo:

1. corregir la integridad de intentos, progreso y persistencia;
2. convertir la ruta inicial en un patrón oro completo desde cero;
3. hacer operativo un único motor de estudio basado en evidencias;
4. reescribir las tres especializaciones actividad por actividad;
5. validar con aprendices y relojeros antes de ampliar a nuevas rutas.

No recomiendo añadir más calibres ni más rutas hasta completar esas cinco condiciones.

## 2. Qué se ha auditado

Se han revisado:

- los cuatro paquetes de contenido instalados;
- 57 conceptos;
- 43 lecciones y sus bloques;
- 96 actividades;
- 43 escenas;
- rutas, módulos, hitos, competencias, rúbricas, evidencias, errores conceptuales, pistas y feedback;
- la arquitectura pedagógica documentada;
- el currículo maestro y el blueprint editorial;
- las superficies de inicio, ruta, lección, actividad, repaso, mapa, cuaderno y preferencias;
- el runtime de actividades;
- persistencia, exportación, backup y borrado;
- el libro privado de referencia entregado;
- referentes de WOSTEP, AWCI y BHI;
- evidencia sobre conocimiento previo, ejemplos resueltos, recuperación, espaciado, transferencia, evaluación en simuladores, UDL y accesibilidad.

Los cuatro `manifest.json` conservan `editorialStatus: "in-review"`. Ese estado es coherente con el resultado de la auditoría.

## 3. Inventario real

| Ruta | Conceptos | Lecciones | Actividades | Escenas | Explicación declarada | Actividades declaradas |
|---|---:|---:|---:|---:|---:|---:|
| Orientación funcional | 8 | 6 | 10 | 6 | 93 min | 84 min |
| Cuarzo / MIYOTA 2035 | 13 | 10 | 20 | 10 | 40 min | 286 min |
| Fundamentos mecánicos | 16 | 12 | 29 | 12 | 48 min | 486 min |
| MIYOTA 8215 | 20 | 15 | 37 | 15 | 60 min | 736 min |
| **Total** | **57** | **43** | **96** | **43** | **241 min** | **1.592 min** |

La proporción de explicación cae a medida que aumenta la dificultad:

- Orientación: aproximadamente 53 % del tiempo declarado;
- MIYOTA 2035: 12 %;
- Fundamentos mecánicos: 9 %;
- MIYOTA 8215: 7,5 %.

Ese gradiente está invertido. Cuanto más compleja es la materia, más modelo mental, ejemplos trabajados, contraste y feedback necesita el alumno.

También existe una diferencia editorial muy marcada:

| Paquete | Palabras medias por bloque |
|---|---:|
| Orientación | 696 |
| MIYOTA 2035 | 309 |
| Fundamentos mecánicos | 280 |
| MIYOTA 8215 | 272 |

Las 43 lecciones tienen un único bloque. Treinta y un bloques contienen menos de 300 palabras y deben cubrir a la vez propósito, teoría, vocabulario, fuentes, actividad, errores, evidencia y limitaciones. La cifra no determina por sí sola la calidad, pero confirma la falta de andamiaje observada en las especializaciones.

### Verificación estructural ejecutada

- `horology-foundations@0.3.1`: validación correcta, sin diagnósticos editoriales;
- `quartz-miyota2035@0.3.1`: validación correcta, sin diagnósticos editoriales;
- `mechanical-foundations@0.3.1`: validación correcta, sin diagnósticos editoriales;
- `miyota8215@0.3.1`: validación correcta, sin diagnósticos editoriales;
- Vitest: 76 archivos y 349 pruebas correctas.

Esto confirma que la estructura declarativa y la base técnica son estables. También demuestra una carencia de las reglas actuales: aceptan preguntas repetidas, pistas genéricas, evidencia avanzada marcada como reconocimiento, requisitos circulares y grafos vacíos. La ausencia de diagnósticos del validador no equivale a aprobación pedagógica.

## 4. Madurez por dimensión

| Dimensión | Estado | Diagnóstico |
|---|---|---|
| Arquitectura técnica | Sólida | Hay separación de dominio, contenido, runtime, evidencia y persistencia |
| Procedencia y límites | Sólida | G/K/P y frontera entre simulación y realidad están bien planteados |
| Experiencia visual base | Intermedia-alta | La interfaz ha mejorado, pero varias acciones y estados siguen sin explicación visible |
| Arquitectura pedagógica documentada | Sólida | La dirección es correcta y está mejor razonada que la materialización actual |
| Ruta de Orientación | Intermedia | Es la mejor ruta, pero aún sobrecarga el inicio y omite bases comunes |
| Especializaciones | Insuficiente | Mucha cobertura nominal, poca enseñanza específica y demasiada plantilla |
| Validez de evaluación | Crítica | El nivel de evidencia no corresponde con gran parte de las competencias prometidas |
| Adaptación y planificación | Inicial | Se recogen datos del alumno, pero apenas cambian su sesión |
| Retención y transferencia | Inicial | Existen contratos y fechas, pero no una ejecución coherente de extremo a extremo |
| Tutor contextual | Inicial | Es una tarjeta estática, no un tutor operativo |
| Accesibilidad | Intermedia | Buenas bases; faltan reflow completo, tabs, foco, escalado y pruebas asistivas |
| Destreza física | Fuera de alcance | Correctamente no certificada por el simulador |
| Eficacia con alumnado real | No validada | No hay todavía datos propios de retención, transferencia o abandono |

## 5. Fortalezas que deben conservarse

### 5.1 Separación entre modelo educativo y realidad física

La Academia distingue geometría, cinemática y física mediante G/K/P, declara reconstrucción, procedencia y limitaciones, y evita presentar R2 como gemelo exacto. Es una decisión correcta y poco habitual.

### 5.2 Trazabilidad

Fuentes, claims, evidencia, versiones, estados iniciales y restauración están representados. La documentación oficial de MIYOTA y el libro privado no se confunden con una medición o una estimación.

### 5.3 Reversibilidad y accesibilidad del laboratorio

Existen:

- restauración;
- alternativa textual;
- movimiento reducido;
- navegación sin arrastre obligatorio;
- listas de entidades;
- selección semántica;
- separación entre fixture y proyecto técnico.

### 5.4 Primera ruta mejor orientada al principiante

La ruta de Orientación:

- explica antes de varias actividades;
- diferencia reloj completo y movimiento;
- introduce función, relación, procedencia e hipótesis;
- combina reconocimiento, explicación, simulación y transferencia;
- no presenta un primer acierto como dominio automático.

### 5.5 Arquitectura pedagógica correcta en intención

El documento `APRENDER-ARQUITECTURA-PEDAGOGICA.md` ya formula reglas válidas:

- no evaluar antes de enseñar;
- distinguir visto, practicado, demostrado, transferido y retenido;
- hacer opcional el puente ISA 8172;
- limitar las pistas cercanas a la respuesta;
- usar el 3D para explicar causalidad;
- no certificar destreza manual mediante simulación.

El trabajo pendiente consiste en hacer que esas reglas gobiernen todo el producto.

## 6. Hallazgos P0 de integridad funcional

Estos problemas deben resolverse antes de considerar fiable cualquier analítica, dominio o planificación.

### P0.1 Cada carácter escrito puede convertirse en un intento

En `src/learning/ui/LearningActivityWorkspace.tsx`, los campos de texto y respuestas estructuradas llaman a `answerQuestion` en cada `onChange`:

- línea 399;
- líneas 411–427.

El runtime incrementa el intento y emite `answer-submitted` cada vez:

- `src/learning/runtime/runtime.ts:335–352`.

El botón «Comprobar respuesta» solo revela una evaluación ya realizada; no realiza el envío.

Consecuencias:

- escribir diez caracteres puede generar diez intentos;
- se guardan borradores incompletos como evidencia;
- las pistas pueden desbloquearse por escribir;
- la dependencia de ayudas queda falseada;
- la confianza de la evidencia y la analítica dejan de ser fiables.

Recomendación:

- mantener un borrador local;
- emitir `answer-submitted` solo con un envío explícito;
- separar `answer-draft-changed` de `answer-submitted`;
- hacer atómica la operación validar–enviar–persistir;
- garantizar mediante prueba que un envío equivale a un intento.

### P0.2 El progreso global se calcula sobre páginas de 40 registros

`PAGE_SIZE` vale 40 en `src/learning/application/service.ts:77`. El snapshot carga como máximo 40:

- sesiones;
- evidencias;
- evaluaciones;
- estados de dominio.

Las rutas y los hitos consultan después `snapshot.sessions.items`. Academia ya ofrece 96 actividades.

Consecuencias:

- una actividad antigua puede dejar de aparecer como completada;
- un hito puede volver a bloquearse;
- competencias fuera de la primera página pueden desaparecer del cálculo;
- portada, ruta y repaso pueden discrepar.

Recomendación:

- no calcular progreso desde una página de historial;
- crear agregados completos: `completedActivityIds`, `routeProgress`, `masteryByCompetency` y `reviewQueue`;
- reservar la paginación para listas visibles;
- probar perfiles con 100, 500 y 2.000 sesiones.

### P0.3 Parte del perfil no entra en backup, exportación o borrado

Onboarding, preferencias, notas, marcadores, capturas, progreso de lectura y aplazamientos de repaso viven en `localStorage`:

- `src/learning/academy/academyLocalState.ts`;
- inicialización en la línea 639.

No forman parte del ciclo transaccional principal de exportación, backup y borrado. La interfaz, sin embargo, atribuye esos datos a SQLite o IndexedDB.

Consecuencias:

- un backup no representa toda la Academia;
- restaurar no recupera notas y lectura;
- borrar un perfil puede dejar datos huérfanos;
- las capturas pueden perderse por cuota o límite local;
- la información de privacidad visible no coincide con la implementación.

Recomendación:

- unificar todo en `AcademyProfileRepository`;
- almacenar binarios fuera de `localStorage`;
- incluir esos datos en backup, exportación, importación y borrado;
- corregir mientras tanto el texto visible.

### P0.4 Las acciones rechazadas parecen botones rotos

Los saltos y la pista permanecen habilitados aunque el runtime pueda rechazarlos:

- `LearningActivityWorkspace.tsx:307`;
- `LearningActivityWorkspace.tsx:1142`.

El servicio guarda el rechazo como error global:

- `src/learning/application/service.ts:1143–1149`.

El workspace no presenta el motivo junto al control.

Recomendación:

- exponer `lastCommandResult`;
- deshabilitar acciones no disponibles;
- mostrar «Haz un intento antes de pedir esta pista» junto al botón;
- anunciar el rechazo con `aria-live`;
- no tratar una restricción pedagógica normal como fallo global.

## 7. Hallazgos P0 pedagógicos y editoriales

### P0.5 Las especializaciones solo acreditan reconocimiento

En MIYOTA 2035, Fundamentos mecánicos y MIYOTA 8215:

- los 86 contratos de actividad declaran `evidenceLevel: "recognition"`;
- todos los hitos de ruta especializados declaran reconocimiento;
- `demonstrationActivityIds` está vacío;
- proyectos finales y simulaciones independientes siguen registrados como reconocimiento.

Además, 80 de los 86 contratos especializados utilizan elección simple.

Consecuencia: el título puede prometer explicar, desmontar, montar o diagnosticar, pero el sistema solo puede inferir reconocimiento.

Recomendación:

```text
reconocer
→ discriminar
→ ordenar
→ explicar causalmente
→ ejecutar con ayuda
→ ejecutar sin ayuda
→ transferir
→ recuperar después de un intervalo
```

Cada competencia debe declarar el peldaño mínimo real y una evidencia proporcional.

### P0.6 Las preguntas especializadas no evalúan su lección

Las 37 escenas especializadas reutilizan solo tres preguntas de elección:

- las 10 escenas de 2035 preguntan por el alcance de la representación;
- las 12 escenas mecánicas preguntan por el tipo de resultado del laboratorio;
- las 15 escenas 8215 preguntan por la autoridad de la práctica.

Cada escena añade además la misma petición genérica de explicación causal.

La cautela epistemológica es valiosa, pero no demuestra que el alumno entienda:

- barrilete;
- tren;
- apoyos;
- escape;
- volante y espiral;
- minutería;
- puesta en hora;
- automático;
- calendario;
- orden de desmontaje o montaje.

Recomendación:

- conservar una comprobación de alcance no evaluativa;
- crear tareas específicas del mecanismo;
- vincular cada pregunta al objetivo y a la escena;
- exigir predicción, contacto, orden, cálculo, diagnóstico o transferencia según la competencia.

### P0.7 Pistas, feedback y tutor son demasiado genéricos

Datos de la auditoría:

- 96 de 96 actividades ofrecen una pista `near-answer` antes del primer intento;
- 96 de 96 ofrecen cinco o más pistas antes del primer intento;
- las 96 comparten la misma pregunta causal;
- las 96 comparten la misma «siguiente observación»;
- las 96 comparten el mismo conjunto de prompts del tutor;
- cada paquete especializado reutiliza un único juego de pistas para todas sus actividades;
- MIYOTA 8215 conserva incluso IDs de pistas copiados del paquete mecánico.

Consecuencia: la ayuda puede hablar de una magnitud o un bloqueo cuando la tarea real consiste en reconocer una pieza o planificar un montaje.

Recomendación:

- no mostrar pistas cercanas a la solución antes de un intento;
- escribir pistas específicas por tarea;
- registrar qué pista se usó;
- exigir después una variante equivalente sin ayuda;
- resolver feedback por pregunta, respuesta, estado visual y error conceptual.

### P0.8 El grafo de MIYOTA 8215 está vacío

Los 20 conceptos del 8215 tienen:

- cero prerrequisitos;
- cero prerrequisitos recomendados;
- cero relaciones con otros conceptos;
- cero objetivos de transferencia.

El motor no puede razonar sobre dependencias ni remediación.

Grafo mínimo recomendado:

```text
identidad y documentación
→ arquitectura
→ barrilete y energía
→ tren y apoyos
→ escape, volante y espiral
→ minutería e indicación
→ cuerda y puesta en hora
→ automático
→ calendario
→ planificación
→ desmontaje
→ inspección
→ montaje y verificaciones
→ diagnóstico
→ dossier y límites
```

Cada nodo debe enlazarse con su equivalente conceptual mecánico.

### P0.9 Los requisitos de actividad son circularmente ambiguos

Las 96 actividades incluyen en `requiresConceptIds` el mismo concepto que pretenden evaluar.

Si el campo significa prerrequisito, la actividad no debería abrirse. Si significa «concepto involucrado», el nombre y su uso son incorrectos.

Recomendación:

- `requiresConceptIds`: solo conocimientos ya necesarios;
- `introducesConceptIds`: contenido nuevo;
- `demonstratesConceptIds`: contenido mostrado mediante ejemplo;
- `practicesConceptIds`: práctica con o sin ayuda;
- `assessesConceptIds`: objetivo evaluado.

### P0.10 Las rúbricas especializadas aceptan evidencia demasiado débil

La mayoría de rúbricas especializadas siguen una regla equivalente a:

- existe al menos una evidencia;
- su confianza alcanza el umbral.

No comprueban necesariamente:

- corrección del resultado;
- orden y dependencias;
- razonamiento causal;
- ausencia de ayuda;
- restauración;
- transferencia;
- retención.

Recomendación:

- rúbricas analíticas;
- criterios independientes;
- errores críticos;
- distinción entre guiado e independiente;
- reevaluación en otra sesión;
- transferencia para competencias amplias.

### P0.11 «Completado» sustituye a «demostrado»

Los hitos y parte del progreso se resuelven mediante sesiones con estado `completed`, no mediante calidad de evidencia o dominio:

- `src/learning/academy/academyCatalog.ts`;
- `src/learning/academy/academyPedagogy.ts:248–257`.

La interfaz debe distinguir:

1. lectura vista;
2. práctica terminada;
3. respuesta válida;
4. competencia demostrada;
5. transferencia;
6. competencia retenida.

## 8. Hallazgos P1 de experiencia y estudio

### 8.1 La personalización se pregunta, pero no decide

Objetivo, herramientas, tiempo, ritmo y profundidad se guardan, pero apenas modifican la sesión.

Debe existir un único `StudyPlanService` que use:

- objetivo;
- tiempo disponible;
- conocimiento demostrado;
- repaso vencido;
- herramientas;
- actividad interrumpida;
- preferencias;
- contenido instalado y conexión.

Salida esperada:

> Hoy: 3 minutos de recuperación, 6 de explicación, 7 de práctica y 4 de transferencia.

### 8.2 Los diagnósticos declarados no se ofrecen

Las rutas especializadas declaran entrada diagnóstica opcional, pero la interfaz no utiliza `diagnosticActivityIds`.

Al abrir una especialización deben existir dos acciones:

- «Empezar desde la base»;
- «Comprobar mi punto de partida».

El diagnóstico no da una nota global: construye un mapa de lagunas y nunca penaliza.

### 8.3 Compiten tres motores de siguiente paso

La portada, el contexto y la ruta pueden recomendar unidades mediante lógicas distintas. Deben converger en un único motor trazable que explique:

- qué recomienda;
- por qué;
- qué evidencia falta;
- cuánto dura;
- qué ocurrirá después.

### 8.4 El ciclo pedagógico visible no es un estado real

La interfaz representa una progresión de etapas, pero la lección solo activa las primeras y no persiste un ciclo compartido entre explicación, práctica, demostración, transferencia y repaso.

Se necesita una proyección por concepto:

```text
preparado
→ observado
→ explicado
→ practicado con apoyo
→ demostrado independientemente
→ transferido
→ consolidado
```

### 8.5 El visual de lección sigue siendo una ficha

«Ver el modelo» no ofrece todavía una microdemostración sincronizada con el segmento.

Cada segmento visual debería declarar:

- cámara;
- piezas visibles;
- contacto resaltado;
- entrada y salida;
- estado antes y después;
- flecha causal;
- texto equivalente;
- control manual.

### 8.6 El tutor no es todavía un tutor

Actualmente:

- muestra prompts estáticos;
- preselecciona un error habitual;
- no lee el estado visual;
- no conserva una duda;
- no conduce un diálogo;
- no dispone de una política de desbloqueo.

Primera versión recomendada, sin IA:

1. recordar objetivo;
2. pedir una observación;
3. señalar una zona;
4. preguntar por una relación;
5. dividir el problema;
6. mostrar un ejemplo análogo;
7. revelar solución solo después de intentos;
8. pedir una nueva ejecución independiente.

La IA futura debe obedecer ese mismo contrato y recuperar únicamente fuentes curadas.

### 8.7 No existe flujo real de revisión humana

Las explicaciones abiertas pueden quedar `pendingReview`, pero no hay bandeja de mentor, rúbrica de autoevaluación ni destinatario.

Mientras no exista revisor:

- usar «registrada; no evaluada»;
- mostrar criterios después del envío;
- comparar con un ejemplo experto;
- pedir revisión propia;
- conservar primera y segunda versión.

### 8.8 El workspace sigue teniendo demasiados controles

Para un principiante aparecen al mismo tiempo paneles, modos, lista, controles del modelo, timeline, velocidad, pistas, captura y restauración.

Recomendación:

- modo guiado como predeterminado;
- una única acción primaria;
- controles revelados por necesidad;
- laboratorio avanzado plegado;
- tutorial interactivo antes de la primera práctica.

## 9. Auditoría curricular por ruta

### 9.1 Ruta 0 — Orientación funcional

Fortalezas:

- mejor profundidad editorial;
- preguntas más específicas;
- varios niveles de evidencia;
- grafo razonablemente coherente.

Lagunas:

- la primera lección introduce demasiados conceptos a la vez;
- faltan orientación visual, seguridad, herramientas, medidas y tolerancias como base común;
- el puente ISA 8172 sigue siendo un hito obligatorio;
- la lección usa cuarzo y la actividad mecánica sin un propósito comparativo suficientemente visible;
- una clasificación de un único tren se proyecta sobre una competencia demasiado amplia.

Recomendación: convertirla en una Ruta 0 universal desde cero.

### 9.2 Ruta 1 — Cuarzo / MIYOTA 2035

Fortalezas:

- documentación oficial;
- banco, herramientas y observación;
- identidad y orientación;
- límites prudentes;
- desmontaje, montaje y comprobaciones parciales declarados.

Lagunas:

- falta enseñar con profundidad la cadena conceptual de cuarzo;
- ISA 8172 no puede ser una experiencia presupuesta;
- las preguntas evalúan alcance, no mecanismo;
- faltan tareas eléctricas conceptuales y diagnósticas específicas;
- la relación entre conceptos y actividades es demasiado amplia;
- todo queda clasificado como reconocimiento.

Secuencia recomendada:

```text
cuarzo conceptual
→ seguridad de pila
→ documentación
→ identidad y arquitectura 2035
→ observación
→ cadena funcional específica
→ desmontaje guiado
→ conservación de identidad
→ montaje
→ verificaciones
→ hipótesis
→ proyecto independiente
```

### 9.3 Ruta 2 — Fundamentos mecánicos

Fortalezas:

- buena cobertura nominal;
- separación del 8215;
- relaciones y cálculos reproducibles;
- barrilete, tren, apoyos, escape, oscilador, minutería, keyless, automático y calendario.

Lagunas:

- explicación demasiado corta para la carga matemática y espacial;
- falta un puente de unidades, razón, proporción, frecuencia y periodo;
- par, trabajo, fuerza, holguras, beat error e isocronismo no reciben siempre progresión suficiente;
- el diagnóstico aparece antes de cerrar la cadena;
- faltan problemas graduados y configuraciones diferentes;
- una dependencia exige calendario antes de que este se enseñe.

Secuencia recomendada:

```text
energía, fuerza y par
→ muelle y barrilete
→ rueda, piñón, razón y sentido
→ tren
→ pivotes, rubíes y holguras
→ escape
→ frecuencia, periodo y amplitud
→ escape + oscilador
→ minutería
→ cuerda y puesta en hora
→ automático
→ calendario
→ integración
→ diagnóstico
```

### 9.4 Ruta 3 — MIYOTA 8215

Fortalezas:

- cobertura estructural amplia;
- identidad de piezas;
- tornillos y dependencias;
- desmontaje, inspección y montaje;
- límites R2 correctos.

Lagunas:

- grafo de conocimientos vacío;
- automático y calendario aparecen demasiado pronto;
- falta minutería e indicación específicas;
- falta una enseñanza clara de liberación segura de energía;
- no existe todavía familia 82, pese al título;
- no se cubre cronocomparador o regulación introductoria;
- es la ruta más extensa y la menos acompañada proporcionalmente.

Orden recomendado:

```text
identidad y documentación
→ arquitectura
→ energía y barrilete
→ tren y apoyos
→ escape, volante y espiral
→ minutería e indicación
→ cuerda y puesta en hora
→ automático
→ calendario
→ desmontaje
→ inspección
→ montaje
→ verificaciones
→ diagnóstico
→ dossier
```

## 10. Cobertura frente al currículo maestro y el libro

El currículo maestro define ocho rutas. El estado actual cubre parcialmente las cuatro primeras áreas conceptuales:

- Ruta 0: parcial;
- Ruta 1: parcial;
- Ruta 2: amplia en nombres, desigual en profundidad;
- Ruta 3: solo 8215, no familia 82;
- Ruta 4 de servicio y diagnóstico: no existe como ruta independiente;
- Ruta 5 serie 90: ausente;
- Ruta 6 donantes y metrología: ausente;
- Ruta 7 diseño y fabricación: ausente.

El libro privado contiene material para:

- taller y herramientas;
- acabado;
- torneado;
- ruedas y piñones;
- componentes pequeños;
- rubíes;
- escapes;
- muelles;
- diseño del movimiento;
- volante y espiral;
- caja, esfera y decoración.

Es una fuente técnica valiosa, pero no es por sí solo un currículo para principiantes. Debe alimentar claims atómicos y revisados, no convertirse en texto copiado ni sustituir la secuencia pedagógica.

Su alcance es relojería mecánica general y construcción de movimientos. No es una fuente sobre MIYOTA: ningún dato, pieza, geometría, procedimiento o afirmación específica del 2035 o del 8215 puede apoyarse en este libro. Para esos calibres la autoridad corresponde exclusivamente a la web y los PDF oficiales de MIYOTA.

Estado de claims en los 43 bloques:

- 43 claims, uno por bloque;
- 35 explicaciones originales;
- 4 oficiales;
- 3 calculados;
- 1 hipótesis.

Para calibres reales es una granularidad insuficiente. Cada dato específico importante debe enlazarse a documento, revisión y localización concreta.

## 11. Currículo completo recomendado

### Tronco común — empezar realmente desde cero

1. Qué es un reloj completo.
2. Cómo orientarse en sus vistas y ejes.
3. Cómo leer una pieza: forma, posición, apoyo, contacto y función.
4. Seguridad, energía almacenada, pilas, orden y herramientas.
5. Unidades y medidas: milímetro, micra, diámetro, altura y holgura.
6. Dato oficial, observación, medida, inferencia, estimación y desconocido.
7. Cinco funciones universales.
8. Cadena conceptual de cuarzo.
9. Cadena conceptual mecánica.
10. Comparación y primeros fallos.

### Rama de cuarzo

```text
fuente
→ referencia y control temporal
→ bobina
→ rotor paso a paso
→ tren
→ indicación
→ MIYOTA 2035
→ comprobaciones
→ diagnóstico básico
```

El puente ISA 8172 es opcional y solo aparece si el alumno declara o demuestra esa experiencia.

### Rama mecánica

```text
muelle y barrilete
→ tren
→ escape
↔ volante y espiral
→ minutería
→ indicación
→ keyless
→ automático y calendario
→ MIYOTA 8215
→ servicio virtual
→ diagnóstico
```

### Rutas posteriores

Solo después de validar lo anterior:

1. servicio y diagnóstico;
2. familia 82;
3. serie 90;
4. metrología y donantes;
5. diseño y fabricación.

## 12. Forma óptima de aprender cada concepto

Cada unidad debe aplicar un ciclo operativo:

1. recuperación breve sin ayudas;
2. activación de conocimiento previo;
3. explicación en lenguaje sencillo;
4. ejemplo trabajado;
5. microdemostración visual controlable;
6. predicción;
7. práctica guiada;
8. retirada progresiva de ayuda;
9. práctica independiente;
10. explicación causal propia;
11. feedback específico;
12. reintento equivalente sin ayuda;
13. transferencia a otro estado o calibre;
14. recuperación diferida.

La evaluación no aparece antes de la explicación y el ejemplo, salvo en un diagnóstico claramente no calificable.

### Sesión recomendada de 25 minutos

| Fase | Duración |
|---|---:|
| Repaso vencido | 3 min |
| Activación y explicación | 6 min |
| Ejemplo visual | 5 min |
| Práctica | 7 min |
| Transferencia | 3 min |
| Cierre y calendario | 1 min |

No todas las sesiones deben durar 25 minutos. El plan debe recomponerse con el presupuesto declarado por el usuario.

## 13. Modelo de conocimiento y dominio

No debe existir un único porcentaje de dominio.

Cada concepto necesita estados separados:

- declarativo: puede nombrarlo y definirlo;
- causal: explica entrada, salida y relación;
- visual/espacial: lo reconoce y localiza;
- procedimental: ejecuta el orden;
- diagnóstico/transferencia: aplica el principio a un caso nuevo;
- físico: demuestra la destreza sobre una unidad real.

Una competencia solo se considera demostrada cuando:

- la respuesta es correcta;
- no depende de una pista que revele la solución;
- la explicación o ejecución cumple su rúbrica;
- no contiene errores críticos;
- se repite en un caso distinto;
- se recupera en otra sesión cuando la retención forme parte del objetivo.

«Completado» nunca equivale por sí solo a «dominado».

## 14. Evaluación recomendada

Aplicar diseño centrado en evidencias:

```text
Afirmación
El alumno comprende cómo transmite energía el tren.

Evidencia
Identifica entrada y salida, reconoce los engranes,
predice sentidos y explica la consecuencia de una interrupción.

Tareas
Reconstrucción, predicción, fallo inyectado,
explicación y transferencia a otro movimiento.
```

Cada módulo debe contener:

- diagnóstico previo no calificable;
- comprobación formativa;
- ejecución independiente inmediata;
- transferencia;
- recuperación diferida;
- evidencia física solo cuando proceda.

Métricas principales:

- ganancia desde diagnóstico;
- acierto sin ayuda;
- dependencia de pistas;
- calidad causal;
- errores críticos;
- transferencia;
- retención;
- calibración entre confianza y resultado.

Tiempo en pantalla, clics y pantallas visitadas no prueban aprendizaje.

## 15. Papel correcto del 3D

Más 3D no implica más aprendizaje. Cada escena debe responder:

1. ¿Dónde empieza la energía?
2. ¿Qué pieza la recibe?
3. ¿Dónde existe contacto?
4. ¿Qué cambia?
5. ¿Qué pieza continúa?
6. ¿Qué ocurre si se bloquea o retira una pieza?

Estándar recomendado:

- vista canónica inicial;
- cámara bloqueada en la primera explicación;
- vistas predefinidas;
- ensamblado y explosionado alternables;
- transparencia localizada;
- esquema 2D sincronizado;
- contactos y apoyos visibles;
- pieza motriz identificada;
- flechas de entrada y salida;
- avance segmentado;
- pausa y scrub;
- velocidad reducida;
- control del alumno;
- alternativa textual equivalente.

El nivel de fidelidad depende del objetivo:

- función: modelo conceptual claro;
- reconocimiento: reconstrucción visual;
- relaciones: ensamblaje estructural;
- desmontaje y montaje: interfaces y orden suficientemente fieles;
- destreza manual: unidad física y revisión humana.

## 16. Accesibilidad

Fortalezas:

- skip link;
- landmarks;
- foco visible;
- movimiento reducido;
- alternativa textual;
- controles de reordenación;
- contraste;
- operaciones sin arrastre obligatorio.

Pendiente:

- sustituir tamaños rígidos que no escalan;
- garantizar reflow a 200 % y 400 %;
- tabs con teclado y `aria-controls`;
- mover foco al título al navegar;
- actualizar el título del documento;
- exponer las respuestas como radios cuando lo sean;
- explicar valor y extremos de confianza;
- preservar semántica real de listas;
- probar con axe, teclado y lector de pantalla;
- probar forced colors y zoom.

CAST UDL 3.0 recomienda conectar conocimiento previo, representar de varias formas, ofrecer apoyos graduados y maximizar transferencia. WCAG 2.2 exige reflow sin pérdida de información o función, con excepciones justificadas para interfaces genuinamente bidimensionales.

## 17. Arquitectura objetivo

### `StudyPlanService`

Construye la sesión actual a partir de objetivo, tiempo, lagunas, repaso, herramientas y conexión.

### `LearningStateProjector`

Separa lectura, práctica, demostración, transferencia y retención.

### `DraftAnswerController`

Separa edición, validación y envío.

### `FeedbackResolver`

Resuelve feedback por pregunta, respuesta, concepción errónea y estado visual.

### `TutorPolicyEngine`

Tutor determinista ahora; adaptador de IA futuro bajo el mismo contrato.

### `AcademyProfileRepository`

Unifica perfil, onboarding, notas, capturas, lectura, preferencias y aplazamientos.

### `ReviewScheduler`

Programa recuperación adaptativa. El esquema 1/7/21 queda como fallback, no como ley fija.

### `ProgressAggregateRepository`

Calcula progreso y dominio completos sin depender de páginas de historial.

### `ItemBank`

Genera variantes reales por pieza, estado, fallo y calibre; no cuenta archivos duplicados como experiencias distintas.

## 18. Plan de mejora por puertas de calidad

### Puerta 0 — Integridad

Bloqueante para cualquier análisis fiable:

1. envío explícito de respuestas;
2. progreso independiente de paginación;
3. ciclo completo de datos del perfil;
4. rechazos visibles;
5. pruebas con historiales grandes.

### Puerta 1 — Ruta 0 patrón oro

1. orientación visual;
2. lenguaje de piezas;
3. seguridad y herramientas;
4. medidas y procedencia;
5. mapa funcional;
6. cuarzo y mecánico conceptuales;
7. preguntas, pistas y feedback específicos;
8. transferencia y retención;
9. puente ISA opcional.

### Puerta 2 — Motor de estudio

1. único siguiente paso;
2. diagnóstico opcional;
3. sesión según tiempo;
4. estado pedagógico real;
5. scheduler consistente;
6. métricas de ayuda, transferencia y retención.

### Puerta 3 — Reescritura de especializaciones

Orden recomendado:

1. MIYOTA 2035;
2. Fundamentos mecánicos;
3. MIYOTA 8215.

Cada ruta debe pasar por revisión relojera, pedagógica, lingüística y accesible.

### Puerta 4 — Validación

1. revisión por expertos relojeros;
2. pruebas moderadas con principiantes;
3. accesibilidad;
4. pretest y postest;
5. recuperación diferida;
6. transferencia a un caso nuevo;
7. telemetría de errores y pistas.

### Puerta 5 — Formación física y expansión

Después:

- evidencias fotográficas y de medida;
- mentoría;
- servicio;
- familia 82;
- serie 90;
- metrología;
- diseño y fabricación.

## 19. Criterios de aceptación

Academia no debe presentarse como formación completa hasta que:

- un borrador no cuente como intento;
- el progreso sea estable con más de 40 registros;
- backup y borrado cubran todo el perfil;
- ninguna acción falle en silencio;
- ningún concepto evaluado carezca de enseñanza previa;
- ningún hito avanzado termine en reconocimiento simple;
- cada actividad tenga una pregunta específica;
- cada distractor tenga diagnóstico;
- una pista cercana requiera intento;
- exista reintento independiente;
- el grafo 8215 esté completo;
- las transferencias unan conceptual, 2035 y 8215;
- «completado» y «dominado» estén separados;
- el tutor no revele respuestas antes del esfuerzo;
- la ruta inicial funcione sin experiencia ISA;
- exista validación con aprendices reales;
- la destreza física permanezca separada.

## 20. Tabla de prioridades

| Decisión | Recomendación | Prioridad | Bloqueante |
|---|---|---:|---|
| Intentos y borradores | Envío explícito y atómico | P0 | Sí |
| Progreso paginado | Agregados completos | P0 | Sí |
| Datos locales | Repositorio único y ciclo completo | P0 | Sí |
| Acciones silenciosas | Estado y explicación local | P0 | Sí |
| Evidencia especializada | Escalera hasta transferencia y retención | P0 | Sí |
| Preguntas repetidas | Ítems específicos por objetivo | P0 | Sí |
| Pistas genéricas | Ayudas específicas y reintento | P0 | Sí |
| Grafo 8215 | Prerrequisitos y transferencias completos | P0 | Sí |
| Requisitos circulares | Separar requerir, introducir, practicar y evaluar | P0 | Sí |
| Rúbricas | Criterios analíticos y errores críticos | P0 | Sí |
| Ruta inicial | Convertirla en patrón oro desde cero | P1 | Sí, antes de ampliar |
| Motor de estudio | Unificar recomendaciones | P1 | No para corregir P0 |
| Diagnóstico | Entrada opcional no calificable | P1 | No |
| Tutor | Determinista antes de IA | P1 | No |
| Especializaciones | Reescritura individual | P1 | Sí, antes de publicarlas como completas |
| Retención | Adaptativa; 1/7/21 como fallback | P1 | No |
| Accesibilidad | WCAG 2.2 y pruebas asistivas | P1 | Sí, antes de distribución final |
| Nuevas rutas | Aplazar hasta validar las actuales | P2 | No |
| Destreza física | Evidencia y revisión humana | P2 | Sí para cualquier acreditación manual |

## 21. Referentes consultados

### Formación relojera

- [WOSTEP — Customer Service Watchmaker Program](https://www.wostep.ch/index.php/en/training/customer-service-watchmaker-program): práctica extensa de banco con teoría integrada durante el recorrido.
- [AWCI — Course Catalog](https://www.awci.com/educationcareers/awci-course-catalog/): secuencia de introducción, servicio, teoría, automático, cuarzo, escape y micromecánica, con mentoría y tiempo de aplicación.
- [BHI — Distance Learning Course, Technician Grade](https://bhi.co.uk/courses/dlctg): teoría y práctica, taller, herramientas, glosario, ejercicios y estándares de examen.

### Aprendizaje y evaluación

- [How People Learn II — National Academies](https://www.nationalacademies.org/read/24783/chapter/7): el conocimiento previo y las estructuras mentales condicionan la integración y recuperación.
- [CAST UDL Guidelines 3.0](https://udlguidelines.cast.org/more/downloads/): conexión con conocimiento previo, múltiples representaciones, apoyos graduados y transferencia.
- [ETS — Evidence Trace File](https://www.ets.org/research/policy_research_reports/publications/report/2018/jzfy.html): una traza de simulación debe diseñarse como evidencia de una competencia, no confundirse con un log técnico.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): reflow, foco, navegación, tamaño de objetivo y alternativas.
- [Roediger y Karpicke — práctica de recuperación](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/).
- [Cepeda et al. — espaciado](https://digitalcommons.usf.edu/psy_facpub/1766/).
- [Van Gog et al. — ejemplos resueltos](https://doi.org/10.1016/j.cedpsych.2010.10.004).
- [Chi et al. — autoexplicación](https://doi.org/10.1207/s15516709cog1302_1).
- [VanLehn — tutoría paso a paso](https://doi.org/10.1080/00461520.2011.611369).

## 22. Decisión final recomendada

La mejor inversión no es producir más contenido ni añadir IA ahora.

La secuencia recomendada es:

```text
integridad de datos y evaluación
→ Ruta 0 patrón oro
→ motor de estudio único
→ MIYOTA 2035
→ Fundamentos mecánicos
→ MIYOTA 8215
→ validación con alumnos
→ práctica física y nuevas rutas
```

Academia ya tiene un buen laboratorio y una arquitectura prometedora. Para convertirse en una gran herramienta de aprendizaje necesita que cada explicación, pregunta, pista, acción, evidencia y recomendación forme una sola cadena causal, igual que el reloj que pretende enseñar.
