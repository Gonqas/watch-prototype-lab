# Academia — ingeniería relojera transversal y cuaderno técnico

Fecha: 2026-07-29  
Estado: primera base ejecutable, versionada y probada  
Objetivo de producto: aprender relojería de forma general hasta poder justificar y desarrollar un reloj propio  
Ámbito de MIYOTA: casos documentales disponibles, no eje exclusivo del currículo ni del motor

## 1. Decisión de producto

La Academia no se organiza alrededor de MIYOTA. Se organiza alrededor de conocimientos y capacidades transferibles:

1. comprender el reloj completo;
2. reconocer funciones, piezas, interfaces y relaciones;
3. leer y comparar calibres reales de cualquier fabricante;
4. desmontar, montar, observar, medir y diagnosticar;
5. dominar matemáticas, física, materiales, metrología y tolerancias;
6. dimensionar una arquitectura;
7. convertirla en piezas y planos;
8. fabricar, montar, medir e iterar un prototipo;
9. defender un proyecto integral de reloj propio.

MIYOTA 2035 y 8215 permanecen como casos útiles porque existe documentación oficial accesible. No definen el canon, las fórmulas, los selectores, las competencias ni el itinerario completo. Un calibre de ETA, Sellita, Seiko, Citizen, un movimiento histórico, un movimiento conceptual o un diseño propio deben poder usar los mismos contratos.

## 2. Qué se ha implementado

### 2.1 Laboratorio de ingeniería

Nueva superficie:

```text
#/learning/engineering
```

También es accesible desde:

- la navegación de Academia, grupo «Practicar»;
- la portada de Academia;
- los niveles 4 y 5 de la ruta hacia un reloj propio;
- el inspector de Ingeniería de Estudio, conservando el ID de proyecto en la URL.

El laboratorio contiene seis estaciones:

| Estación | Pregunta que permite estudiar | Clasificación |
|---|---|---|
| Tren de ruedas | relación compuesta, velocidad, sentido y centros nominales | predicción preliminar |
| Volante y espiral | rigidez torsional ideal a partir de inercia y cadencia | predicción preliminar |
| Muelle real | efecto de sección, longitud y vueltas sobre rigidez, par y energía | predicción preliminar |
| Cadenas de cotas | diferencia entre peor caso y RSS | predicción preliminar |
| Metrología | Cp, Cpk, centrado y suficiencia muestral | definición contrastada |
| Fiabilidad | R(t), F(t), riesgo acumulado y tasa Weibull | definición contrastada |

Cada estación obliga visualmente a seguir:

```text
predecir
→ calcular
→ interpretar
→ contrastar y decidir si guardar
```

No se presenta una calculadora desnuda como aprendizaje. Antes de las entradas se explica el modelo mental y después se muestran fórmula, hipótesis, límites, estado de verificación y fuente.

### 2.2 Cantidades físicas tipadas

Se ha creado un modelo paralelo a `WatchProject.Dimension`:

```text
EngineeringQuantity
  value
  unit
  dimension
  provenance
  sourceId?
```

No se amplía indiscriminadamente `Dimension`, porque una cota geométrica y una variable física no tienen el mismo ciclo de vida.

Magnitudes iniciales:

- longitud;
- ángulo;
- tiempo;
- frecuencia;
- fuerza;
- par;
- presión o tensión;
- masa;
- densidad;
- momento de inercia;
- segundo momento de área;
- energía;
- potencia;
- temperatura;
- probabilidad;
- tasa;
- razón adimensional;
- conteo.

Unidades iniciales incluyen SI y unidades habituales en relojería: `mm`, `µm`, `N·mm`, `N/mm²`, `mg·cm²`, `µJ`, horas y alternancias por hora.

La capa:

- convierte mediante una base canónica;
- rechaza conversiones entre magnitudes distintas;
- rechaza valores no finitos;
- conserva la unidad introducida;
- marca el resultado como `derived`;
- prueba explícitamente `mg·cm² ↔ kg·m²` y `A/h ↔ Hz`.

Esto corrige la ambigüedad de factores 1.000/10.000 observada en el paquete VBA.

### 2.3 Fórmulas versionadas

Cada fórmula declara:

```text
id
version
title
expression
level
verification
assumptions
limitations
sourceIds
```

Cada ejecución conserva:

