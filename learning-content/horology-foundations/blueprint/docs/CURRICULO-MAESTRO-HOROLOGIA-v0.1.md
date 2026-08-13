# Currículo maestro de horología — v0.1

## Propósito

Este currículo está diseñado para llevar a una persona que ya ha desmontado un movimiento de cuarzo ISA 8172 desde una comprensión inicial de los sistemas relojeros hasta la capacidad de:

- reconocer y explicar todos los subsistemas de un reloj;
- desmontar, inspeccionar, montar y comprobar movimientos sencillos;
- trabajar con movimientos donantes de forma documentada;
- comprender el MIYOTA 2035 y el MIYOTA 8215 con profundidad progresiva;
- comparar familias MIYOTA 82 y 90;
- documentar compatibilidades e incompatibilidades;
- diseñar un reloj completo alrededor de un movimiento real;
- comprender los fundamentos del diseño de un calibre.

No sigue el orden del libro. Reorganiza su contenido según prerrequisitos pedagógicos y separa claramente:

- comprensión conceptual;
- reconocimiento visual;
- manipulación virtual;
- práctica física doméstica;
- trabajo que requiere taller profesional;
- datos oficiales, estimaciones, mediciones e inferencias.

## Principios pedagógicos

1. **Visual antes que abstracto.** Los conceptos importantes deben poder verse, aislarse, animarse o manipularse.
2. **Función antes que nombre.** Primero se entiende qué hace una pieza; después se memoriza su denominación.
3. **Sistema completo antes que detalle.** El alumno ve la cadena energética completa antes de estudiar cada subsistema.
4. **Predicción antes que explicación final.** Siempre que sea útil, el alumno predice qué ocurrirá al retirar, bloquear o modificar un elemento.
5. **Comparación constante.** Cuarzo y mecánico, nominal y medido, serie 82 y serie 90, pieza sana y pieza defectuosa.
6. **Procedencia visible.** Cada afirmación distingue fuente oficial, teoría del libro, medición, observación, cálculo o explicación educativa.
7. **Fidelidad declarada.** G/K/P nunca se confunden con exactitud industrial.
8. **Aprendizaje acumulativo.** Las competencias se introducen, practican, demuestran y retienen.
9. **Práctica doméstica segura.** El curso prioriza desmontaje, montaje, observación y documentación con herramientas accesibles.
10. **Profundidad máxima sin fingir datos.** Las incógnitas se conservan como incógnitas.

---

# Arquitectura general

## Ruta 0 — Orientación y mapa funcional

### M0.1 · Qué es realmente un reloj
- Reloj como sistema de energía, regulación e indicación.
- Diferencia entre caja, esfera, agujas y movimiento.
- Qué significa calibre, variante, referencia y familia.
- Visual central: reloj completo que se vuelve transparente por capas.

### M0.2 · Cómo observar sin desmontar
- Cara de esfera, cara de puentes y lateral.
- Identificación por función, forma, movimiento y posición.
- Cómo registrar lo que se sabe y lo que solo se sospecha.
- Visual central: inspección guiada con marcadores y vistas ortográficas.

### M0.3 · Seguridad, orden y método doméstico
- Puesto limpio, iluminación, ergonomía, bandejas, control de piezas y energía almacenada.
- Herramientas mínimas, recomendables y profesionales.
- Riesgos de muelles, baterías, productos de limpieza y piezas proyectadas.
- Fuente principal: capítulos 1 y 2 del libro, reinterpretados para un puesto doméstico.

### M0.4 · Medidas, tolerancias y procedencia
- Milímetros, micras, diámetros, alturas, holguras, concentricidad y alineación.
- Dato nominal frente a medida de una unidad.
- Fuente oficial, estimada, medida, calculada y desconocida.
- Visual central: la misma pieza con cinco capas de confianza.

---

## Ruta 1 — Del ISA 8172 al MIYOTA 2035

### M1.1 · La cadena funcional de un reloj de cuarzo
- Pila, circuito, resonador de cuarzo, bobina, rotor paso a paso, tren e indicación.
- Qué regula la marcha y qué transmite el movimiento.
- Visual central: flujo de energía animado y pausado por etapas.

### M1.2 · Lo que ya aprendiste desmontando el ISA 8172
- Reconocer platina, puentes/cubiertas, bobina, rotor, tren, tija y agujas.
- Separar observación real de generalización.
- Actividad: reconstrucción del orden de desmontaje a partir de memoria y evidencia.

