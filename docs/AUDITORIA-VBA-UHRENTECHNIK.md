# Auditoría de `VBAUhrentechnik.zip`

Fecha: 2026-07-29  
Alcance: inspección técnica, de seguridad, de contenido y de encaje arquitectónico.  
Decisión de uso: proyecto personal y local.  
Cambios en producción realizados durante la auditoría inicial: ninguno.  
Estado posterior: la primera fase de adopción se implementó después de cerrar la auditoría; véase `docs/APRENDER-INGENIERIA-RELOJERA.md`.

## 1. Decisión ejecutiva

El paquete es **muy útil para Watch Prototype Lab**, especialmente para completar los niveles futuros de matemáticas y física relojera, diseño de movimientos, tolerancias, fabricación, metrología y validación.

No debe integrarse ejecutando los Excel ni trasladando literalmente el VBA. La recomendación es:

1. conservar el ZIP como fuente privada con su hash y autoría;
2. convertir sus fórmulas y ejercicios en un corpus de referencia;
3. volver a implementar cada cálculo como función determinista, tipada, versionada y sin dependencia de Excel;
4. verificar cada fórmula con una segunda fuente y con casos dimensionales;
5. usar los resultados verificados tanto en Estudio como en Academia, manteniendo separadas la explicación educativa, la predicción de ingeniería y la validación física.

La utilidad global estimada es **alta, 8,5/10**. El valor está en el conocimiento organizado, los casos y las ideas de calculadora; no en el contenedor VBA.

### Qué sí aporta

- 57 funciones de cálculo relojero y matemático.
- 49 problemas con soluciones.
- hojas de cálculo sobre energía, muelle real, espiral, engranes, presión de Hertz, tolerancias, ajustes, O-rings, deformación de cristal, masa oscilante, fiabilidad, capacidad de proceso y FMEA;
- generadores de coordenadas que pueden alimentar geometría paramétrica;
- ejemplos adecuados para construir laboratorios progresivos;
- un puente claro entre la Academia actual y el objetivo de diseñar un reloj propio.

### Qué no aporta

- modelos CAD ni geometría de piezas reales;
- datos oficiales de MIYOTA;
- un solver físico validado;
- modelos de desgaste, lubricación, choque o estanqueidad certificable;
- una implementación moderna, portable o preparada para el esquema de unidades de la aplicación;
- garantía de corrección de todas las fórmulas.

## 2. Identidad y autenticidad