```text
schemaVersion
id determinista por fórmula, versión, entradas y salidas
createdAt
inputs con unidades y procedencia
outputs derivados
dominio
avisos
hipótesis
límites
fuentes
clasificación
```

El identificador de ejecución sirve para deduplicación y trazabilidad local. No se presenta como hash criptográfico.

Estados de nivel:

- `educational`;
- `engineering-preview`;
- `engineering-validated`.

La base actual no emite resultados `engineering-validated`.

Estados de verificación:

- `dimensionally-checked`;
- `source-reviewed`;
- `experimentally-validated`.

La base actual usa los dos primeros. No afirma calibración experimental.

### 2.4 Cuaderno técnico por proyecto

El laboratorio guarda hasta 250 ejecuciones por ámbito:

```text
wplab.engineering-notebook.v1:<projectId>
```

El ID procede de:

- el proyecto de Estudio cuando se abre desde su inspector;
- el perfil local de Academia cuando se abre como estudio independiente.

El cuaderno:

- funciona sin conexión;
- deduplica ejecuciones idénticas;
- permite eliminar un registro;
- exporta JSON versionado;
- no muta `WatchProject`;
- no se incrusta todavía en `.wplab`;
- puede recalcularse porque conserva fórmula, versión y entradas.

La separación es deliberada: aprender o explorar una hipótesis no cambia un diseño. Aplicar un resultado al proyecto requerirá en el futuro una propuesta explícita, una previsualización de diferencias y deshacer.

## 3. Fórmulas iniciales y autoridad

### 3.1 Oscilador torsional

```text
f = (1 / 2π) √(κ / I)
A/h = 7200 f
```

Uso: relación ideal entre inercia, rigidez y cadencia.

No demuestra:

- isocronismo;
- marcha;
- efecto de amplitud;
- curva terminal;
- influencia del escape;
- temperatura, gravedad, magnetismo o choque.

Estado: coherencia dimensional y cálculo directo/inverso probado.

### 3.2 Tren de engranajes compuesto

```text
i = Π(Z_conductora / Z_conducida)
n_salida = n_entrada i
a = m(Z₁ + Z₂) / 2
```

Uso: estudiar la propagación de relaciones, sentidos y centros nominales sin depender de un calibre.

No comprueba perfil, interferencia, número mínimo de dientes, depthing, contacto, cargas, pérdidas o fabricabilidad.

### 3.3 Muelle rectangular lineal

```text
I = h e³ / 12
κ = E I / L
M = κ θ
U = ½ κ θ²
```

Uso: comparación preliminar de sensibilidad.

No modela precurvado, espiras en contacto, brida deslizante, histéresis, fatiga ni curva real de par. No libera un muelle a fabricación.

Estado: coherencia dimensional probada; segunda fuente y calibración pendientes.

### 3.4 Cadenas lineales

```text
T_wc = Σ |Tᵢ|
T_rss = √Σ Tᵢ²
```

RSS solo se interpreta bajo independencia, centrado y contribuciones aleatorias compatibles. No sustituye un modelo geométrico ni una simulación de montaje.

### 3.5 Capacidad de proceso

```text
Cp  = (USL - LSL) / 6s
Cpk = min((USL - μ) / 3s, (μ - LSL) / 3s)
```

Fuente primaria: [NIST/SEMATECH, Process Capability](https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm).

El runtime advierte con menos de 50 observaciones. Cp/Cpk presupone proceso estable, observaciones independientes y distribución aproximadamente normal.

### 3.6 Weibull de dos parámetros

```text
R(t) = exp(-(t/η)^β)
F(t) = 1 - R(t)
h(t) = (β/η)(t/η)^(β-1)
```

