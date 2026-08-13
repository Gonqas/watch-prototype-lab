# Watchmaking Academy 0.12 — expansión enciclopédica de contenido

## Resultado

La versión 0.12 convierte la Academia existente en un recorrido personal de 24 rutas, 159 lecciones y 226 prácticas. La expansión añade 12 rutas, 72 lecciones extensas, 74.016 palabras de teoría, 216 conceptos, 216 entradas de glosario y 72 errores conceptuales diagnosticables. No sustituye las rutas visuales y de calibre ya existentes: las rodea con conocimiento previo, teoría densa, vocabulario, física, casos y transferencia.

El objetivo de largo plazo queda explícito: avanzar desde comprender y servir relojes hasta integrar un movimiento adquirido, diseñar caja/esfera/agujas, fabricar componentes, modificar una arquitectura de forma controlada y finalmente justificar un movimiento propio.

## Arquitectura editorial

El contenido nuevo vive en el paquete declarativo `wplab.horology.watchmaking-encyclopedia@1.0.0`. El paquete no contiene procedimientos “mágicos” incrustados en la UI. Cada entidad conserva ID, versión, procedencia, dependencias, competencia, evidencia y recuperación.

Cada una de las 72 unidades incluye obligatoriamente:

1. problema que resuelve;
2. vocabulario operativo;
3. cadena causal o secuencia de trabajo;
4. magnitudes, condiciones y decisiones;
5. caso razonado;
6. fallos y modelos mentales erróneos;
7. fuentes, alcance y contradicción;
8. práctica deliberada y transferencia;
9. criterio de cierre.

La lectura mínima es de 760 palabras por unidad. La práctica permanece bloqueada hasta completar la teoría requerida. La respuesta no es una opción de reconocimiento: obliga a explicar mecanismo o secuencia, evidencia, límite y confianza. El último hito de cada ruta exige transferencia y queda pendiente de revisión humana cuando corresponde.

## Las 12 rutas nuevas

| Orden | Ruta | Seis unidades principales | Función dentro del recorrido |
|---:|---|---|---|
| 1 | Historia, familias y lenguaje | medida del tiempo; portabilidad; evolución de escapes; industrialización; transición eléctrica; lectura documental | Preentrena el lenguaje y evita empezar preguntando algo todavía no explicado. |
| 2 | Taller, herramientas, materiales y seguridad | banco; óptica; herramientas; materiales; tratamientos; limpieza | Da hábitos y límites antes de tocar un movimiento. |
| 3 | Matemáticas, física y metrología | unidades; energía; rotación/contacto; oscilación; incertidumbre; tolerancias/fiabilidad | Permite calcular, medir y decidir sin certeza artificial. |
| 4 | Energía, tren y puesta en hora mecánicos | barrilete; cuerda/automático; dentado; relaciones; apoyos; minutería | Explica el movimiento mecánico completo como cadena funcional. |
| 5 | Escapes, volante y cronometría | ciclo del áncora; geometría; volante-espiral; isocronismo; posiciones; cronocomparador | Separa “hace tic-tac” de regulación y validación cronométrica. |
| 6 | Cuarzo, electrónica y accionamiento | célula; resonador; divisor; motor; diagnóstico; cuarzo avanzado | Explica alimentación, control y actuación antes del caso MIYOTA 2035. |
| 7 | Servicio, tribología y diagnóstico | recepción; energía/desmontaje; inspección; lubricación; montaje; control final | Organiza el servicio como proceso trazable y reversible. |
| 8 | Caja, cristales, coronas y estanqueidad | encaje; corona/tija; cristales; juntas; pruebas; brazalete/restauración | Trata la envolvente como sistema técnico, no como decoración. |
| 9 | Micromecánica y fabricación | referencias; torno; ejes; ruedas; piezas pequeñas; platinas/rubíes | Construye el puente entre reparación y fabricación propia. |
| 10 | Esferas, agujas y acabados | esfera; impresión/lume; agujas; texturas; decoración; guilloché | Integra lectura, interfaces, proceso y conservación geométrica. |
| 11 | Complicaciones | automático/reserva; calendarios; control de cronógrafo; acoplamiento/cero; sonerías; mecanismos avanzados | Enseña complicaciones como máquinas de estados y energía. |
| 12 | Atlas, restauración y diseño propio | identidad; 6497/2824/8215; 7750/6138/cuarzo; patrimonio; repuesto; movimiento propio | Obliga a transferir con límites y termina en un dossier progresivo de diseño. |

