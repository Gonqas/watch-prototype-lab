# Academia 0.7 — recorrido guiado, conocimiento causal y práctica explicable

Estado: implementado y sujeto a la verificación integral de la versión 0.7.0.  
Ámbito: las cuatro rutas reales de Academia y sus 96 prácticas.  
No objetivo: redactar nuevas lecciones, sustituir el blueprint editorial o presentar la simulación como formación manual.

## 1. Resultado

Academia deja de tratar las lecciones como una colección de fichas y adopta un recorrido de aprendizaje explícito:

1. preparar la base;
2. observar;
3. comprender la relación causal;
4. practicar con apoyo;
5. demostrar de forma independiente;
6. transferir a otro contexto;
7. recuperar el conocimiento después de 1, 7 y 21 días.

El recorrido inicial `route.horology.orientation` es el patrón de referencia. Contiene diez hitos obligatorios, cada uno vinculado a una lección, una práctica, un nivel de evidencia y un resultado observable. Las rutas 2035, mecánica y 8215 conservan su especialización, pero usan el mismo contrato.

## 2. Decisiones pedagógicas materializadas

### 2.1 Aprender antes de responder

La navegación guiada abre primero el bloque editorial de la lección. La práctica solo pasa a ser el siguiente paso después de haber entrado en la lección o de haber iniciado expresamente la actividad desde el modo de exploración.

La actividad inicial ya no presupone que la persona conoce la función del tren. La lección presenta primero nombres, funciones, relaciones, errores habituales y límite del modelo.

### 2.2 Reconocimiento más explicación causal

Las 40 preguntas de elección de los cuatro paquetes conservan su utilidad como predicción o reconocimiento, pero ya no bastan por sí solas. Cada una queda emparejada en el mismo paso con una respuesta estructurada:

- qué se observó antes y después;
- qué pieza o subsistema actuó;
- cuál recibió el efecto;
- grado de confianza.

La explicación queda persistida como razonamiento propio. El sistema comprueba su completitud, pero no finge comprender su calidad: se conserva como pendiente de revisión humana cuando procede.

### 2.3 Dos capas de lenguaje

Los 57 conceptos contienen:

- explicación en lenguaje común;
- denominación y encuadre técnico;
- motivo por el que importa;
- al menos dos acciones observables;
- objetivo de transferencia;
- prerrequisitos y puente de remediación.

La interfaz muestra primero la idea común y deja el detalle técnico desplegable. Los identificadores internos solo aparecen si se activa la preferencia correspondiente.

### 2.4 Autodeclaración separada de evidencia

El onboarding puede recomendar un punto de entrada diferente para experiencia en cuarzo, mecánica o nivel avanzado. Esa información aparece como `Familiaridad declarada` y nunca como competencia demostrada.

Los únicos estados acreditados siguen procediendo de sesiones, evidencias y reglas persistidas:

- presentada;
- en práctica;
- demostrada;
- consolidada.

### 2.5 Error conceptual y remediación

Se añaden 14 errores conceptuales curados. Entre ellos:

- proximidad visual no equivale a engrane o contacto;
- el tren transmite energía, no la crea;
- el escape dosifica la energía, no es la fuente;
- un cuarzo también necesita transmisión mecánica;
- una reconstrucción visual no produce cotas oficiales;
- una secuencia virtual no acredita destreza manual;
- un síntoma no determina una causa única;
- R2 no es un gemelo exacto del MIYOTA 8215.

Cada error contiene expresión típica, diagnóstico, corrección, señales observables y lección de refuerzo.

### 2.6 Tutor contextual acotado

El tutor implementado en 0.7 es determinista y no generativo. Puede:

- orientar;
- formular preguntas socráticas declaradas;
- explicar contenido ya aprobado;
- señalar una fuente;
- proponer una remediación;
- resumir el estado visible.

No puede:

- inventar dimensiones, materiales, contactos o física;
- certificar una competencia;
- sustituir la respuesta del estudiante;
- presentar una simulación como validación de ingeniería;
- hacer una afirmación técnica sin una fuente declarada.

Este contrato prepara una integración futura con IA sin concederle autoridad pedagógica o técnica implícita.

## 3. Superficies

### Inicio

Ofrece un único punto de partida recomendado y explica su base:

- progreso persistido;
- autodeclaración;
- recorrido inicial por defecto.

### Ruta

Muestra los hitos en orden con cuatro estados:

- completado;
- actual;
- disponible;
- bloqueado por base pendiente.

### Lección

Muestra el ciclo completo de aprendizaje, conceptos en dos capas, prerrequisitos reales, guía contextual y práctica solo después de la preparación.

### Mapa

Sustituye el diagrama decorativo por columnas calculadas desde los prerrequisitos reales. Puede filtrarse por ruta y ofrece una lista accesible equivalente. Cada nodo explica:

