# Curación completa de etapa 2 · 0.14H

- Secuencia: 2.1 energía → 2.2 engranajes → 2.3 escape → 2.4 oscilador → 2.5 minutería y mando → 2.6 automático y calendario.
- Cobertura: 17 anclas, 5 apoyos y 3 ramas opcionales; 339 apartados fuente conservados dentro de 542 apartados visibles.
- Composición: `augment` en las 25 lecciones; la teoría authored permanece en el flujo normal y la curación añade orientación, visual, caso, límites y comprobación.
- Arquetipos usados: mechanism, visual-anatomy, state-system, calculation, comparison, advanced-reference.
- Las seis lecciones piloto de 0.14E se refinan con procedencia explícita, no se duplican ni pierden sus IDs.

| Capítulo | Rol | Arquetipo | Lección | Fuente | Visible | Resultado observable |
|---|---|---|---|---:|---:|---|
| stage-2.1 | anchor | mechanism | `lesson.mechanical.energy` | 21 | 30 | Trazar la cadena energética y explicar qué magnitud describe cada cambio. |
| stage-2.1 | anchor | visual-anatomy | `lesson.mechanical.barrel` | 13 | 22 | Comparar los dos estados funcionales del barrilete sin convertir el modelo en un procedimiento de apertura. |
| stage-2.1 | anchor | state-system | `lesson.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete` | 11 | 19 | Explicar cualitativamente carga, descarga y variación de entrega, dejando los valores concretos ligados a una fuente. |
| stage-2.1 | support | calculation | `lesson.encyclopedia.math-physics-metrology.fuerza-par-energia` | 11 | 19 | Elegir entre fuerza, par, energía, potencia y velocidad para describir una observación. |
| stage-2.2 | anchor | calculation | `lesson.mechanical.gear-pair` | 13 | 22 | Predecir sentido y relación ideal a partir de los dientes declarados. |
| stage-2.2 | anchor | mechanism | `lesson.mechanical.train` | 22 | 32 | Construir un tren virtual y justificar cada transmisión desde entrada hasta salida. |
| stage-2.2 | anchor | visual-anatomy | `lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren` | 11 | 19 | Separar ruta energética, ejes del tren y derivación de indicación en un mapa causal. |
| stage-2.2 | support | calculation | `lesson.encyclopedia.math-physics-metrology.toh-contar-tren` | 11 | 19 | Escribir las etapas activas, simplificar términos intermedios y explicar el sentido final. |
| stage-2.2 | support | visual-anatomy | `lesson.encyclopedia.mechanical-energy-trains.toh-engranaje-geometria` | 11 | 19 | Distinguir círculo primitivo, paso y número de dientes de una simple proximidad gráfica. |
| stage-2.3 | anchor | state-system | `lesson.mechanical.escapement` | 22 | 31 | Ordenar las fases e identificar qué órgano entrega, recibe o retiene energía. |
| stage-2.3 | anchor | visual-anatomy | `lesson.encyclopedia.escapements-chronometry.geometria-del-escape` | 11 | 19 | Localizar superficies e interfaces y explicar su función con límites de fuente. |
| stage-2.3 | anchor | state-system | `lesson.encyclopedia.escapements-chronometry.toh-escape-fases` | 11 | 19 | Narrar un ciclo completo y diferenciar estado, transición y condición de seguridad. |
| stage-2.3 | optional-branch | comparison | `lesson.advanced.escapement-compare` | 8 | 16 | Comparar bloqueo, impulso, seguridad y acoplamiento declarando el límite de cada analogía. |
| stage-2.4 | anchor | mechanism | `lesson.mechanical.oscillator` | 22 | 32 | Distinguir periodo, frecuencia, alternancia y amplitud en una representación temporal. |
| stage-2.4 | anchor | mechanism | `lesson.mechanical.escape-oscillator` | 13 | 21 | Explicar las dos direcciones de la interacción escape–oscilador. |
| stage-2.4 | anchor | visual-anatomy | `lesson.encyclopedia.escapements-chronometry.volante-y-espiral` | 11 | 19 | Localizar volante, eje, espiral, pitón, virola, puente e índice sin inferir un ajuste. |
| stage-2.4 | support | calculation | `lesson.encyclopedia.math-physics-metrology.oscilacion-amortiguamiento` | 11 | 19 | Relacionar periodo, frecuencia y tendencia de amplitud con supuestos explícitos. |
| stage-2.5 | anchor | visual-anatomy | `lesson.mechanical.motion-works` | 13 | 21 | Construir virtualmente la rama de indicación y distinguirla del tren de rodaje. |
| stage-2.5 | anchor | state-system | `lesson.mechanical.keyless` | 22 | 30 | Reconstruir estados funcionales de tija y explicar qué transmisión queda activa. |
| stage-2.5 | support | mechanism | `lesson.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora` | 11 | 19 | Dibujar la interfaz entre sistema sin llave, puesta en hora y minutería. |
| stage-2.6 | anchor | comparison | `lesson.mechanical.automatic-calendar` | 22 | 31 | Seguir la energía desde el rotor y explicar una secuencia conceptual de cambio de fecha. |
| stage-2.6 | anchor | mechanism | `lesson.encyclopedia.complications.automatico-y-reserva` | 11 | 19 | Reconstruir una ruta funcional de carga y separar reserva nominal, estado y medición. |
| stage-2.6 | anchor | state-system | `lesson.encyclopedia.complications.calendarios` | 11 | 19 | Ordenar arrastre, liberación, salto y retención de un calendario simple. |
| stage-2.6 | optional-branch | advanced-reference | `lesson.advanced.calendars` | 8 | 13 | Comparar calendario simple, completo, anual y perpetuo por información y mecanismo, no por prestigio. |
| stage-2.6 | optional-branch | advanced-reference | `lesson.advanced.chronograph-control` | 8 | 13 | Distinguir control, acoplamiento y puesta a cero en un mapa de estados. |

Las ramas de apoyo y opcionales son no bloqueantes. La etapa 3 conserva su contenido previo: 0.14H solo ofrece la transición desde el cierre de etapa 2.
