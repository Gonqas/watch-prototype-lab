# Academia P2 — personalización, tutor contextual, retención y transferencia

Estado: implementado y verificado  
Versión de aplicación: 0.11.0  
Base: P0 — orden y evaluación honesta — y P1 — teoría profunda y práctica deliberada  
Alcance: 12 rutas, 87 lecciones, 154 actividades, 104 conceptos y 14 errores conceptuales declarados

## Resultado

P2 convierte la Academia en un sistema que responde al historial real del perfil sin sustituir el currículo ni fingir inteligencia, eficacia o autoridad que no tiene. Las recomendaciones se calculan a partir de sesiones, evidencia, evaluaciones, dominio, errores activos, fechas de repaso y transferencia. La persona conserva acceso a todo el contenido, pero el siguiente paso recomendado cambia cuando aparece una necesidad más importante.

La configuración completa queda unificada así:

1. P0 decide qué conocimiento debe existir antes de practicar y qué evidencia puede acreditar progreso.
2. P1 garantiza que antes del laboratorio exista teoría, ejemplo resuelto y retirada gradual de ayuda.
3. P2 prioriza recuperación de sesiones, errores conceptuales, repasos vencidos, práctica pendiente, transferencia y progresión curricular, en ese orden.
4. El tutor solo usa contenido, fuentes, límites y estado visible declarados.
5. La retención requiere tres recuperaciones independientes en ventanas 1/7/21; una repetición inmediata o con pistas no consolida.
6. La transferencia requiere una demostración anterior y genera evidencia separada en otro contexto.
7. La analítica se presenta por concepto y conserva por separado intentos, errores, ayudas, demostración, transferencia y retención.

No existe una nota global. Completar pantallas no equivale a competencia. Ningún resultado digital acredita por sí solo destreza manual, ajuste físico, fabricación, seguridad de taller ni validación de ingeniería.

## 1. Modelo longitudinal del aprendiz

`buildAcademyLearnerModel` construye una proyección reproducible a partir de registros persistidos. No modifica los registros fuente. Para cada uno de los 104 conceptos calcula:

- estado: no iniciado, introducido, en práctica, demostrado o consolidado;
- confianza actual derivada de dominio, no de tiempo de pantalla;
- evidencia activa y fecha del resultado más reciente;
- intentos terminados;
- respuestas incorrectas;
- pistas utilizadas;
- evaluaciones superadas y fallidas;
- transferencias verificadas;
- etapa y fecha del próximo repaso;
- tendencia reciente: datos insuficientes, mejora, estabilidad o descenso;
- errores conceptuales que siguen activos;
- recomendación concreta para el siguiente trabajo.

La proyección ignora evidencia invalidada o sustituida. Un error conceptual permanece activo si existe un resultado incorrecto posterior a la última corrección; desaparece cuando una evidencia correcta más reciente repara el mismo contexto. No se borra el intento fallido: deja de bloquear la recomendación, pero sigue en el historial.

El resumen longitudinal muestra días con sesiones terminadas, tasa de comprobaciones superadas, resultados sin pistas, transferencias, competencias consolidadas, repasos vencidos, errores activos y tendencia. Son señales para decidir qué estudiar, no una calificación académica.

## 2. Secuenciador adaptativo

`academyStudyPlan` aplica una prioridad estable y explicable:

| Prioridad | Situación | Recomendación |
|---:|---|---|
| 100 | sesión interrumpida o suspendida | recuperar el último punto seguro |
| 95 | error conceptual sin corregir | volver a la explicación de refuerzo y repetir una variante |
| 90 | repaso cuya fecha ya ha llegado | recuperar sin releer la solución |
| 85 | ruta bloqueada por una dependencia | completar primero la ruta necesaria |
| 80 | competencia introducida o en práctica | consolidar con menos ayuda |
| 75 | competencia demostrada sin transferencia | aplicar el criterio en otro contexto |
| 70 | recorrido normal | continuar por la siguiente lección o práctica canónica |

Las recomendaciones incluyen base, regla, prioridad, IDs de evidencia y destino. El perfil de orientación puede adaptar el punto de partida, pero nunca sustituye evidencia ni salta prerrequisitos. El refuerzo abre la lección correspondiente con `mode=remediation`; la transferencia y la retención usan igualmente modos explícitos que se conservan en la sesión.

