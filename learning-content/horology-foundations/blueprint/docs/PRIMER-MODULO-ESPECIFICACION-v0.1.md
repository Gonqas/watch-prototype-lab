# Primer módulo real — especificación editorial v0.1

## Identidad

- Ruta: `route.horology.orientation`
- Módulo: `module.horology.functional-map`
- Título: **Cómo funciona un reloj de principio a fin**
- Idioma publicable inicial: español.
- Duración estimada: 90–140 minutos, divididos en sesiones cortas.
- Movimientos: ISA 8172 como experiencia previa; MIYOTA 2035; movimiento mecánico conceptual; MIYOTA 8215 como avance.
- Resultado: el alumno explica la cadena completa de un reloj de cuarzo y de uno mecánico, identifica la función de los subsistemas y predice qué ocurre al interrumpirlos.

## Competencias

1. `competency.horology.identify-functional-subsystems`
2. `competency.horology.explain-quartz-energy-chain`
3. `competency.horology.explain-mechanical-energy-chain`
4. `competency.horology.distinguish-regulation-from-transmission`
5. `competency.horology.predict-system-interruption`
6. `competency.horology.state-source-confidence`

## Lección 1 · Un reloj no es una colección de ruedas

### Objetivos
- Identificar fuente de energía, regulador, transmisión e indicación.
- Explicar por qué una pieza puede ser importante aunque no se mueva visiblemente.
- Distinguir movimiento, esfera, agujas y caja.

### Visual
Reloj completo que se separa en cuatro capas funcionales. Cada capa se puede aislar y la alternativa textual describe las mismas relaciones.

### Actividad
Clasificar elementos en:
- energía;
- control/regulación;
- transmisión;
- indicación;
- estructura.

## Lección 2 · La cadena del cuarzo

### Contenido
```text
pila → circuito/resonador → bobina → rotor paso a paso → tren → agujas
```

### Interacción
- Activar la cadena paso a paso.
- Pausar antes del rotor y predecir el siguiente cambio.
- Desactivar la bobina y observar que el tren no recibe pasos.
- Mantener el modelo del 2035 separado de las simplificaciones conceptuales.

### Evidencia
El alumno ordena la cadena, selecciona el regulador y explica la función del motor paso a paso.

## Lección 3 · Lo que ya conoces por el ISA 8172

### Contenido
- Recuperar la experiencia real del desmontaje.
- Registrar qué piezas se reconocieron con seguridad.
- Separar recuerdo, fotografía, inferencia y documentación.

### Actividad
Crear un mapa de confianza:
- visto directamente;
- identificado por forma;
- inferido por función;
- todavía desconocido.

### Importante
No se declarará que una pieza del ISA es equivalente físicamente a una del 2035 solo porque cumple una función parecida.

## Lección 4 · La cadena mecánica

### Contenido
```text
muelle real/barrilete → tren → escape ↔ volante y espiral → minutería → agujas
```

El escape libera el tren en pasos y repone energía al oscilador. El volante y la espiral establecen el ritmo; no son simplemente otra rueda del tren.

### Interacción
- Animar el muelle liberando energía.
- Seguir la aceleración del tren.
- Reducir la velocidad para ver bloqueo, desbloqueo e impulso.
- Bloquear el volante y observar que la liberación controlada se detiene.
- Separar el tren de marcha de la minutería.

## Lección 5 · Cuarzo y mecánico: equivalencias funcionales

### Comparación
| Función | Cuarzo | Mecánico |
|---|---|---|
| Fuente | Pila | Muelle real |
| Referencia temporal | Resonador de cuarzo y circuito | Volante y espiral |
| Dosificación | Impulsos eléctricos al motor | Escape |
| Conversión | Rotor paso a paso | Barrilete/tren/escape |
| Transmisión | Tren | Tren |
| Indicación | Agujas | Agujas |

La tabla es funcional, no afirma igualdad física.

### Actividad
Arrastrar o seleccionar pares funcionales y justificar una diferencia esencial.

## Lección 6 · Predicción de fallos

### Casos
- pila agotada;
- bobina abierta;
- rotor bloqueado;
- rueda ausente;
- muelle descargado;
- escape bloqueado;
- pivote fuera del rubí;
- agujas rozando.

### Actividad
Para cada síntoma:
1. identificar subsistema;
2. proponer hipótesis;
3. indicar qué dato falta;
4. escoger una prueba no destructiva.

## Escena principal

### Nombre
**Dos caminos para convertir energía en tiempo visible**

### Diseño
Pantalla dividida:
- izquierda: MIYOTA 2035 o modelo de cuarzo;
- derecha: movimiento mecánico conceptual, después 8215.

### Secuencia
1. Vista completa y pregunta de predicción.
2. Aislar fuentes.
3. Mostrar reguladores.
4. Mostrar conversión/dosificación.
5. Activar trenes.
6. Mostrar indicación.
7. Interrumpir un componente.
8. Comparar resultado.
9. Explicar diferencia.
10. Restaurar ambos modelos.

### Fidelidad
- Cuarzo conceptual: G1/K2/P0.
- 2035 inicial: G2/K2/P0.
- Mecánico conceptual: G1/K2/P0.
- 8215 inicial: G2/K2/P0.

### Reduced motion
- Estados discretos.
- Flechas estáticas numeradas.
- Sin movimientos de cámara automáticos.
- Scrubbing paso a paso.

### Alternativa textual
Lista ordenada de componentes, relaciones y cambios de estado. Cada interrupción se explica mediante una tabla causa–efecto.

## Recursos visuales solicitados

1. `visual.horology.complete-watch-layers`
2. `visual.horology.quartz-energy-flow`
3. `visual.horology.miyota2035-structural`
4. `visual.horology.isa8172-memory-map`
5. `visual.horology.mechanical-energy-flow`
6. `visual.horology.swiss-lever-slow-motion`
7. `visual.horology.quartz-mechanical-overlay`
8. `visual.horology.failure-simulation`
9. `visual.horology.functional-text-alternative`

## Rúbrica de demostración

La competencia se considera demostrada cuando el alumno:

- ordena correctamente ambas cadenas;
- distingue regulación de transmisión;
- identifica al menos una diferencia esencial;
- predice correctamente el efecto de dos interrupciones;
- justifica una respuesta sin depender exclusivamente de etiquetas visuales;
- mantiene la distinción entre dato oficial, observación e inferencia.

## Retención

La retención se comprueba después en un contexto diferente:

- identificar subsistemas sobre el 8215 sin la vista comparativa;
- explicar el 2035 usando solo el despiece;
- diagnosticar un síntoma nuevo.