### M1.3 · Comparación ISA 8172–MIYOTA 2035
- Equivalencias funcionales sin afirmar compatibilidad física.
- Diferencias de envolvente, arquitectura y documentación.
- Actividad: colocar cada pieza en su subsistema y justificar la elección.

### M1.4 · MIYOTA 2035: lectura de documentación oficial
- Especificación, plano, manual y despiece.
- Cómo leer alturas, tija, manos, envolvente y referencias.
- Visual central: plano 2D sincronizado con el modelo 3D.

### M1.5 · MIYOTA 2035 completo
- Arquitectura documentada.
- Desmontaje y montaje educativo.
- Puesta en hora, transmisión y diagnóstico básico.
- Proyecto: documentar un 2035 virtual y, más adelante, una unidad física.

---

## Ruta 2 — Fundamentos del reloj mecánico

### M2.1 · La fuente de energía: muelle real y barrilete
- Par, número de vueltas, reserva y curva de entrega.
- Muelle contenido frente a muelle libre.
- Visual central: sección del barrilete y variación de par conceptual.
- Fuente principal: capítulo 9 del libro.

### M2.2 · Ruedas, piñones y relaciones
- Rueda conductora, piñón conducido, sentido de giro, relación y velocidad.
- Módulo, número de dientes y distancia entre centros a nivel progresivo.
- Visual central: tren editable con conteo y flechas.
- Fuente principal: capítulo 5 del libro.

### M2.3 · El tren de rodaje
- Rueda de centro, tercera, cuarta y escape como arquitectura típica, no universal.
- Función de cada etapa.
- Endshake, pivotes, rubíes y puentes.
- Actividad: retirar una rueda y predecir el efecto.

### M2.4 · El escape
- Bloqueo, desbloqueo, impulso y caída.
- El escape no “crea” precisión: entrega energía de forma controlada.
- Áncora, rueda de escape y relación con el volante.
- Visual central: animación lenta y scrubbing del escape de áncora suizo.
- Fuente principal: capítulo 8 del libro.

### M2.5 · Volante y espiral
- Oscilación, frecuencia, amplitud, isocronismo y regulación.
- Qué cambia el periodo y qué cambia la amplitud.
- Visual central: espiral exagerada, después escala real.
- Fuente principal: capítulo 11 del libro.

### M2.6 · Minutería y agujas
- Cañón de minutos, rueda de minutería, rueda de horas y fricción.
- Diferencia entre tren de marcha e indicación.
- Actividad: seguir una vuelta de la rueda de minutos hasta las agujas.

### M2.7 · Cuerda y puesta en hora
- Corona, tija, piñón corredizo, rueda de corona, tirete, báscula y posiciones.
- Modo de carga frente a modo de puesta en hora.
- Visual central: árbol de estados de la corona.

### M2.8 · Carga automática
- Rotor, reducción, reversión y transmisión al barrilete.
- Sistemas unidireccionales y bidireccionales como concepto.
- Visual central: giro del rotor con resaltado de la ruta activa.

### M2.9 · Calendario básico
- Rueda de fecha, arrastre, salto y corrección rápida.
- Ventanas de cambio y riesgo de corrección.
- Visual central: ciclo acelerado de 24 horas.

### M2.10 · El movimiento mecánico completo
- Integración de energía, transmisión, regulación, indicación y funciones.
- Actividad de síntesis: explicar el movimiento completo sin etiquetas.

---

## Ruta 3 — MIYOTA 8215 y familia 82

### M3.1 · Identidad y documentación del 8215
- Familia, envolvente, funciones, frecuencia, rubíes, reserva y uso.
- Lectura del plano y manual oficial.
- Diferencia entre afirmación oficial y reconstrucción visual.

### M3.2 · 8215 por subsistemas
- Estructura.
- Barrilete y tren.
- Escape y regulación.
- Cuerda/puesta en hora.
- Calendario.
- Automático.
- Visual central: capas reversibles sobre un único ensamblaje canónico.

### M3.3 · Desmontaje razonado del 8215
- Orden seguro.
- Liberación de energía.
- Dependencias entre puentes y conjuntos.
- Actividad: ordenar piezas y justificar por qué una debe salir antes que otra.

