# Informe visual técnico · Sistema 4B

Generado: 2026-07-28T09:16:01.537Z

Fixture coordinado: `fixture.module.horology.functional-map` · compilación técnica: **correcta**.

Este informe describe datos y capacidades técnicas. No contiene lecciones, explicaciones pedagógicas, preguntas ni rúbricas.

## conceptual-quartz:functional-chain-v1

- Fixture: `fixture.conceptual.quartz-chain@0.1.0`
- Reconstrucción: **R2**
- Piezas registradas: **9**
- Selectores: **10** (10 válidos)
- Datos oficiales / estimados / medidos: **0 / 0 / 0**
- G/K/P: **G1/K2/P0**
- Errores visuales controlados: **0**

### Bloqueos

- Ninguno declarado.

### Limitaciones

- No representa MIYOTA 2035 ni ISA 8172.
- Las formas y separaciones son simbólicas.

## official-calibre-quartz:2035

- Fixture: `fixture.miyota.2035.structural@0.1.0`
- Reconstrucción: **R2**
- Piezas registradas: **33**
- Selectores: **11** (11 válidos)
- Datos oficiales / estimados / medidos: **10 / 33 / 0**
- G/K/P: **G2/K2/P0**
- Errores visuales controlados: **2**

### Bloqueos

- Pieza o rol ausente: individual-quartz-resonator
- Pieza o rol ausente: physically-validated-main-plate
- Pieza o rol ausente: measured-internal-geometry

### Limitaciones

- No es un gemelo exacto ni una reconstrucción R3.
- Solo la envolvente y datos generales indicados en el ledger son nominales oficiales.
- Las piezas internas usan identidad oficial, pero geometría visual normalizada.
- Las opciones de tija larga no forman parte del ensamblaje canónico seleccionado.

## conceptual-mechanical:complete-functional-chain-v1

- Fixture: `fixture.conceptual.mechanical-chain@0.1.0`
- Reconstrucción: **R2**
- Piezas registradas: **14**
- Selectores: **15** (15 válidos)
- Datos oficiales / estimados / medidos: **0 / 0 / 0**
- G/K/P: **G1/K2/P0**
- Errores visuales controlados: **0**

### Bloqueos

- Ninguno declarado.

### Limitaciones

- No se etiqueta ni se deriva como MIYOTA 8215.
- Todas las formas son simbólicas.

## official-calibre-mechanical:8215

- Fixture: `fixture.miyota.8215.structural@0.1.0`
- Reconstrucción: **R2**
- Piezas registradas: **56**
- Selectores: **16** (16 válidos)
- Datos oficiales / estimados / medidos: **12 / 63 / 0**
- G/K/P: **G2/K2/P0**
- Errores visuales controlados: **3**

### Bloqueos

- Pieza o rol ausente: all-21-individual-jewels
- Pieza o rol ausente: physically-validated-main-plate
- Pieza o rol ausente: complete-tooth-counts
- Pieza o rol ausente: measured-internal-geometry

### Limitaciones

- Un único ensamblaje contiene calendario, automático y rotor; las vistas solo cambian el overlay.
- No es un gemelo exacto ni una reconstrucción R3.
- La geometría interna no procede de medición y no se expresa en milímetros.
- Se omiten del ensamblaje activo opciones, alternativas semiacabadas, abrazaderas opcionales y tijas largas.
- No se modelan 21 rubíes individuales: solo conjuntos enjoyados identificables en la lista oficial.

## Bloqueos de la composición coordinada

- Ninguno declarado.