Fuente primaria: [NIST/SEMATECH, Weibull](https://www.itl.nist.gov/div898/handbook/apr/section1/apr162.htm).

La implementación sustituye las funciones Weibull defectuosas del VBA. Las pruebas comprueban que las probabilidades permanecen acotadas. El cálculo no estima `β` o `η`; introducir parámetros sin datos no genera evidencia de fiabilidad.

## 4. Política de fuentes neutral respecto a marcas

La autoridad se decide por el tipo de afirmación:

| Afirmación | Fuente adecuada |
|---|---|
| identidad, dimensiones o instrucción de un calibre | documentación oficial de ese fabricante |
| teoría y método de cálculo | texto técnico, norma o fuente científica aplicable |
| estado de una unidad física | observación o medición de esa unidad |
| geometría diseñada | proyecto técnico y revisión |
| resultado calculado | fórmula, versión, entradas, hipótesis y dominio |
| validación | fuente independiente, CAD exacto, ensayo o medición |

El libro privado de construcción mecánica y `VBAUhrentechnik` son fuentes generales. No son fuentes de MIYOTA. Los PDF de MIYOTA son fuentes específicas de sus calibres y no reglas universales de diseño.

## 5. Ruta maestra actualizada

| Nivel | Estado actual | Función de MIYOTA |
|---|---|---|
| 1. Lenguaje y lectura funcional | disponible | ejemplo entre otros |
| 2. Arquitectura mecánica | disponible | no necesario |
| 3. Lectura comparada de calibres | base disponible | primer caso documentado |
| 4. Matemáticas, física y metrología | laboratorio inicial disponible | ninguna dependencia |
| 5. Diseño de tren, escape y oscilador | base de tren ideal y oscilador disponible; curso incompleto | posible caso de contraste |
| 6. CAD, tolerancias, materiales y fabricación | Estudio dispone de herramientas; curso pendiente | ninguna dependencia |
| 7. Prototipo y validación física | pendiente | posible donante o caso |
| 8. Reloj propio | pendiente | ninguna dependencia |

La portada y el onboarding ya expresan objetivos generales: cálculo, metrología, comparación de calibres y diseño propio. Las opciones de orientación ya no convierten 2035 y 8215 en metas por defecto.

## 6. Integración con Estudio

El inspector de Ingeniería incluye un acceso al laboratorio con:

```text
project=<WatchProject.id>
name=<WatchProject.name>
```

Esto establece el ámbito del cuaderno sin modificar el proyecto. El siguiente paso de integración —no implementado silenciosamente— será:

1. seleccionar una salida compatible;
2. comparar con el valor actual y su procedencia;
3. mostrar qué capas y hallazgos cambiarían;
4. pedir confirmación;
5. crear una operación reversible;
6. conservar el vínculo con la ejecución del cuaderno.

## 7. Compatibilidad

- `WatchProject` permanece en esquema 5.
- `Dimension` conserva sus unidades actuales.
- `.wplab` no cambia.
- Las bases educativas existentes no requieren migración.
- Los registros de cálculo viven en un namespace local nuevo.
- La superficie funciona offline con código y datos instalados.
- Los enlaces externos a fuentes requieren conexión, pero el cálculo no.
- MIYOTA 2035/8215 y los cuatro paquetes declarativos existentes siguen funcionando.

## 8. Pruebas

Se han añadido pruebas para:

- conversión de inercia sin factor diez;
- conversión de alternancias por hora;
- coherencia entre cálculo directo e inverso del oscilador;
- relación, sentido y centros nominales de un tren compuesto;
- Weibull acotada y contrastada;
- separación de peor caso y RSS;
- Cp/Cpk y aviso muestral;
- salida preliminar trazable de muelle real;
- persistencia aislada por proyecto;
- eliminación de ejecuciones.

## 9. Deuda explícita

La base es útil, pero no equivale todavía a la academia completa de construcción relojera. Próximas ampliaciones prioritarias:

1. perfiles, interferencia, contacto, cargas y pérdidas del tren, con problemas graduados;
2. balance de energía desde muelle hasta escape con eficiencias no universales;
3. geometría y seguridad del escape;
4. espiral, curva terminal, isocronismo y sensibilidad;
5. barrilete real, ocupación y brida;
6. apoyos, pivotes, rubíes, presión y lubricación, sin fingir validación;
7. ajustes, juegos, ISO/NIHS con edición y autoridad verificadas;
8. rotor, centro de masa y remontuar automático;
9. fondo, cristal, junta y estanqueidad preliminar;
10. metrología de marcha, incertidumbre, repetibilidad y reproducibilidad;
11. FMEA, requisitos y dossier de diseño;
12. proyectos guiados multimarca y finalmente un movimiento propio.

Cada ampliación deberá repetir el mismo contrato: explicación previa, unidades, caso resuelto, cálculo guiado, problema independiente, transferencia, fuente, límites, prueba y evidencia honesta.
