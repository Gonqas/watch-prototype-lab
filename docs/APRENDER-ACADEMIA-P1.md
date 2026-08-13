# Academia P1 — teoría profunda, ejemplos resueltos y práctica deliberada

Estado: implementado y verificado  
Versión de aplicación: 0.10.0  
Alcance: las 12 rutas visibles, 87 lecciones y 154 actividades de Watchmaking Academy  
Fuera de alcance: personalización, tutor contextual, analítica longitudinal y programación de retención P2

## Resultado

P1 convierte el recorrido ordenado en P0 en un sistema de estudio antes de la práctica. Ya no basta con que una actividad tenga una introducción breve y un modelo visual: cada lección visible declara la lectura requerida, el ejemplo resuelto, los criterios de preparación y la práctica posterior. Cada actividad declara cómo se retira la ayuda y cómo se repite de manera independiente.

La cobertura declarativa es completa, pero no se presenta como prueba de eficacia pedagógica ni como validación relojera. La exactitud técnica sigue dependiendo de la procedencia declarada, la revisión experta y los límites G/K/P; la transferencia y la retención reales requieren evidencia de uso y pertenecen a P2.

## 1. Qué se ha cambiado

### 1.1 Teoría antes de responder

Las 87 lecciones del estudiante tienen un `authoring.studyContract` ejecutable:

- secuencia `theory-first`;
- al menos 600 palabras reales de teoría por lección;
- estimación mínima de 20 minutos para leer, resolver el ejemplo y tomar notas;
- roles editoriales obligatorios, incluidos orientación, explicación y ejemplo resuelto;
- práctica bloqueada hasta registrar la lectura requerida;
- criterios explícitos de preparación;
- revisión de fuentes y anotación antes del laboratorio.

El recuento se calcula a partir del Markdown real. El validador rechaza una lección que declare más palabras de las que contiene y rechaza cualquier lección visible sin contrato de estudio.

### 1.2 Profundización técnica específica

Se han reescrito o ampliado en profundidad 31 bloques que concentraban la deuda más importante:

- 6 unidades de fundamentos mecánicos: barrilete, pareja de engranes, apoyos, escape y oscilador, minutería y proyecto de síntesis;
- 10 unidades de cuarzo y MIYOTA 2035;
- 15 unidades de MIYOTA 8215.

Cada ampliación separa pregunta de estudio, modelo causal, ejemplo resuelto, errores frecuentes, práctica, transferencia, fuentes y límites. El texto no usa el libro mecánico privado como autoridad MIYOTA: el libro se mantiene como fuente adicional para teoría mecánica general y los datos de 2035/8215 conservan sus fuentes oficiales o su clasificación como reconstrucción educativa.

### 1.3 Preguntas específicas

Se han sustituido 86 comprobaciones genéricas de las tres especializaciones históricas por situaciones ligadas a su tema real. Cada una incluye:

- una pregunta concreta;
- una respuesta correcta;
- dos errores plausibles;
- explicación causal de la solución;
- observación que permite comprobarla;
- pregunta de transferencia a un caso diferente;
- respuesta estructurada además del reconocimiento cuando procede.

Las preguntas genéricas prohibidas se detectan en validación para impedir que vuelvan a entrar al regenerar contenido.

### 1.4 Práctica deliberada

Las 154 actividades visibles incluyen un `authoring.deliberatePractice` tipado. El contrato contiene:

1. foco de la práctica;
2. ejemplo resuelto con situación, pasos y conclusión;
3. primer intento guiado;
4. segundo intento con menos ayuda;
5. intento independiente;
6. transferencia a un caso nuevo;
7. criterios de éxito y señales de error;
8. restauración y reintento independiente después de solicitar una pista.

La pantalla de preparación muestra esta secuencia con lenguaje para el estudiante y permite desplegar el ejemplo resuelto y los criterios de éxito. El contrato genérico anterior solo se conserva como compatibilidad para contenido que no pertenece a las rutas reales P1.

## 2. Cobertura medida

La auditoría se ejecuta con `npm run learning:academy-p1-audit`. Excluye la ruta interna de QA y exige diez controles por actividad.

| Paquete | Lecciones | Actividades | Mínimo de palabras por lección | Media por lección | Resultado |
|---|---:|---:|---:|---:|---:|
| Arquitecturas, atlas y servicio | 15 | 15 | 624 | 648 | 15/15 |
| Orientación funcional | 6 | 10 | 637 | 675 | 10/10 |
| Inspección y metrología | 14 | 28 | 678 | 684 | 28/28 |
| Fabricación, diseño y validación | 15 | 15 | 693 | 831 | 15/15 |
| Fundamentos mecánicos | 12 | 29 | 778 | 1003 | 29/29 |
| MIYOTA 8215 | 15 | 37 | 637 | 681 | 37/37 |
| Cuarzo y MIYOTA 2035 | 10 | 20 | 696 | 741 | 20/20 |
| **Total** | **87** | **154** | **624** | — | **154/154** |