## 3. Tutor contextual acotado

La guía contextual deja de ser un panel de texto inerte. En cada práctica ofrece seis acciones:

- explicar la pieza o elemento seleccionado;
- comparar con otro caso sin transferir dimensiones;
- formular una pregunta socrática;
- entregar una pista gradual después del primer intento;
- pedir una comprobación contra los criterios de éxito;
- identificar el dato, fuente o autoridad que falta.

La respuesta es determinista. Usa exclusivamente:

- contratos de tutor y feedback de la actividad;
- selección y estado visibles;
- intentos, errores, revisión pendiente y pistas registradas;
- fuentes declaradas;
- limitaciones G/K/P y desconocidos;
- ejemplo y criterios de práctica deliberada.

Cada respuesta muestra chips que distinguen fuente oficial, contenido documentado, simulación educativa y dato desconocido. También muestra IDs de fuente y su límite. Si una acción no está autorizada por el contrato, se rechaza en vez de ampliar silenciosamente el alcance.

La guía no califica ni completa la evidencia. Solicitar una pista real genera el evento persistido de ayuda y reduce la independencia de ese intento. En retención la acción de pista y el control inferior quedan desactivados.

Esta arquitectura deja preparado un tutor conversacional futuro sin acoplar la Academia a una IA ni permitir que una respuesta generada se convierta en dato técnico. Un proveedor futuro deberá consumir el mismo contexto acotado, devolver la misma estructura, citar fuentes y pasar una capa de política antes de mostrarse.

## 4. Retención 1/7/21

Una demostración inicial programa tres recuperaciones:

1. etapa 1: un día después de la demostración;
2. etapa 2: siete días después de superar la primera recuperación;
3. etapa 3: veintiún días después de superar la segunda.

El preflight de `mode=retention` exige:

- competencia previamente demostrada;
- etapa de repaso pendiente;
- fecha programada ya alcanzada.

La evaluación exige además:

- satisfacer la rúbrica original;
- al menos una evidencia válida de la sesión actual;
- no haber utilizado pistas en esa sesión;
- evidencia independiente de una sesión posterior;
- intervalo temporal positivo correspondiente a la etapa.

El motor de dominio no eleva a `retained` por recibir una sola evaluación con objetivo de retención. Cuenta tres reglas de etapa distintas y solo entonces consolida. Esto corrige el fallo anterior en el que el primer repaso podía cerrar todo el ciclo.

Si el repaso se retrasa, el logro no se borra. La confianza actual recibe una penalización temporal acotada y la interfaz explica los días de retraso. Al completar la tercera recuperación desaparece la próxima fecha. El calendario 1/7/21 es una política inicial explícita, no una afirmación de que sea óptimo para todas las personas o materias.

## 5. Transferencia medida

`mode=transfer` solo se abre si ya existe una demostración o consolidación de la competencia. La evaluación requiere evidencia correcta de la sesión nueva y ausencia de pistas. El ID de regla termina en `.transfer`, lo que permite al proyector conservar por separado:

- primera y última demostración;
- primera y última transferencia;
- IDs de evidencia de transferencia;
- evidencia utilizada para retención.

El secuenciador busca actividades con nivel de evidencia `transfer`, después comprobaciones de dominio y finalmente actividades que contengan una fase de transferencia. La interfaz recuerda que transferir una relación funcional no autoriza a copiar geometría, medidas, tolerancias, materiales o comportamiento entre calibres.

## 6. Persistencia y compatibilidad

La sesión persistente incorpora `learningMode` con cuatro valores: `authored`, `remediation`, `transfer` y `retention`. El campo es opcional en el esquema de lectura para mantener compatibilidad con bases de datos, copias e importaciones anteriores. Las sesiones nuevas guardan `authored` de forma explícita; recuperación y reinicio conservan el modo original.

No se modifica `WatchProject`, el esquema del proyecto técnico ni `.wplab`. Los nuevos operadores de evaluación solo afectan al dominio educativo:

- `evidence-from-session`: impide aprobar un intento nuevo usando exclusivamente historial antiguo;
- `session-without-hints`: impide acreditar retención o transferencia asistida.

Las evaluaciones y proyecciones siguen siendo reconstruibles desde evidencia inmutable. No se migra ni elimina ningún intento previo. La versión 0.11.0 puede leer sesiones antiguas sin `learningMode` y las interpreta como `authored`.

