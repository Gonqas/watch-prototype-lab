# ADR-002 — Canon técnico v6 general y aditivo

- Estado: Aceptada
- Fecha: 2026-07-22
- Sistemas afectados: modelo técnico, importación, serialización, selectores de escena, donantes, ensamblajes y persistencia futura.

## Contexto

El esquema v5 describe un reloj paramétrico mediante categorías cerradas y agregados. No puede identificar dos tornillos iguales, topologías arbitrarias ni dependencias de montaje. Migrarlo de golpe pondría en riesgo proyectos y consumidores existentes.

## Decisión

Se define un canon v6 multimarca basado en definiciones, instancias, ensamblajes, interfaces y dependencias. Sus seis clases de ID llevan marca y prefijo, son serializables y estables. Las categorías son cadenas abiertas; el estado `known`, `placeholder` o `unknown` evita convertir ausencia de datos en hechos.

El proyecto técnico sigue siendo la única verdad física. Una sesión educativa solo mantiene un overlay reversible. v6 es aditivo: v5 continúa siendo el formato operativo y un adaptador de lectura puro crea una proyección v6 con IDs sintéticos deterministas. Abrir o visualizar v5 no persiste ni actualiza nada. Solo se deberá persistir v6 cuando existan entidades o relaciones no expresables sin pérdida en v5.

Las dependencias forman un orden parcial acíclico. Borrado, sustitución y trasplante deben preservar referencias o rechazar la operación; no se permiten huérfanos silenciosos.

## Alternativas consideradas

- Ampliar las uniones cerradas de v5: cambio pequeño, pero perpetúa agregados y no resuelve identidad física.
- Migración automática al abrir: simplifica lecturas futuras, pero es destructiva e irreversible.
- Inventario educativo paralelo: facilita prototipos, pero crea dos verdades físicas incompatibles.

## Consecuencias

Sistema 0 incorpora contratos, validación semántica, índice resoluble, ciclo de vida, detector de necesidad de v6 y adaptador. No conecta v6 al store ni cambia SQLite. Los IDs sintéticos dependen de semántica estable del proyecto y no de etiquetas traducidas o orden visual.

## Riesgos

Una proyección v5 es necesariamente menos granular; se marca como `synthetic-v5`. Cambiar el algoritmo de identidad rompería referencias educativas, por lo que queda versionado como `v5-projection-1`.

## Documentos relacionados

`APRENDER-DECISIONES.md` D03, D05 y D18; `APRENDER-MODELO-DATOS.md`; `APRENDER-SISTEMA-0.md`.