Los diez controles son: profundidad teórica, puerta theory-first, ejemplo resuelto, contrato deliberado, retirada gradual de ayuda, pregunta específica, respuesta activa, fuente y límite, feedback causal, y accesibilidad con restauración. El resultado actual es 1540/1540.

El detalle por actividad se conserva en:

- `docs/generated/APRENDER-ACADEMIA-P1-AUDITORIA.md`;
- `docs/generated/APRENDER-ACADEMIA-P1-AUDITORIA.json`.

## 3. Contratos y validación

`DeliberatePracticeContractSchema` forma parte del esquema canónico de autoría. El validador requiere como mínimo las fases guiada e independiente; la política P1, más estricta, requiere guiada, ayuda reducida, independiente y transferencia en las 154 actividades.

La validación editorial de contenido real también exige:

- `studyContract` en todas las lecciones visibles;
- 600 palabras reales como mínimo;
- `deliberatePractice` en todas las actividades visibles;
- coherencia entre palabras declaradas y publicadas;
- ausencia de las antiguas preguntas plantilla.

El script `scripts/upgrade-academy-p1.mjs` es idempotente: recompone las ampliaciones P1 a partir del contenido base, recalcula palabras y tiempo de estudio, y falla si cambia accidentalmente el alcance esperado de 31 bloques, 87 lecciones, 154 actividades o 86 comprobaciones específicas.

## 4. Experiencia de estudio

El flujo recomendado queda así:

1. leer la teoría y reconocer vocabulario e interfaces;
2. seguir el ejemplo resuelto sin tratarlo como una receta universal;
3. explicar la cadena causal con palabras propias;
4. registrar la lectura y abrir la práctica;
5. resolver con guía;
6. repetir con menos ayuda;
7. restaurar y resolver de forma independiente;
8. transferir el criterio a otra configuración;
9. conservar la evidencia sin confundir práctica con demostración.

Este flujo aprovecha los modelos visuales como objeto de observación y comprobación. No utiliza una animación como sustituto de la teoría ni convierte una simulación educativa en autoridad de ingeniería.

## 5. Versionado y compatibilidad

El nuevo campo declarativo requiere aplicación 0.10.0. Publicarlo sobre las versiones anteriores habría permitido que una instalación antigua rechazase el paquete o ignorase su nuevo contrato. Las versiones integradas son:

| Paquete | Versión P1 |
|---|---:|
| Orientación, cuarzo/2035, fundamentos mecánicos y 8215 | 0.5.0 |
| Inspección y metrología | 0.2.0 |
| Arquitecturas/servicio y fabricación/diseño/validación | 1.1.0 |

Todos declaran `minimumAppVersion: 0.10.0`. Sus fuentes, paquetes compilados y archivos ZIP se han regenerado. Las dependencias internas también se han migrado a `^0.5.0`, `^0.2.0` o `^1.1.0`: en SemVer, `^0.4.0` no acepta 0.5.0, por lo que conservar el rango anterior habría roto la instalación integrada.

## 6. Archivos principales

- `src/learning/content/authoring.ts`: esquema del contrato deliberado;
- `src/learning/content/authoringValidation.ts`: puertas editoriales P1;
- `src/learning/product/demoPackage.ts`: proyección del contrato al producto;
- `src/learning/academy/lessonSegmentation.ts`: roles de teoría, ejemplo y práctica;
- `src/learning/ui/LearningSurfaces.tsx` y `src/learning/ui/learning.css`: presentación al estudiante;
- `scripts/upgrade-academy-p1.mjs`: migración reproducible de contenido;
- `scripts/audit-academy-p1.mjs`: auditoría completa por actividad;
- `learning-content/*`: fuentes y distribuciones de los siete paquetes;
- `src/learning/product/academyGoldContent.test.ts`: prueba transversal de cobertura.

## 7. Qué queda expresamente para P2

P1 no personaliza la secuencia según errores individuales, no conversa mediante un tutor, no programa repasos espaciados y no afirma retención. P2 deberá utilizar la evidencia ya estructurada para abordar:

- diagnóstico y adaptación por concepto o error;
- tutor contextual acotado por fuente y fidelidad;
- agenda de recuperación y retención diferida;
- analítica longitudinal comprensible para el estudiante;
- transferencia medida entre modelos y calibres;
- validación con principiantes, accesibilidad y revisión relojera.

Estas limitaciones son intencionadas: P1 deja una base completa y medible, pero no atribuye al software resultados que todavía no han sido observados.