- estado;
- procedencia del estado;
- lenguaje común;
- lenguaje técnico;
- criterio observable;
- prerrequisitos;
- puente;
- práctica.

### Actividad

El preflight muestra el ciclo, el alcance de la evaluación, la frontera física, el contrato de feedback y la guía contextual. En el workspace:

- la respuesta de reconocimiento no permite saltar la explicación causal;
- el modelo resalta el origen del movimiento y sus contactos;
- el panel indica la siguiente observación;
- el feedback correcto e incorrecto procede del contrato editorial;
- una explicación pendiente de revisión no se etiqueta como correcta.

### Resultado

Separa:

- qué encajó o qué debe revisarse;
- pregunta causal;
- siguiente observación;
- transferencia;
- error conceptual relacionado;
- lección de remediación;
- progreso derivado.

### Repaso

La proyección de dominio programa recuperaciones independientes a 1, 7 y 21 días. La cola muestra el número de repaso, la fecha y la razón. Posponer una notificación no altera el dominio.

## 4. Contenido declarativo 0.4.0

Los cuatro paquetes usan `packageVersion: 0.4.0` y exigen `minimumAppVersion: 0.7.0`.

Nuevos contratos:

- `learningDesign`;
- `milestones`;
- `plainLanguage`;
- `technicalLanguage`;
- `whyItMatters`;
- `observableActions`;
- `transferTargetIds`;
- `misconceptions`;
- `feedbackContract`;
- `tutorContract`.

Los contratos son opcionales en el esquema base para poder leer paquetes v1 anteriores. Son obligatorios por validación editorial para los cuatro paquetes reales de Horologia.

## 5. Compatibilidad

- No cambia el formato de `WatchProject` ni de `.wplab`.
- No se muta un proyecto técnico desde Academia.
- Las nuevas propiedades de dominio son opcionales al leer bases de datos anteriores.
- `retentionCandidateAt` se conserva como alias compatible de `nextReviewAt`.
- Los paquetes antiguos de esquema v1 siguen siendo legibles.
- Las sesiones mantienen fijadas sus versiones y evidencias.
- Los paquetes 0.4.0 se instalan como nuevas versiones, sin reinterpretar evidencia histórica 0.2.0/0.3.x ni sobrescribir sesiones creadas con versiones anteriores.

## 6. Volumen comprobable

| Elemento | Total |
|---|---:|
| Rutas reales | 4 |
| Conceptos | 57 |
| Lecciones | 43 |
| Prácticas | 96 |
| Hitos del recorrido inicial | 10 |
| Errores conceptuales | 14 |
| Preguntas de reconocimiento | 40 |
| Explicaciones causales estructuradas | 41 |

## 7. Criterios de aceptación

La Academia 0.7 se considera funcional cuando:

1. los cuatro paquetes validan sin diagnósticos;
2. el recorrido inicial contiene exactamente diez hitos;
3. todas las prácticas tienen feedback causal y tutor acotado;
4. toda pregunta de reconocimiento tiene una explicación causal asociada;
5. la autodeclaración nunca produce dominio;
6. el mapa usa dependencias reales;
7. la práctica no permite saltar la explicación;
8. el resultado ofrece remediación;
9. el repaso usa fechas 1–7–21;
10. `npm run verify` y el QA visual pasan;
11. se genera el instalador 0.7.0.

## 8. Límites honestos

- Una respuesta abierta guardada no equivale a una evaluación semántica automática.
- El tutor actual no conversa y no usa IA.
- La interacción 3D sigue limitada por la fidelidad G/K/P y el nivel R de cada fixture.
- Las prácticas virtuales no acreditan manipulación, limpieza, lubricación, ajuste ni diagnóstico de una unidad física.
- Los nuevos contratos estructuran el contenido externo; no sustituyen la revisión de un relojero docente ni la validación con alumnado.

## 9. Verificación final

- `npm run verify`: correcto.
- Vitest: 76 archivos y 349 pruebas correctas.
- Build web de producción: correcto.
- QA funcional: inicio, ruta, mapa, lección, preparación y workspace comprobados en navegador.
- QA visual: 1280 × 720, 1024 × 768 y 768 × 720.
- Animación: fotogramas sucesivos distintos y estado de mecanismo en marcha confirmado.
- Interacción: selección accesible, contactos, avance guiado, elección y explicación causal obligatoria comprobados.
- Consola en sesión limpia: sin errores ni avisos.

## 10. Instalador Windows

- Producto: Watch Prototype Lab 0.7.0.
- Arquitectura: x64.
- Tamaño: 108 202 230 bytes (103,19 MiB).
- SHA-256: `8d50904050237d3a38c0bb28393e3c6b0f1886624856ae5210dc045a55aac9ca`.
- Verificación incluida durante el empaquetado: sí.
- Academia sin conexión: incluida.
- Sidecar CAD: incluido.
- Firma Authenticode: no firmada; Windows puede mostrar una advertencia de editor desconocido.
