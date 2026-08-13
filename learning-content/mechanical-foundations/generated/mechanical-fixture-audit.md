# Auditoría del fixture mecánico conceptual · Sistema 4E

Fecha: 2026-07-27

## Hallazgo ejecutivo

El fixture previo `fixture.conceptual.mechanical-chain` tenía 14 instancias, 14 primitivas, 15 relaciones y 15 selectores. Era suficiente para una cadena funcional G1/K2/P0, pero no para un laboratorio completo: tren agrupado, barrilete agrupado, escape sin fases, oscilador sin parámetros, y automático/calendario ausentes.

Sistema 4E no eleva artificialmente ese fixture. Añade una capa educativa separada con 30 entidades, 12 relaciones cinemáticas y 9 tramos energéticos. El modelo sigue siendo conceptual.

## Entidades de partida

| ID | Nombre | Instancias | Geometría | Relaciones | R | G/K/P | Limitaciones |
|---|---|---:|---:|---:|---|---|---|
| `pd_fixture-conceptual-mecha_36ttu2uh4oigx` | Caja conceptual | 1 | 1 | 1 | R1 | G1/K2/P0 | Envolvente educativa; no representa una caja fabricable. |
| `pd_fixture-conceptual-mecha_3gjflk3ilnsdv` | Esfera conceptual | 1 | 1 | 1 | R1 | G1/K2/P0 | Disco educativo sin dimensiones ni grafismo nominales. |
| `pd_fixture-conceptual-mecha_1i95e3tus6zqz` | Aguja horaria conceptual | 1 | 1 | 1 | R1 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_37dh6la0z74xp` | Aguja minutera conceptual | 1 | 1 | 1 | R1 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_34r01wx0hwput` | Muelle real conceptual | 1 | 1 | 2 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_3p0xuvt2ogk81` | Barrilete conceptual | 1 | 1 | 3 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_1ap13e0fx9z7d` | Tren conceptual | 1 | 1 | 4 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_2gvmbgnknqtq8` | Rueda de escape conceptual | 1 | 1 | 3 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_03pmdi5sk7lem` | Áncora conceptual | 1 | 1 | 3 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_2x3yithvcvkvv` | Volante conceptual | 1 | 1 | 2 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_045majziiv1kg` | Espiral conceptual | 1 | 1 | 1 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_0qi44wmmjfakl` | Puesta en hora conceptual | 1 | 1 | 1 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_0s2j7xmmovnog` | Minutería conceptual | 1 | 1 | 6 | R2 | G1/K2/P0 | Sin limitación adicional. |
| `pd_fixture-conceptual-mecha_0r0h1frs34h0z` | Indicación conceptual | 1 | 1 | 1 | R2 | G1/K2/P0 | Sin limitación adicional. |

## Aptitud inicial por módulo

| Módulo | Estado previo | Hallazgo |
|---|---|---|
| energy | parcial | El fixture base contiene muelle, barrilete y cadena; el laboratorio añade bloqueo y energía normalizada. |
| barrel | parcial | El fixture base agrupa el barrilete; el laboratorio separa árbol, tambor, tapa y brida conceptual. |
| gear-pair | no representable antes de 4E | No existían dientes editables ni cálculo de relación. |
| train | parcial | Existía un marcador de tren, no etapas editables. |
| supports | no representable antes de 4E | No había pivotes, rubíes o grados de libertad conceptuales. |
| escapement | parcial | Existían rueda y áncora, sin ocho fases ni paso a paso. |
| oscillator | parcial | Existían volante y espiral, sin frecuencia y amplitud independientes. |
| integration | parcial | La cadena funcional existía como relaciones, no como laboratorio coordinado. |
| motion-works | parcial | Existía una entidad agrupada sin relación editable ni indicación horaria. |
| keyless | parcial | Existía una entidad agrupada sin estados de corona. |
| automatic | ausente | El conceptual base no contenía automático. |
| calendar | ausente | El conceptual base no contenía calendario. |

## MIYOTA 8215 como ejemplo

El fixture `fixture.miyota.8215.structural` contiene 63 instancias y 32 relaciones, en R2/G2/K2/P0. Puede ilustrar subsistemas documentados, pero no recibe dientes, relaciones, movimiento, pérdidas, tolerancias o diagnóstico del conceptual.

## Carencias que permanecen

- perfiles de diente y distancia entre centros físicos;
- tensión y curva de par de un muelle real;
- holguras y apoyos medidos;
- ángulos y contactos validados del escape;
- dinámica de volante y espiral;
- conteos de dientes y cinemática específicos del 8215;
- draw calls y memoria GPU;
- desmontaje, montaje, lubricación y servicio del 8215.