| Campo | Resultado |
|---|---|
| Archivo recibido | `reference-library/originals/VBAUhrentechnik.zip` |
| Tamaño | 6.052.947 bytes |
| SHA-256 | `67324954824F482958A0BF6E0FCD3598DD3567D0AD010299476192FB103ECF8C` |
| Fuente oficial | [Página de descarga de VBA](https://www.watchmaking.com/vbadownload.htm) |
| Descarga directa oficial | [VBAUhrentechnik.zip](https://watchmaking.com/VBAUhrentechnik.zip) |
| Autor declarado | Kilian Eisenegger |
| Correspondencia | El ZIP adjunto y el ZIP descargado de la página oficial son idénticos byte por byte |

La página oficial describe el paquete como la colección de programas y funciones Excel que acompaña a *Uhrenkonstruktion* y afirma que los archivos y manuales se revisaron en 2024. La revisión interna muestra una realidad más matizada:

- varios libros sí fueron guardados de nuevo en 2024;
- los manuales son la versión 7.0, fechada el 07-07-2024;
- el módulo principal `Formeln.xlam` conserva en el propio código la versión 07-01-2013;
- otros libros contienen módulos aún anteriores.

Por tanto, «paquete actualizado en 2024» no significa que todas las ecuaciones hayan recibido una revisión matemática nueva.

## 3. Inventario completo

El ZIP contiene 27 archivos útiles:

- dos manuales PDF de 51 páginas;
- 25 libros o complementos Excel;
- 60 hojas;
- 12.222 celdas no vacías;
- 7.252 fórmulas de hoja;
- diez archivos con VBA;
- 2.265 líneas de VBA extraídas estáticamente.

### 3.1 Manuales

| Archivo | Idioma | Resultado |
|---|---|---|
| `VBAUhrentechnik.pdf` | alemán | Manual completo, listado de funciones, 49 ejercicios y soluciones |
| `VBATechnologie horlogère.pdf` | francés | Versión equivalente traducida |

Los manuales incluyen:

- instalación del complemento en Excel, OpenOffice y LibreOffice;
- uso de Solver;
- unidades esperadas;
- código de las funciones;
- ejemplos resueltos;
- ejercicios de diseño, energía, fiabilidad, metrología y calidad.

Son útiles como documentación de intención, pero no sustituyen la comprobación dimensional ni la fuente científica de cada ecuación.

### 3.2 Libros Excel

Prioridad:

- **A**: candidato directo para el futuro núcleo de ingeniería;
- **B**: útil como laboratorio, plantilla o módulo complementario;
- **C**: referencia histórica o específica; no trasladar como regla general.

| Archivo | Contenido real | VBA | Prioridad | Recomendación |
|---|---|---:|---:|---|
| `ctm.xlsx` | Evaluación CTM/DIN 8312 a partir de posiciones, 0 h, 24 h y temperatura | no | B | Laboratorio futuro de marcha y estabilidad; verificar edición y significado normativo |
| `Doppelkurve.xlsm` | Cálculo geométrico de curva terminal de espiral y desplazamiento de puntos de fijación | sí | A | Reimplementar como geometría paramétrica y visualización 2D/3D |
| `Eingriffsnormen.xlsx` | Tablas de módulos y perfiles de engrane NHS/NIHS/ETA | no | A/C | Muy útil para contraste; no convertir sus tablas en estándar vigente sin verificar edición |
| `Federbalken_p.xlsm` | Viga elástica para microresortes, fuerza, deflexión, tensiones y módulo elástico | no | A | Base para resortes de báscula, tirete y otras láminas; añadir dominio de validez y tensión admisible |
| `FMEA.xlsx` | Plantilla FMEA con severidad, ocurrencia, detección y RPN | no | B | Incorporar el flujo de análisis, no los valores de ejemplo como verdad |
| `Formeln.xlam` | Complemento principal con 57 funciones | sí | A | Corpus central de fórmulas; nunca cargar el complemento desde la aplicación |
| `Formeln.xls` | Versión heredada del mismo complemento | sí | C | Conservar para comparación; el cuerpo matemático coincide con `xlam` |
| `Hertzsche Pressung 1.2 7750.xlsm` | Tren completo de 7750: fuerzas, apoyos, presión de Hertz, fricción, eficiencia y coordenadas | sí | A/C | Reutilizar el modelo de cálculo; no adoptar la geometría 7750 como genérica ni como dato MIYOTA |
| `Histogramm cp cpk.xlsx` | Histograma, distribución normal y capacidad Cp/Cpk con ejemplo 7750 | no | B | Laboratorio de metrología; sustituir funciones Excel heredadas y aleatoriedad no reproducible |
| `ISO Tabelle 286.xlsx` | Subconjunto estático de ajustes ISO 286/NIHS 04-01 hasta 50 mm | no | A/C | Útil para prototipo de selector de ajustes; verificar valores y edición antes de validar ingeniería |
| `Mittentoleranz_p.xlsx` | Conversión de tolerancia asimétrica a dimensión centrada | no | A | Cálculo sencillo y de gran utilidad en el editor dimensional |
| `N_Umgänge.xlsm` | Número de vueltas y ocupación del muelle en el barrilete | sí | A | Integrar tras verificar normalización, espesor y separación entre láminas |
| `Oring1.3.xlsm` | Compresión nominal, mínima y máxima de junta tórica | sí | A | Base para geometría de garganta; no usar como certificación de estanqueidad |
| `Qualifikationsanforderungen.xlsm` | Matriz de requisitos técnicos con normas y criterios empresariales IWC/Richemont | sí | C | Tomar la idea de matriz de requisitos; descartar valores empresariales como reglas universales |
| `Reliability.xlsm` | Exponencial, Weibull, probabilidad y comportamiento de fallo | sí | B/C | No integrar sus funciones actuales: contienen errores matemáticos |
| `Schild_Methode.xlsm` | Masa, centro de gravedad, inercia y ángulo de frenado de masa oscilante | sí | A | Muy útil para el diseñador de rotor automático |
| `Schild_Methode_Schnitt.xlsx` | Variante por secciones de la masa oscilante | no | A | Buen caso de referencia y validación cruzada sin VBA |
| `SE_boudin.xlsx` | Coordenadas de una espiral/boudin por radio, paso y vueltas | no | A | Alimentar geometría paramétrica y visualización |
| `SE_Spirale.xlsx` | Coordenadas de espiral de Arquímedes | no | A | Alimentar el generador de espiral conceptual y de diseño preliminar |
| `Spiel Passung.xlsx` | Ajustes con juego, interferencia y juego axial para piezas relojeras | no | A | Uno de los materiales más útiles para montaje, rubíes, pivotes, barrilete y puentes |
| `standwn.xlsx` | Protocolo de medición, media, desviación, Cp/Cpk y distribución | no | B/C | Reutilizar la estructura de estudio de medición; eliminar datos de proveedor y ejemplo |
| `Toleranzrechnung.xlsx` | Cadenas de cotas, peor caso y aproximación estadística 6σ | no | A | Complementa directamente el Monte Carlo y peor caso ya existentes |
| `VBA Formeln verwenden.xlsx` | Ejercicios de energía, inercia, muelle y volante que dependen de `Formeln.xlam` | no | B | Convertir en casos de prueba después de corregir el vínculo y verificar resultados |
| `Verformung Glas1.1.xlsm` | Flexión de fondo y cristal por presión | sí | A | Útil como predicción preliminar; no equivale a resistencia ni estanqueidad certificadas |
| `Zuverlässigkeit.xlsx` | Cinco ejercicios de vida, MTBF, fallo y mantenimiento | no | B | Buen material pedagógico después de corregir el modelo de fiabilidad |

## 4. Seguridad y portabilidad

### 4.1 Resultado

- Windows Defender no detectó amenazas en el ZIP.
- La inspección de fuente y p-code no encontró:
  - comandos de sistema;
  - PowerShell o `cmd.exe`;
  - descarga o comunicación de red;
  - escritura destructiva de archivos;
  - modificación del proyecto VBA;
  - ejecución de procesos externos.
- Los eventos automáticos localizados modifican menús heredados de Excel, muestran el antiguo Assistant y eliminan el menú al cerrar.

No hay indicios de malware, pero eso no convierte el paquete en una dependencia de ejecución aceptable.

### 4.2 Riesgos técnicos

| Riesgo | Estado | Tratamiento |
|---|---|---|
| VBA con `Workbook_Open`, `Activate` y `BeforeClose` | presente en complemento y simulador | No ejecutar ni distribuir como parte del runtime |
| Firmas VBA | cuatro, autofirmadas y caducadas en 2016/2017 | No tratarlas como cadena de confianza |
| Objetos OLE | 32 objetos de Microsoft Equation | No incrustarlos ni abrirlos desde la aplicación |
| Vínculo externo | un vínculo absoluto al `Formeln.xlam` del equipo del autor | Eliminar al crear casos propios |
| Funciones Excel heredadas | `NORMDIST`, `NORMINV`, `STDEVP` y otras | Reimplementar con API moderna y pruebas |
| Aleatoriedad | hojas de Cp/Cpk con `RAND` | Usar semilla explícita y ejecuciones reproducibles |
| Dependencia de Excel | fórmulas definidas por complemento y Solver | Sustituir por funciones puras y un solver propio |
| Idioma | alemán y francés | Crear interfaz y documentación en español; conservar nombres originales como alias |

La recomendación de seguridad es **importar conocimiento, no ejecutables**.

## 5. Hallazgos matemáticos que impiden copiar el VBA

La colección contiene fórmulas valiosas, pero la revisión detectó incompatibilidades concretas.

### 5.1 Energía e inercia

`pr_iw` calcula potencia a partir de inercia usando un factor `1/1000`. Su inversa `Ibal` utiliza `10000`. Por tanto, ambas no son inversas entre sí y difieren por un factor diez.

Además:

- el módulo principal usa `Ibal × 10000`;
- el módulo incrustado en `N_Umgänge.xlsm` usa `Ibal × 1000`;
- `Qbal` vuelve a utilizar `10000`.

Antes de implementar hay que fijar unidades SI, derivar la conversión `mg·cm² ↔ kg·m²` y escoger una sola ecuación validada.

### 5.2 Espiral

`I_bal` convierte el resultado a `mg·cm²` con un factor `10.000.000`. La función inversa `h_sp`, que recupera la altura de la espiral, no deshace ese factor. Tal como está escrita, no es dimensionalmente inversa y puede producir una diferencia de siete órdenes de magnitud.

`L_sp` es una aproximación basada en la circunferencia media; no es la longitud integral exacta de una espiral de Arquímedes. Puede servir como estimación si se declara como tal.

### 5.3 Fiabilidad y Weibull

Para `b ≥ 1`, `Fy` usa:

```text
1 - exp((-t/T)^b)
```

Con `b = 2`, el exponente se vuelve positivo. La hoja oculta el signo mediante `ABS`, pero obtiene `exp((t/T)²)-1`, no la CDF Weibull `1-exp(-(t/T)²)`. El resultado puede superar 1.

`aw` presenta el mismo problema de signo y no contiene todos los factores de la densidad Weibull general. `wb` parece representar la tasa de riesgo, pero su nombre y etiqueta son ambiguos.

Estas funciones deben descartarse y reescribirse desde la definición estadística.

### 5.4 Normalización del muelle

`Nmax_x` declara `e1=e/R`, `l1=L/R` y `r1=r/R`, pero suma directamente `X`, documentado como `0,002 mm`, a `e1`. El libro independiente usa un `X1` normalizado. La interfaz del complemento es, como mínimo, ambigua y no debe exponerse sin resolver si `X` es longitud o magnitud adimensional.

### 5.5 Modelos empíricos o de alcance limitado

Necesitan hipótesis explícitas:

- presión de Hertz: geometría de contacto, apoyos, material, rugosidad y lubricación;
- flexión de cristal y fondo: placa delgada, apoyo, pequeñas deformaciones y elasticidad lineal;
- espesor de fondo `e_b`: relación empírica;
- compresión de O-ring: no incluye relleno de garganta, extrusión, material, envejecimiento, temperatura ni ensayo;
- eficiencia del tren: no es constante universal;
- fórmulas de diámetro de volante y calibre 20.3: relaciones empíricas específicas;
- tablas de perfiles y ajustes: edición y autoridad pendientes de verificar.

## 6. Encaje con la arquitectura actual

### 6.1 Lo que ya existe y facilita la adopción

Watch Prototype Lab ya separa:

- simulación educativa y evaluación de ingeniería;
- dato oficial, diseñado, medido, estimado y desconocido;
- geometría, montaje, cinemática, dinámica, tolerancias y fabricación;
- resultados reversibles y mutaciones explícitamente aceptadas;
- fuentes y fiabilidad.

También existen:

- geometría cicloidal e involuta en `src/core/gears.ts`;
- dinámica preliminar en `src/core/dynamics.ts`;
- automático en `src/core/automatic.ts`;
- Monte Carlo y peor caso en `src/core/tolerance.ts`;
- cálculos estrictamente educativos en `src/learning/mechanical/calculations.ts`;
- los niveles futuros 4–8 en `src/learning/academy/watchmakerJourney.ts`.

El paquete no obliga a rehacer la aplicación. Aporta el contenido que falta para profundizar esos contratos.

### 6.2 Carencias que hay que resolver antes de integrarlo

El `Dimension` actual solo admite:

```text
mm, deg, h, vph, count
```

Este material necesita, entre otras magnitudes:

- fuerza;
- par;
- presión y tensión;
- módulo elástico;
- masa y densidad;
- momento de inercia;
- energía y potencia;
- frecuencia;
- temperatura;
- tiempo de vida;
- probabilidad y tasas;
- magnitudes adimensionales con significado.

No conviene ampliar `Dimension` de forma indiscriminada porque mezcla cotas geométricas con variables físicas. Es preferible añadir un modelo paralelo de cantidades de ingeniería.

## 7. Arquitectura recomendada

### 7.1 Núcleo de cantidades

Crear en el futuro un contrato equivalente a:

```text
EngineeringQuantity
  value
  unit
  physicalDimension
  uncertainty
  distribution
  quality
  source
```

Debe:

- convertir unidades mediante una capa central;
- rechazar combinaciones dimensionalmente incompatibles;
- mantener valor interno en SI o en una base canónica explícita;
- conservar el valor y unidad introducidos por la persona;
- diferenciar `ratio`, `coefficient` y `count`, aunque todos sean adimensionales.

### 7.2 Registro de fórmulas

Cada cálculo necesita:

```text
EngineeringFormulaDefinition
  id
  version
  titleEs
  equation
  inputs
  output
  assumptions
  validRange
  sourceIds
  verificationStatus
  fidelity
  limitations
```

Estados recomendados:

- `reference-only`;
- `dimensionally-checked`;
- `independently-verified`;
- `calibrated`;
- `rejected`;
- `superseded`.

### 7.3 Ejecución reproducible

Cada ejecución debe producir:

- fórmula y versión;
- entradas y unidades;
- valores convertidos;
- resultado;
- advertencias de dominio;
- fuentes;
- incertidumbre;
- clasificación:
  - cálculo educativo;
  - predicción de ingeniería;
  - comparación con medición;
  - validación aceptada;
- hash del registro.

Un resultado no debe modificar automáticamente un proyecto. La persona debe poder **aplicar el valor al diseño**, ver qué cambia y deshacerlo.

### 7.4 Separación de motores

Mantener tres capas:

1. **Educativa**: explica y permite manipular sin afirmar validez física.
2. **Ingeniería preliminar**: calcula con unidades, hipótesis, dominio y confianza.
3. **Validación**: compara con fuente independiente, CAD exacto, ensayo o medición.

Los Excel pueden alimentar las dos primeras como referencia; por sí solos no elevan un resultado a la tercera.

## 8. Integración recomendada por producto

### 8.1 Estudio

Añadir, por fases, paneles contextuales:

- barrilete y muelle real;
- tren, centros, perfiles, cargas y apoyos;
- escape, energía e inercia del volante;
- espiral, frecuencia y curva terminal;
- rotor automático;
- ajustes, juegos y cadenas de cotas;
- junta, fondo y cristal;
- fiabilidad y capacidad de proceso.

Cada panel debe:

- reaccionar a la pieza seleccionada;
- mostrar fórmula, unidades, supuestos y fuente;
- reflejar el efecto en la geometría cuando proceda;
- advertir si una entrada es estimada;
- producir una propuesta reversible, no una mutación silenciosa.

### 8.2 Viewport y CAD

El material permite nuevas visualizaciones:

- contacto real de ruedas y variación de centros;
- mapas de carga de pivotes;
- presión y margen por apoyo;
- ocupación del muelle en el barrilete;
- espiral paramétrica y curva terminal;
- centro de masa y par del rotor;
- bandas de tolerancia y envolventes de peor caso;
- compresión de junta;
- deformación amplificada de cristal y fondo.

Estas visualizaciones deben declarar el modelo utilizado. Una deformación amplificada o un mapa de presión no es un ensayo.

### 8.3 Academia

El paquete encaja especialmente en la ruta maestra:

| Nivel futuro | Aporte del paquete |
|---|---|
| 4. Matemáticas, física y metrología | unidades, energía, inercia, estadística, tolerancias, Cp/Cpk y fiabilidad |
| 5. Diseño de movimiento | muelle, barrilete, tren, Hertz, espiral, volante y rotor |
| 6. CAD y fabricación | perfiles, ajustes, cadenas de cotas, microresortes, O-ring, fondo y cristal |
| 7. Prototipo y validación | CTM, protocolos de medición, FMEA, fiabilidad y control de proceso |
| 8. Proyecto integral | requisitos, presupuestos físicos, márgenes, evidencias y dossier de diseño |

No conviene presentar los manuales como curso. Deben transformarse en una progresión:

```text
significado físico
→ unidades
→ caso resuelto
→ cálculo guiado
→ manipulación visual
→ problema sin ayuda
→ comparación con otro diseño
→ medición o validación cuando exista
```

Los 49 problemas son candidatos a banco de ejercicios, no exámenes válidos hasta comprobar sus soluciones.

### 8.4 Informes y cuaderno

Los resultados deberían formar un cuaderno técnico por proyecto:

- objetivo;
- fórmula;
- entradas;
- resultado;
- sensibilidad;
- margen;
- fuente;
- estado de verificación;
- decisión de diseño;
- evidencia posterior.

Esto conecta la Academia con un reloj propio sin confundir el proyecto educativo con el proyecto técnico.

## 9. Relación con MIYOTA

Este paquete **no es una fuente de MIYOTA**.

- Su contenido es ingeniería relojera general.
- Un libro usa ETA 7750 como caso de simulación.
- No contiene planos, piezas, dimensiones ni instrucciones oficiales de MIYOTA 2035 o 8215.

Política recomendada:

- MIYOTA 2035/8215: identidad y datos solo desde página y PDF oficiales de MIYOTA;
- `VBAUhrentechnik`: fórmulas generales, métodos de cálculo y ejercicios;
- al aplicar una fórmula a MIYOTA, cada entrada debe conservar su fuente MIYOTA, medida, estimada o desconocida;
- nunca inferir una dimensión MIYOTA desde el ejemplo 7750.

## 10. Compatibilidad y persistencia

La incorporación futura no debe romper `.wplab` ni proyectos existentes.

Recomendación:

- no sustituir de inmediato `Dimension`;
- añadir un contrato versionado de cálculo de ingeniería;
- hacer opcionales sus registros;
- migrar solo cuando un proyecto use una magnitud nueva;
- guardar resultados derivados de forma separable o regenerable;
- conservar fórmula, versión y entradas para recalcular después de una actualización;
- marcar como obsoleto un resultado si cambia la versión de la fórmula;
- permitir abrir proyectos anteriores sin ejecutar ningún cálculo nuevo.

## 11. Orden de adopción recomendado

### Fase 0 — Registro privado

- registrar ZIP, hash, autor, URL y fecha;
- mantener los originales fuera del runtime;
- indexar manuales, libros, hojas, funciones y ejercicios;
- no ejecutar macros.

### Fase 1 — Cimientos

- cantidades y unidades;
- registro de fórmulas;
- dominio de validez;
- trazabilidad;
- runner determinista;
- pruebas dimensionales y de propiedades.

Esta fase es bloqueante para usar el material con autoridad de ingeniería.

### Fase 2 — Movimiento mecánico

Orden recomendado:

1. barrilete, longitud y vueltas;
2. relaciones, energía y potencia;
3. inercia de volante y espiral;
4. rotor automático;
5. presión de apoyos y pérdidas.

Motivo: cubre el nivel 5 y reemplaza simplificaciones ya visibles en el motor actual.

### Fase 3 — Tolerancias y fabricación

1. tolerancia centrada;
2. cadenas de cotas;
3. ajustes y juegos;
4. ISO/NIHS verificados;
5. microresortes;
6. O-ring;
7. fondo y cristal.

### Fase 4 — Calidad y validación

- medición;
- Cp/Cpk;
- CTM;
- FMEA;
- fiabilidad y mantenimiento con funciones Weibull corregidas.

### Fase 5 — Academia

Crear contenido únicamente después de que cada fórmula utilizada tenga:

- significado y unidades;
- caso resuelto verificado;
- límites;
- visualización coherente;
- prueba automatizada;
- clasificación educativa o de ingeniería.

## 12. Criterios de aceptación futuros

Una fórmula procedente de este paquete no debería entrar en producción hasta cumplir:

1. ecuación legible y versionada;
2. unidades de entrada y salida explícitas;
3. análisis dimensional correcto;
4. dominio de validez;
5. manejo de cero, negativos, límites y valores no finitos;
6. segunda fuente independiente o derivación documentada;
7. al menos un caso normal, uno límite y uno inválido;
8. comparación con el Excel guardado;
9. explicación de cualquier divergencia;
10. prueba automatizada;
11. procedencia visible;
12. resultado separado entre educación, predicción y validación.

## 13. Decisión por clase de material

| Clase | Decisión |
|---|---|
| Manuales y ejercicios | Incorporar al registro privado y usar como referencia |
| Fórmulas VBA | Reimplementar selectivamente después de verificar |
| Casos guardados | Usar como vectores candidatos, no como oráculo único |
| Hojas de diseño | Recrear como paneles nativos y accesibles |
| Macros | No ejecutar ni integrar |
| Objetos OLE | No integrar |
| Datos 7750 | Mantener como ejemplo específico y no transferir a MIYOTA |
| Tablas normativas | Verificar edición antes de uso técnico |
| Plantillas IWC/Richemont | Usar solo como inspiración de flujo |
| Fiabilidad VBA actual | Rechazar y corregir antes de cualquier uso |

## 14. Conclusión

`VBAUhrentechnik.zip` es uno de los materiales más útiles recibidos hasta ahora para avanzar desde una Academia de fundamentos hacia una herramienta capaz de acompañar el diseño de un reloj mecánico.

La decisión recomendada es **incorporarlo al plan completo, pero mediante una migración de conocimiento, no una integración de Excel**.

Su mejor función en el proyecto es triple:

1. catálogo inicial de problemas de ingeniería relojera;
2. fuente de casos y visualizaciones para los niveles 4–8;
3. contraste para profundizar los solvers actuales.

La adopción debe comenzar por unidades, contratos y verificación. Empezar por copiar las macros produciría una herramienta aparentemente avanzada, pero con errores silenciosos, dependencias heredadas y una autoridad técnica que los archivos no pueden sostener por sí solos.