### M3.4 · Montaje razonado del 8215
- Colocación de árboles.
- Alineación de pivotes.
- Asentamiento de puentes.
- Comprobación progresiva del tren.
- Actividad: montaje virtual con errores reversibles.

### M3.5 · Calendario del 8215
- Piezas oficiales documentadas.
- Ciclo funcional y corrección rápida.
- Diagnóstico de errores básicos sin inventar tolerancias.

### M3.6 · Automático del 8215
- Rotor, ruedas de reducción/reversión y carga.
- Recorrido de energía.
- Comparación con cuerda manual.

### M3.7 · Escape, volante y regulación del 8215
- Identificación de piezas.
- Frecuencia y ángulo de alzamiento documentado.
- Lectura de cronocomparador a nivel introductorio.

### M3.8 · 82S0: arquitectura visible
- Qué cambia para el open-heart.
- Qué permanece común a la familia.
- Uso pedagógico de la apertura para observar el órgano regulador.

### M3.9 · 8N24: esqueletado y lectura espacial
- Cómo el esqueletado revela y oculta relaciones.
- Comparación con 8215 y 82S0.
- Actividad: reconstruir mentalmente apoyos y recorridos.

### M3.10 · Proyecto de familia 82
- Comparar 8215, 82S0 y 8N24.
- Registrar piezas comunes, variantes y datos desconocidos.
- Crear dossier de compatibilidad, sin afirmar intercambiabilidad no documentada.

---

## Ruta 4 — Servicio, montaje y diagnóstico

### M4.1 · Planificar un desmontaje
- Fotografías, mapas de tornillos, bandejas y secuencias.
- Qué registrar antes de tocar una pieza.

### M4.2 · Limpieza
- Principios de limpieza, compatibilidad de materiales y secado.
- Diferencia entre práctica doméstica segura y procesos profesionales.

### M4.3 · Inspección
- Desgaste, óxido, suciedad, rebabas, pivotes, dientes, rubíes y muelles.
- Visual central: comparación sana/defectuosa con lupa virtual.

### M4.4 · Lubricación
- Por qué, dónde, cuánto y cuándo no lubricar.
- Película, migración y contaminación.
- No se publicarán puntos o aceites específicos de un calibre sin documentación fiable.

### M4.5 · Holguras, altura y libertad
- Endshake, sideshake, depthing, libertad axial y roce.
- Visual central: errores exagerados y después escala real.

### M4.6 · Montaje y pruebas parciales
- Probar el tren antes de cerrar.
- Verificar libertad en cada subsistema.
- Registrar el punto exacto donde aparece un fallo.

### M4.7 · Regulación y cronocomparador
- Marcha, amplitud, beat error, posiciones y estabilidad.
- Qué puede y qué no puede concluirse.

### M4.8 · Diagnóstico estructurado
- Síntoma → subsistema → hipótesis → prueba → resultado → conclusión.
- El curso nunca convierte una hipótesis en avería confirmada sin evidencia.

---

## Ruta 5 — Serie 90 y movimientos MIYOTA complejos

### M5.1 · Serie 82 frente a serie 90
- Altura, frecuencia, precisión declarada, rubíes y arquitectura de producto.
- Comparación visual de envolventes y densidad.

### M5.2 · MIYOTA 9015
- Movimiento premium fino con fecha.
- Lectura de documentación y comparación con 8215.

### M5.3 · MIYOTA 9039
- Tres agujas sin fecha.
- Cómo la eliminación de una función afecta al diseño del reloj.

### M5.4 · MIYOTA 9100
- Reserva de marcha, mes/día, 24 horas y fecha.
- Mapa de complicaciones y capas de indicación.

### M5.5 · MIYOTA 9120
- Comparación con 9100.
- Qué función desaparece y qué permanece.

### M5.6 · Proyecto serie 90
- Seleccionar calibre según restricciones reales de diseño.
- Documentar ventajas, límites y dependencias de caja/esfera/agujas.

---

## Ruta 6 — Donantes, metrología y movimientos híbridos

### M6.1 · Identidad y procedencia de una pieza
- Fabricante, calibre, referencia, unidad física, fotografía y confianza.

### M6.2 · Metrología doméstica y profesional
- Calibre, micrómetro, microscopio, comparador y medición óptica.
- Error, repetibilidad y resolución.