## 7. Experiencia visible

La ficha de actividad muestra una banda distinta para refuerzo, transferencia y repaso. Explica qué se espera y qué puede contar como evidencia antes de abrir el laboratorio. El preflight traduce las nuevas puertas como “Fecha del repaso” y “Demostración previa”.

El espacio de práctica conserva el modo en cabecera y recuperación. La guía contextual presenta acciones reales, respuesta, siguiente pregunta, fuentes y límites. Los repasos muestran “Repaso sin pistas” y desactivan toda solicitud de ayuda que invalidaría la independencia.

En `Progreso > Mi evolución` aparecen:

- resumen longitudinal;
- errores conceptuales activos con enlace de refuerzo;
- conceptos trabajados ordenados por necesidad;
- intentos, errores, pistas y transferencias por concepto;
- confianza, tendencia y próximo repaso;
- recomendación concreta.

La vista evita tablas técnicas internas y usa lenguaje de estudio. Las etiquetas de procedencia y fidelidad se mantienen donde son necesarias para no confundir una explicación con una afirmación oficial.

## 8. Auditoría y pruebas

`npm run learning:academy-p2-audit` comprueba:

- 104 conceptos y existencia de sus prerrequisitos;
- 14 errores conceptuales y existencia de la lección de refuerzo;
- 154 actividades y siete controles P2 en cada una —1078 en total—;
- seis permisos de tutor, fuentes y prohibiciones;
- feedback causal y referencias válidas de errores;
- transferencia deliberada;
- nivel de evidencia y límite físico;
- nueve garantías de runtime para sesión actual, ausencia de pistas, 1/7/21, fecha, transferencia, persistencia, modelo longitudinal, secuenciador y tutor.

Las pruebas automatizadas añadidas cubren:

- activación y reparación de errores conceptuales;
- prioridad del refuerzo;
- recomendación de transferencia después de demostrar;
- resumen longitudinal y evidencia independiente;
- seis acciones de tutor y pista retenida antes del primer intento;
- bloqueo de repaso sin demostración o antes de fecha;
- evidencia obligatoria de la sesión actual;
- rechazo de sesiones con pistas;
- permanencia en `demonstrated` tras los dos primeros repasos;
- elevación a `retained` solo tras el tercero;
- reconstrucción determinista del dominio.

Los resultados reproducibles se guardan en:

- `docs/generated/APRENDER-ACADEMIA-P2-AUDITORIA.md`;
- `docs/generated/APRENDER-ACADEMIA-P2-AUDITORIA.json`.

## 9. Archivos principales

- `src/learning/academy/academyPersonalization.ts`: modelo longitudinal y errores activos;
- `src/learning/academy/academyStudyPlan.ts`: secuenciador adaptativo;
- `src/learning/academy/academyPedagogy.ts`: tutor contextual determinista;
- `src/learning/application/service.ts`: modos, puertas y reglas de evaluación;
- `src/learning/persistence/assessmentEngine.ts`: evidencia actual e independencia;
- `src/learning/persistence/masteryEngine.ts`: etapas 1/7/21 y proyección longitudinal;
- `src/learning/persistence/models.ts` y `sessionService.ts`: persistencia compatible del modo;
- `src/learning/ui/AcademySurfaces.tsx`: evolución y refuerzo;
- `src/learning/ui/LearningSurfaces.tsx`: ficha adaptativa;
- `src/learning/ui/LearningActivityWorkspace.tsx`: tutor y repaso sin pistas;
- `scripts/audit-academy-p2.mjs`: auditoría reproducible.

## 10. Límites y validación pendiente

P2 deja el producto preparado para estudiar de forma personal y trazable, pero no permite afirmar todavía que el método sea eficaz para una población real. Siguen necesitando observación externa:

- revisión relojera de exactitud y secuencia;
- pruebas de comprensión con principiantes;
- equivalencia real con lector de pantalla, teclado y movimiento reducido;
- transferencia entre calibres no vistos durante la enseñanza;
- retención observada después de 1, 7 y 21 días;
- calibración de la política de repaso con el uso personal;
- competencia física revisada por una persona cualificada.

La Academia registrará esos resultados cuando se produzcan; no los anticipa ni los fabrica.
