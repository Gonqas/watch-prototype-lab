# Academia — fuentes curadas, teoría profunda y laboratorios fundamentales

Estado: implementado y verificado en la línea 0.8.0.  
Fecha: 2026-08-02.  
Alcance: primeras dos líneas de trabajo derivadas de la auditoría de recursos de Horology Student: registro curado de fuentes y núcleo teórico-práctico de fundamentos mecánicos.  
No implica: copiar cursos ajenos, convertir una animación en autoridad técnica, certificar destreza manual o presentar un modelo conceptual como ingeniería validada.

## 1. Resultado

La Academia incorpora dos capacidades conectadas:

1. un **registro curado de 24 recursos externos**, consultable por nivel de autoridad, clase, tema, uso pedagógico, disponibilidad y limitaciones;
2. un recorrido **teoría primero** para seis fundamentos mecánicos: energía, tren de rodaje, escape, oscilador, puesta en hora y carga automática.

La nueva secuencia no conduce al alumno directamente desde una introducción breve a una pregunta o animación. Para cada fundamento exige:

```text
teoría extensa y vocabulario
→ ejemplo razonado
→ límites y errores frecuentes
→ comprobación de preparación
→ laboratorio causal manipulable
→ explicación y evidencia
```

El 3D conserva su función correcta: hacer observable una relación que ya ha sido estudiada, permitir formular y comprobar una predicción y mostrar consecuencias. No sustituye al texto técnico, ni el movimiento visible demuestra por sí mismo una ley física.

## 2. Política de fuentes

### 2.1 Jerarquía A–E

| Nivel | Autoridad | Uso permitido | Uso no permitido |
|---|---|---|---|
| A | documentación primaria oficial | identidad, especificaciones, interfaces y datos nominales dentro de su revisión | extrapolar a otra variante o completar datos ausentes |
| B | formación técnica estructurada | teoría, terminología, procedimientos y contraste didáctico | sustituir una especificación del fabricante o certificar el estado de una unidad física |
| C | práctica experta y documentación de taller | observaciones, procedimientos, fotografías y patrones de fallo | convertir una observación en dimensión oficial o regla universal |
| D | explicación educativa secundaria | intuición, visualización y explicación complementaria | sostener por sí sola una afirmación crítica de diseño, fabricación o servicio |
| E | comunidad y descubrimiento | localizar vocabulario, obras, proveedores o nuevas pistas | respaldar afirmaciones técnicas sin verificación posterior |

La autoridad de una afirmación nunca puede superar la de su fuente. Una imagen o animación secundaria puede inspirar la puesta en escena, pero las relaciones técnicas se contrastan con documentación de mayor autoridad.

### 2.2 Contrato por recurso

Cada entrada registra:

- ID estable, autor o entidad, URL y fecha de consulta;
- autoridad y nivel A–E;
- clase del recurso, idiomas, temas y posibles usos pedagógicos;
- estado de disponibilidad;
- política de validación y afirmación que puede respaldar;
- limitaciones conocidas;
- régimen de uso y disponibilidad sin conexión;
- hash obligatorio si en el futuro se almacena una copia local.

La red no es una dependencia del runtime. Los enlaces pueden consultarse desde Fuentes, pero las lecciones y los laboratorios incluidos funcionan con el contenido instalado. `offlineReady: true` no se admite para una copia externa sin hash.

## 3. Auditoría del índice de Horology Student

Fuente de descubrimiento: <https://horology-student.org/resources/>. El registro conserva las 24 entradas visibles de la página auditada —incluidas sus agrupaciones de libros y comercios— y no confunde la selección del índice con la autoridad de los destinos.

