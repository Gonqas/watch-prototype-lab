# Aprender — navegación y experiencia de usuario

Estado: propuesta de interacción, no diseño visual final.

## 1. Integración en el producto

`Aprender` se añade a la navegación superior como séptima área de `Workspace`. No abre una aplicación separada. El encabezado conserva nombre de proyecto, movimiento y estado local/CAD para reforzar que se está aprendiendo sobre el mismo objeto técnico.

Al alternar desde Montaje, Piezas, Movimiento o Validación:

1. se conserva el `projectId` activo;
2. se captura el estado de viewport;
3. Aprender propone contenidos aplicables a la selección y movimiento;
4. al volver al trabajo se restaura la vista anterior, salvo que el usuario elija conservarla;
5. cualquier cambio técnico generado por una práctica de diseño se presenta como diff antes de aplicarse.

## 2. Estructura global

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Producto / áreas │ Proyecto + movimiento │ sesión │ guardar / historial │
├────────────────┬──────────────────────────────────┬──────────────────────┤
│ Conocimiento   │                                  │ Explicación / Tutor  │
│ Ruta / árbol   │          Viewport 3D             │ Evidencia / Fuentes  │
│ Piezas / pasos │                                  │ Datos que faltan     │
├────────────────┴──────────────────────────────────┴──────────────────────┤
│ Timeline │ velocidad │ prueba/herramienta │ hipótesis │ resultado parcial │
├──────────────────────────────────────────────────────────────────────────┤
│ Estado técnico │ confianza │ sesión │ progreso │ offline/CAD            │
└──────────────────────────────────────────────────────────────────────────┘
```

La estructura amplía el grid actual de `App`: el centro sigue siendo prioritario; los paneles laterales cambian de contenido según submodo y la zona inferior pasa de barra de estado a dock de sesión con la barra global debajo.

## 3. Navegación de Aprender

### 3.1 Nivel superior

Dentro de Aprender, una barra secundaria estable ofrece:

- **Inicio**;
- **Mapa**;
- **Laboratorio**;
- **Prácticas**;
- **Averías**;
- **Metrología**;
- **Biblioteca**;
- **Proyectos**;
- **Progreso**.

No todos son pantallas aisladas: al abrir una práctica, Mapa/Biblioteca/Progreso pasan a paneles contextuales sin desmontar la sesión.

### 3.2 Deep links internos

Toda entidad relevante tiene un enlace interno estable:

```text
/learn/concept/{nodeId}
/learn/practice/{practiceId}
/learn/scene/{sceneId}
/learn/fault/{scenarioId}
/learn/source/{sourceId}/{locator}
/learn/project/{dossierId}
```

La implementación inicial puede usar estado local en lugar de un router web, pero el contrato debe existir para referencias, historial y reanudación.

## 4. Pantallas

### 4.1 Inicio

Objetivo: orientar sin ocultar la exploración.

Bloques:

- continuar sesión activa;
- `En este movimiento`: conceptos, prácticas y datos desconocidos relevantes;
- ruta sugerida con explicación del porqué;
- proyectos educativos activos;
- evidencias recientes y errores repetidos;
- paquetes instalados y disponibilidad offline.

Una ruta nunca se presenta como única. `Explorar libremente` abre el mapa completo.

### 4.2 Mapa de conocimiento

Panel izquierdo:

- filtros por tema, dificultad, pieza, movimiento y dominio;
- alternancia grafo/árbol/lista accesible;
- leyenda de prerrequisitos y estado.

Centro:

- grafo con zoom y agrupación por subsistema;
- ruta recomendada destacada;
- nodos no aplicables visibles pero atenuados, con razón.

Panel derecho:

- resumen del concepto;
- prerrequisitos y relacionados;
- piezas y movimientos de ejemplo;
- escenas, prácticas, fuentes y glosario;
- evidencia de progreso.

Seleccionar una pieza en 3D filtra el mapa; seleccionar un concepto puede resaltar sus piezas sin iniciar una lección.

### 4.3 Laboratorio educativo

Es la composición principal de tres paneles y dock inferior.

Panel izquierdo:

- índice del concepto o práctica;
- árbol de entidades resueltas;
- pasos y checkpoints;
- estado de aplicabilidad.

Viewport:

- modo visual actual;
- escena declarativa;
- etiquetas y overlays;
- interacción según política del paso.

Panel derecho con pestañas:

- **Explicar**: explicación vinculada a selección;
- **Tutor**: diálogo y actos estructurados;
- **Evidencia**: claims, exactitud, inputs y limitaciones;
- **Fuentes**: citas y documentos;
- **Datos**: conocidos, desconocidos y mediciones posibles.

Dock inferior:

- play/pause, tiempo y velocidad;
- scrubber y paso de evento cuando proceda;
- herramienta activa;
- prueba diagnóstica o hipótesis activa;
- acción `Restaurar escena`;
- estado y criterio del paso.

### 4.4 Prácticas

Catálogo filtrable por habilidad, movimiento, duración, dificultad y disponibilidad. Cada tarjeta declara antes de empezar:

- qué se hará;
- movimiento/activos requeridos;
- fidelidad del modelo;
- herramientas;
- evidencia que generará;
- si modifica o no el proyecto;
- política de ayudas del modo.

Al iniciar, se elige modo guiado, asistido, libre o evaluación cuando la definición lo permita.

### 4.5 Desmontaje y montaje

El banco inferior muestra bandejas para:

- piezas retiradas;
- tornillos identificados por posición y referencia;
- herramientas;
- consumibles;
- contaminación/lubricación;
- registro cronológico.

La escena ofrece señales diferentes:

- dependencia bloqueada: contorno y explicación, no movimiento silenciosamente impedido;
- orientación incorrecta: ghost de referencia opcional según modo;
- fuerza fuera de rango: feedback progresivo y consecuencia educativa;
- pieza mal asentada: permanece visible hasta inspección o corrección.

En evaluación, los riesgos no se anuncian por adelantado salvo los obligatorios por seguridad formativa.

### 4.6 Averías y diagnóstico

El panel derecho se convierte en cuaderno de diagnóstico:

- síntomas observados;
- datos disponibles;
- hipótesis con estado `posible`, `favorecida`, `debilitada`, `descartada`;
- pruebas candidatas, coste y requisitos;
- explicación causal en construcción.

El sistema no revela el diagnóstico por seleccionar una prueba. La observación resultante se añade como evidencia. En modo guiado el tutor pregunta qué cambiaría cada resultado antes de ejecutarla.

### 4.7 Metrología

La pantalla combina:

- entidad 3D aislada y datums resaltados;
- procedimiento y posición del instrumento;
- ficha de instrumento;
- tabla de repeticiones;
- gráfica simple de dispersión;
- cálculo de repetibilidad/incertidumbre;
- comparación con la `Dimension` actual;
- propuesta de promoción con diff.

Un valor importado de STEP aparece en una categoría diferente de una lectura de micrómetro. La UI nunca llama `medido` a lo inferido de una envolvente sin revisión.

### 4.8 Donantes

Vista de comparación:

- árbol target/donante;
- superposición 3D con color por diferencia;
- matriz de interfaces;
- checks ejecutados;
- checks no ejecutados y datos que faltan;
- modificaciones necesarias;
- expediente de decisión.

Forzar un trasplante requiere abrir riesgos, escribir justificación y confirmar que el estado original sigue siendo incompatible o condicionado. La decisión queda visible en el proyecto educativo y la procedencia técnica.

### 4.9 Biblioteca

Tres columnas:

- catálogo, colecciones y búsqueda;
- visor de original con localizador estable;
- capas derivadas y vínculos contextuales.

Controles explícitos para alternar original, traducción, explicación e interpretación. Las anotaciones se muestran sobre una capa separada y pueden ocultarse.

La ficha indica disponibilidad offline, licencia, integridad, versión y fecha de consulta. Un enlace roto no invalida citas ya archivadas localmente.

### 4.10 Proyectos educativos

Vista de expediente:

- objetivo y definición de terminado;
- hitos y dependencias;
- proyecto técnico enlazado;
- piezas y donantes;
- fuentes y medidas;
- decisiones y errores;
- validaciones vigentes/obsoletas;
- BOM y plan de montaje;
- entregables y revisión final.

La vista puede entrar directamente en el laboratorio con el contexto del hito activo.

### 4.11 Progreso

No usa una cuadrícula de checks. Presenta:

- dominio por área y movimiento;
- evidencias que sostienen cada estado;
- conceptos en retención;
- errores repetidos y evolución;
- habilidades de identificación, montaje, medición, diagnóstico y diseño;
- vocabulario español–inglés;
- proyectos y artefactos.

Cada puntuación es desplegable hasta los intentos que la generaron.

## 5. Comportamiento de los modos visuales

Los modos técnico, educativo, montaje, energía, cinemática, escape, tolerancias, lubricación, diagnóstico, metrología, donantes, fabricación y evaluación aparecen en un selector único. Cambiar de modo:

- conserva selección, cámara y tiempo cuando sean compatibles;
- advierte antes de ocultar información necesaria para la práctica;
- no cambia el proyecto;
- actualiza la leyenda y el panel Evidencia;
- muestra `No disponible` con motivo cuando faltan datos.

Los colores semánticos deben ser consistentes:

- rojo: colisión/acción peligrosa confirmada;
- ámbar: margen o condición;
- violeta: simulación educativa;
- cian: información/relación;
- tramado: dato pendiente o visual-only;
- gris: entidad fuera de alcance.

El color nunca es el único canal.

## 6. Timeline y simulación

El control temporal sustituye el booleano actual por un estado explícito:

- play/pause;
- velocidad predefinida y numérica;
- tiempo absoluto/normalizado;
- scrubber;
- siguiente/anterior evento;
- loop opcional;
- reinicio;
- indicador de fidelidad.

Para una animación puramente didáctica, la leyenda dice `Movimiento ilustrativo`. Para cinemática derivada de ratios, dice `Cinemática analítica`. Un resultado kernel-backed se identifica por separado.

## 7. Tutor

El tutor no domina la pantalla. Se presenta como un panel contextual con seis acciones rápidas:

- Explícame esta pieza.
- Compárala con…
- Hazme una pregunta.
- Dame una pista.
- Pídeme una comprobación.
- ¿Qué dato falta?

Cada respuesta muestra chips de evidencia (`medido`, `oficial`, `analítico`, `hipótesis`, `simulación`) y enlaces a la escena/fuente. Una respuesta que no pueda sostenerse se formula como pregunta o hipótesis, no como hecho.

## 8. Estados vacíos, parciales y fallos

Ejemplos obligatorios:

- movimiento sin anatomía interna: explicar qué actividades siguen disponibles;
- selector ambiguo: pedir elegir instancia o usar contenido compatible;
- fuente no disponible offline: conservar cita y metadatos;
- informe CAD obsoleto: mostrar fecha/fingerprint y ofrecer recalcular;
- contenido incompatible: aislar el paquete y mostrar diagnóstico;
- sesión interrumpida: ofrecer reanudar desde evento consistente;
- proveedor de tutor ausente: mantener preguntas, pistas y evaluación determinista.

## 9. Accesibilidad

### 9.1 Equivalencia semántica

Toda acción 3D debe tener alternativa en árbol/lista. El estado de la escena dispone de una transcripción textual: entidades visibles, selección, relaciones, valores y alertas.

### 9.2 Teclado

- orden de foco predecible entre navegación, panel izquierdo, viewport semántico, panel derecho y dock;
- atajos configurables para play/pause, paso, aislar, restaurar y abrir evidencia;
- ninguna operación depende de drag sin alternativa numérica o por comando;
- escape cancela herramienta o cierra overlay antes de abandonar sesión.

### 9.3 Percepción

- contraste WCAG AA como mínimo;
- patrones/iconos además de color;
- tamaño de texto y densidad configurables;
- `prefers-reduced-motion` detiene animaciones no esenciales y ofrece paso discreto;
- etiquetas persistentes opcionales para usuarios con dificultad espacial;
- narración de cambios de estado mediante regiones `aria-live` moderadas.

### 9.4 Evaluación justa

Tiempo y destreza de puntero no forman parte de una rúbrica salvo que el objetivo lo diga. Las adaptaciones de accesibilidad no se cuentan como pistas educativas.

## 10. Responsive

Desktop es la superficie principal. En anchos reducidos:

- paneles laterales pasan a drawers o pestañas;
- el viewport conserva altura mínima útil;
- el dock temporal permanece accesible;
- grafo y fuente ofrecen una vista de lista;
- montaje complejo puede declararse `requiere escritorio` si no existe interacción equivalente segura.

No se debe comprimir el laboratorio hasta convertirlo en lector de texto.

## 11. Confirmaciones y reversibilidad

Se requiere confirmación para:

- aplicar al proyecto técnico un cambio de una práctica;
- promover una campaña de medición;
- aceptar condiciones de donante;
- forzar un trasplante;
- borrar un expediente o fuente local;
- transmitir contexto a un tutor externo.

Salir de una escena ordinaria restaura automáticamente su estado visual. La restauración no borra el historial educativo del intento.