## Recorrido conjunto de 24 rutas

Las rutas nuevas no se añaden al final como una biblioteca aislada. El grafo curricular intercala teoría, práctica visual y casos reales:

1. historia y lenguaje;
2. orientación funcional visual;
3. taller, herramientas y materiales;
4. fundamentos de banco;
5. matemáticas, física y metrología;
6. puente físico-digital de medición;
7. fundamentos mecánicos visuales;
8. energía y tren mecánicos;
9. escape y cronometría;
10. cuarzo y electrónica;
11. caso MIYOTA 2035;
12. servicio y tribología;
13. caso MIYOTA 8215;
14. cajas y estanqueidad;
15. micromecánica;
16. esferas, agujas y acabados;
17. complicaciones;
18. atlas, patrimonio y diseño;
19–21. atlas comparativo, método de servicio y arquitecturas avanzadas existentes;
22–24. fabricación/acabados, diseño personal y validación final existentes.

El grafo está versionado en `src/learning/academy/academyCurriculum.ts`. La UI de inicio, búsqueda, ruta, recomendación y prerrequisitos consume el índice integrado; no hay una segunda lista paralela.

## Uso del libro local

`Horologia_completa_OCR_ligera_100MB.pdf` se registra con SHA-256 `78cb0b2931e256f42e6f2843c21be86e47762c0e53f755eef04c86c798e348b2`. Se ha dividido editorialmente en trece fuentes con localizador de páginas:

| Capítulo | Páginas del PDF | Uso principal |
|---|---:|---|
| Workshop and Equipment | 26–48 | banco, máquinas, flujo y preparación |
| Hand Tools | 49–72 | herramientas, ajuste, afilado y sujeción |
| Finishing Steel and Brass | 73–90 | materiales, tratamiento térmico y acabado |
| Turning | 91–122 | torno, ejes, pivotes y concentricidad |
| Wheels and Pinions | 123–167 | dentado, engrane y fabricación |
| Making Small Components | 168–194 | tornillos, muelles y piezas pequeñas |
| Jewelling | 195–213 | rubíes, apoyos, juegos y aceite |
| Escapements | 214–271 | escapes, geometría, bloqueo e impulso |
| Mainsprings and Accessories | 272–297 | muelle real, barrilete y cuerda |
| Movement Design | 298–335 | arquitectura, trenes e integración |
| The Balance and Spring | 336–370 | volante, espiral, isocronismo y posición |
| Casemaking | 371–386 | caja, cristal e interfaces |
| Engine-Turned Cases and Dials | 387–425 | esfera, guilloché y decoración |

El libro se usa para teoría mecánica y construcción tradicional. No se usa como documentación MIYOTA, ETA, Seiko ni como autoridad sobre un calibre industrial. Los procedimientos históricos o sustancias deben contrastarse con práctica de seguridad vigente antes de llevarlos al banco.

## Recursos web y corpus complementario

Se integran las 24 entradas curadas procedentes del directorio Horology Student: bibliografía y proveedores como descubrimiento; bases de calibres para localizar identidades; Ciechanowski y Animagraffs para modelos explicativos; TimeZone, Hodinkee y Horlogerie Suisse para terminología y orientación; ETA Swisslab, manuales, despieces y blogs de reparación para casos que siempre requieren contraste; y proyectos de fabricación/restauración para transferencia.

La jerarquía aplicada es:

- documentación oficial de fabricante: identidad, especificación y procedimiento de esa referencia;
- organismo oficial de metrología: terminología y método metrológico general;
- institución de formación o estándar profesional: mapa de cobertura y práctica;
- libro técnico: teoría y método dentro de su dominio;
- explicación o animación secundaria: comprensión y comparación;
- base de datos o directorio: descubrimiento, nunca tolerancia ni compatibilidad automática;
- síntesis educativa: organización y pregunta, sin fingir autoridad externa.