### M6.3 · Interfaces funcionales
- Pivote/rubí, rueda/piñón, puente/platina, tija/keyless, esfera/movimiento.
- Qué medidas describen realmente una interfaz.

### M6.4 · Compatibilidad
- Envolvente, distancia entre centros, altura, pivotes, frecuencia, tija y barrido de rotor.
- Compatible, condicional, bloqueado y forzado.

### M6.5 · Trasplantes controlados
- Sustituir conjuntos con trazabilidad.
- Qué debe volver a validarse después de cada trasplante.

### M6.6 · Movimiento híbrido
- Construir un calibre experimental sin presentarlo como producción lista.
- Dossier completo de procedencia, incertidumbre y pruebas pendientes.

---

## Ruta 7 — Diseño y fabricación relojera

### M7.1 · Diseñar antes de fabricar
- Dibujos, datums, escalas y estudio de interacción.
- Fuente principal: capítulo 1, apartado de dibujo.

### M7.2 · Arquitectura del movimiento
- Posición de barrilete, tren, escape, volante, tija y complicaciones.
- Fuente principal: capítulo 10.

### M7.3 · Cálculo de trenes
- Relaciones, frecuencias, segundos, minutos y horas.
- Proyecto paramétrico dentro de Watch Prototype Lab.

### M7.4 · Platinas, puentes y rubíes
- Apoyos, rigidez, acceso, montaje y mantenimiento.
- Fuentes principales: capítulos 7 y 10.

### M7.5 · Fabricación de ruedas, piñones y componentes pequeños
- Contenido avanzado de los capítulos 4, 5 y 6.
- La aplicación simula y documenta; la práctica real queda etiquetada por requisitos de taller.

### M7.6 · Materiales y acabados
- Acero, latón, endurecido, templado, pulido y acabado.
- Fuente principal: capítulo 3.

### M7.7 · Volante, espiral y regulación avanzada
- Fuente principal: capítulo 11.
- Separación clara entre comprensión, ajuste y fabricación.

### M7.8 · Caja, esfera y decoración
- Casemaking y engine turning.
- Fuentes principales: capítulos 12 y 13.

### M7.9 · Escapes avanzados y alta relojería
- Escape de detención, coaxial, tourbillon y remontoir.
- Fuente principal: capítulo 8 y láminas iniciales.
- Se estudian como sistemas avanzados, no como prerrequisito inicial.

### M7.10 · Proyecto final: reloj completo
- Elegir movimiento.
- Diseñar caja, esfera, agujas, tija, corona y sujeción.
- Documentar fuentes, medidas, tolerancias, fabricación y pruebas.
- Opcional avanzado: diseñar un movimiento experimental propio.

---

# Mapa de prerrequisitos resumido

```text
Orientación
  ├─ seguridad y método
  ├─ procedencia y medidas
  └─ mapa funcional
       ├─ cuarzo → ISA 8172 → MIYOTA 2035
       └─ mecánico
            ├─ barrilete
            ├─ tren
            ├─ escape
            ├─ volante/espiral
            ├─ keyless/minutería
            ├─ automático
            └─ calendario
                 ↓
              MIYOTA 8215
                 ├─ servicio y diagnóstico
                 ├─ 82S0 / 8N24
                 ├─ serie 90
                 └─ donantes / híbridos
                            ↓
                   diseño y fabricación
```

# Fuentes del libro por bloque

El libro se usa como fuente privada de teoría y taller, no como orden obligatorio del curso:

1. Taller y equipo.
2. Herramientas manuales.
3. Acabado de acero y latón.
4. Torneado.
5. Ruedas y piñones.
6. Fabricación de componentes pequeños.
7. Rubíes y procesos de joyería.
8. Escapes.
9. Muelles reales y accesorios.
10. Diseño de movimientos.
11. Volante y espiral.
12. Fabricación de cajas.
13. Cajas y esferas guilloché/engine-turned.

# Criterio de finalización del currículo

El currículo no se considera completo porque existan textos. Cada módulo importante debe incluir, según corresponda:

- explicación;
- glosario;
- recurso visual;
- escena o interacción;
- predicción;
- actividad;
- evidencia;
- rúbrica;
- alternativa textual;
- reduced motion;
- fuentes;
- fidelidad;
- limitaciones;
- conexión con una pieza o movimiento real.