| Recurso | Nivel / clase | Valor recomendado | Cautela registrada |
|---|---|---|---|
| Horology Student · Books | E · descubrimiento | descubrir bibliografía | verificar cada obra original |
| Horology Student · Shops | E · descubrimiento | localizar proveedores | no es fuente técnica ni recomendación comercial |
| WatchBase | D · base de datos | identidad y variantes | acceso automatizado limitado; contraste primario |
| Ranfft movement archive | D · base de datos | identificación histórica | disponibilidad inestable; contrastar |
| Caliber Corner | D · referencia secundaria | orientación rápida por calibre | agregador; no sustituye ficha oficial |
| Pocket Watch Database | D · base de datos | relojería de bolsillo histórica | cobertura y campos variables |
| Bartosz Ciechanowski · Mechanical Watch | D · explicación educativa | causalidad del movimiento mecánico | modelo didáctico, no calibre fabricable |
| Animagraffs · Mechanical Watch | D · explicación visual | visión espacial y secuencia | visualización secundaria, validar relaciones |
| TimeZone Watch School · Illustrated Glossary | B · formación técnica | nomenclatura y organización por subsistemas | contenido web histórico |
| TimeZone · Horologium | C · referencia técnica | formación histórica estructurada | acceso actual limitado |
| Hodinkee · Watch 101 | D · explicación secundaria | introducciones y contexto | divulgación, no especificación |
| ETA Swisslab 6497 | A · oficial primaria | referencia histórica oficial del 6497 | aplicación Flash obsoleta; no dependencia del curso |
| Horlogerie Suisse | B · formación técnica | descubrimiento de material francófono | navegación y disponibilidad variables |
| Learn Watchmaking | D · curso comercial | material de aprendizaje y taller | contrastar procedimientos críticos |
| Jomashop · History of Watchmaking | E · contexto histórico | contexto histórico | contenido comercial y dependiente de JavaScript |
| The Naked Watchmaker | C · práctica experta | deconstrucciones y fotografía | una unidad observada no define toda la referencia |
| The Watch Guy | C · práctica experta | reparaciones, manuales e imágenes | distinguir observación, medida y dato oficial |
| 17jewels | C · práctica experta | archivo fotográfico de movimientos | identificación editorial, contrastar variantes |
| Ashton Tracy | C · práctica experta | artículos y práctica relojera | disponibilidad actual limitada |
| Dean DK | D · explicación audiovisual | demostraciones complementarias | el vídeo no sustituye lectura ni fuente primaria |
| Nathan Bobinchak | C · observación experta | micromecánica, engranes y escape | verificar alcance de cada documento |
| Worn & Wound · Caliber Spec | D · referencia secundaria | búsqueda y contexto de calibres | contrastar fichas oficiales |
| The Watch Guy · Manuals | D · base de datos | localizar documentación histórica | comprobar origen y revisión de cada documento |
| Watch Movements.eu | C · base de referencia | identificación visual y comparación | cobertura y precisión variables |

Los recursos inaccesibles, obsoletos o parcialmente accesibles permanecen en el registro porque su estado es información útil. No se presenta una respuesta HTTP fallida ni una aplicación Flash como material disponible para el alumno.

## 4. Contrato «teoría primero»

`LessonStudyContract` es un contrato editorial y de runtime opcional. Cuando existe, declara:

- secuencia `theory-first`;
- minutos mínimos de teoría y volumen mínimo de lectura;
- roles de bloque que deben completarse;
- actividades que permanecerán bloqueadas hasta completar la lectura;
- criterios observables de preparación;
- obligatoriedad de mostrar las fuentes;
- indicación para tomar notas.

### 4.1 Comportamiento de la interfaz

En una lección con contrato:

- la Academia abre en modo lectura;
- los modos centrados en el modelo permanecen desactivados durante el estudio obligatorio;
- se muestra el alcance: tiempo previsto, palabras, fuentes, criterios y avance;
- cada sección obligatoria se marca explícitamente al terminarla;
- la práctica aparece solo cuando se han completado las secciones requeridas;
- la entrada al laboratorio recuerda el estado de la teoría y ofrece retorno directo si falta preparación.

El bloqueo no se basa en tiempo pasivo. Se apoya en segmentos terminados y queda ligado al estado local de aprendizaje. La regla evita que una práctica normal pida por primera vez aquello que pretende evaluar. Los diagnósticos no calificativos continúan siendo una excepción declarable por la arquitectura pedagógica.

## 5. Núcleo de teoría mecánica

Se añadieron seis bloques extensos y originales en español. Cada uno contiene propósito, desarrollo conceptual, relaciones o ecuaciones cuando corresponden, vocabulario, ejemplo resuelto, errores frecuentes, límites de fidelidad, criterios de preparación y referencias.

| Unidad | Teoría mínima | Conocimientos previos a la práctica | Laboratorio causal |
|---|---:|---|---|
| Energía | 28 min | energía potencial, par, velocidad, potencia, barrilete y regulación de la entrega | interrumpir la cadena energética |
| Tren de rodaje | 34 min | conductor/conducida, rueda-piñón solidarios, relación por etapas, sentido y distancia entre centros | construir y razonar el tren |
| Escape | 36 min | bloqueo, desbloqueo, impulso, caída, reposo y dependencia del oscilador | ordenar las fases del escape |
| Oscilador | 32 min | inercia, rigidez, frecuencia, amplitud y conservación/aporte de energía | configurar el oscilador conceptual |
| Puesta en hora | 30 min | estados de corona, tija, piñón deslizante, minutería y aislamiento funcional | trazar los estados del mecanismo |
| Carga automática | 32 min | rotor, inversión, reducción, rueda libre y entrega al barrilete | comparar rutas de carga |

### 5.1 Densidad con estructura

«Más teoría» no significa un muro de texto indiferenciado. La densidad se reparte en unidades semánticas con un propósito claro:

- **principio**: qué relación debe entenderse;
- **modelo mental**: qué entra, qué transforma el subsistema y qué sale;
- **formalización**: vocabulario, proporciones y ecuaciones;
- **caso razonado**: aplicación paso a paso;
- **frontera**: qué no demuestra la representación;
- **comprobación**: qué debe poder explicar o predecir el alumno antes de manipular.

La aplicación mantiene modos accesibles y lectura progresiva; no reduce la exigencia conceptual para hacer la pantalla más rápida.

## 6. Seis laboratorios causales

Los laboratorios se declaran en un contrato común y consultable. Cada uno especifica:

- lección, actividad y bloque teórico asociado;
- fuentes mínimas;
- entrada, tres o más etapas causales y salida;
- variables manipulables;
- punto de interrupción y efecto esperado;
- criterios de preparación;
- fidelidad y disponibilidad local.

La interfaz del laboratorio presenta el mapa causal antes de la manipulación. Esto responde a cuatro preguntas que una animación aislada no puede contestar: **qué inicia el cambio, por dónde se transmite, qué elemento lo dosifica y qué deja de ocurrir al interrumpir una relación**.

Todos estos laboratorios se declaran inicialmente como `G1/K2/P0`:

- `G1`: forma pedagógica normalizada;
- `K2`: movimiento coordinado suficiente para estudiar causalidad y sentido;
- `P0`: sin validación física.

Por tanto, no afirman tolerancias, rendimiento, fricción, lubricación, desgaste, choque ni marcha cronométrica. Subir la fidelidad exige nueva evidencia y validación; no basta con mejorar la apariencia.

## 7. Integración y compatibilidad

- El paquete `wplab.horology.mechanical-foundations` pasa a `0.4.1`.
- Los contratos nuevos son aditivos y opcionales para paquetes anteriores.
- La dependencia semántica `^0.4.0` admite esta revisión compatible.
- Las sesiones existentes conservan la versión instalada a la que estaban vinculadas; la actualización no reescribe evidencia histórica.
- Las fuentes externas se incluyen como metadatos enlazados. No se descargan masivamente ni se convierten en dependencia de ejecución.
- El paquete permanece `in-review`: el contenido funciona y compila, pero no se declara publicación definitiva sin revisión editorial/técnica de sus recursos visuales.

## 8. Archivos principales

| Responsabilidad | Ubicación |
|---|---|
| contrato de fuente y reglas de procedencia | `src/learning/sources.ts` |
| registro maestro curado | `learning-content/source-registry/horology-student-resources.v1.json` |
| consulta y resumen del registro | `src/learning/sourceRegistry.ts` |
| contrato de estudio por lección | `src/learning/content/authoring.ts` |
| validación cruzada del contrato | `src/learning/content/learningPack.ts` |
| contratos de los seis laboratorios | `src/learning/mechanical/fundamentalLabs.ts` |
| integración de lectura, bloqueo y Fuentes | `src/learning/ui/AcademySurfaces.tsx` |
| mapa causal dentro del laboratorio | `src/learning/ui/LearningActivityWorkspace.tsx` |
| generador reproducible del contenido | `scripts/upgrade-mechanical-theory-labs.mjs` |
| teoría y lecciones resultantes | `learning-content/mechanical-foundations/` |

## 9. Verificación

La cobertura añadida comprueba:

- que existen exactamente 24 entradas estables y que cada una tiene política de validación;
- que una fuente A solo puede declararse oficial primaria;
- que una copia externa sin conexión exige hash;
- que búsqueda y filtros operan por tema, uso, nivel y clase;
- que existen seis laboratorios, todos con teoría previa suficiente y fidelidad honesta;
- que cada actividad de laboratorio se enlaza con una lección y un bloque teórico reales;
- que el paquete mecánico contiene seis contratos de estudio y 24 fuentes externas;
- que el paquete valida, compila y conserva compatibilidad semántica.

Comandos de control:

```text
npm run learning:theory-labs-upgrade
npm run learning:lint -- learning-content/mechanical-foundations
npm run learning:pack -- learning-content/mechanical-foundations
npm run build
npm run verify
```

## 10. Deuda explícita y siguientes límites

Esta fase no convierte todo enlace del índice en contenido de curso. La incorporación responsable de una fuente requiere aún seleccionar una afirmación concreta, contrastarla, redactar contenido original, asignarla a un concepto y revisar la progresión.

Queda fuera de este alcance:

- copiar de forma masiva páginas, vídeos, cursos o ilustraciones;
- afirmar que todos los enlaces auditados son correctos o están disponibles;
- completar la formación de materiales, fabricación, diseño de calibres, cálculo avanzado, metrología o servicio físico;
- validar geométricamente los modelos conceptuales contra un calibre real;
- certificar competencia manual a partir de una simulación.

El siguiente crecimiento curricular debe conservar la misma unidad mínima: **teoría contrastada → criterio de preparación → laboratorio o práctica → evidencia → recuperación y transferencia**.