Las fuentes oficiales declaradas incluyen MIYOTA 2035/8215, ETA 6497/2824/7750 y Seiko 6138. `VBAUhrentechnik.zip` se conserva como banco privado de problemas y cálculo, con obligación de rederivar fórmulas, revisar unidades y contrastar errores antes de ejecutar una conclusión.

## Conocimiento y evaluación

La expansión aporta 216 conceptos conectados. Cada concepto tiene capa sencilla, capa técnica, por qué importa, acciones observables, fuentes, prerequisitos, relaciones, competencia, actividad y error conceptual. Las 72 ideas erróneas no son mensajes genéricos: expresan un modelo mental concreto y enlazan a su lección de reparación.

La práctica sigue cuatro fases:

1. guiada;
2. ayuda reducida;
3. independiente;
4. transferencia.

Una pista obliga a un reintento independiente. La evidencia solo acredita razonamiento dentro de la Academia. La destreza manual, la seguridad de banco, la calidad relojera de un servicio y la validación de ingeniería requieren objeto físico, instrumentos, protocolo y revisión humana.

## Trazabilidad y funcionamiento sin conexión

El paquete se instala con la aplicación y funciona sin red. Los textos, conceptos, glosario, preguntas, evidencias y rutas son locales. Las fuentes web se conservan como referencias y no son dependencia de ejecución. Las dos fuentes privadas locales conservan hash; sus binarios no se duplican dentro del paquete.

Cada afirmación técnica de una unidad tiene claim, método, fidelidad G0/K0/P0, limitaciones y fuentes embebidas. El nivel G0/K0/P0 declara que el texto no valida geometría, cinemática ni física de una unidad concreta.

## Archivos principales

- `scripts/generate-watchmaking-encyclopedia.mjs`: generador determinista del paquete.
- `scripts/horology-corpus/catalog-foundations.mjs`: fundamentos, taller y metrología.
- `scripts/horology-corpus/catalog-mechanisms.mjs`: mecánica, cronometría, cuarzo y servicio.
- `scripts/horology-corpus/catalog-craft.mjs`: cajas, fabricación, esferas y acabados.
- `scripts/horology-corpus/catalog-advanced.mjs`: complicaciones, atlas, restauración y diseño.
- `learning-content/watchmaking-encyclopedia/`: manifest y entidades declarativas generadas.
- `src/learning/product/watchmakingEncyclopediaContent.ts`: integración de producto.
- `src/learning/product/integratedContent.ts`: índice y paquete incluidos de fábrica.
- `src/learning/academy/academyCurriculum.ts`: grafo de 24 rutas.
- `scripts/audit-academy-content-quality.mjs`: control reproducible de amplitud y calidad.

## Verificación

La entrega añade tres capas de regresión:

- P1: 24 rutas, 159 lecciones, 226 actividades y 2.260/2.260 controles de profundidad;
- P2: 320 conceptos, 86 errores, 1.582 controles declarativos y 9/9 garantías de runtime;
- contenido 0.12: 12 rutas nuevas, 72 lecciones, 74.016 palabras, 49 fuentes, 24/24 recursos curados y cero párrafos largos duplicados.

El límite seguro de entradas ZIP aumenta de 1.000 a 2.000 porque el paquete conserva un archivo auditable por entidad. Se mantienen límites de tamaño comprimido, descomprimido, por entrada y JSON para contener paquetes hostiles.

## Límites y siguiente validación real

La amplitud declarativa ya está implementada. Lo que no puede probar el software por sí solo es si una explicación concreta produce dominio real, si un procedimiento histórico es seguro hoy o si una operación física cumple tolerancias. La validación pendiente es longitudinal: revisión relojera de una muestra por dominio, sesiones de principiante, transferencia entre calibres y retención a 1/7/21 días. El sistema ya conserva las evidencias necesarias para realizarla sin reestructurar contenido.
