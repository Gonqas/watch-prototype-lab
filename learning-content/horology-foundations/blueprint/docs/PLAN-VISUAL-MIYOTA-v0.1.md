# Plan visual y de reconstrucción MIYOTA — v0.1

## Objetivo

Usar la documentación oficial MIYOTA no solo como referencia textual, sino como base de una biblioteca progresiva de movimientos digitales. Cada calibre tendrá un único ensamblaje canónico y diferentes vistas educativas reversibles.

## Niveles de reconstrucción

### R0 · Referencia documental
- Ficha de calibre.
- Enlaces oficiales.
- Especificación, plano, manual y despiece disponibles.
- Sin geometría interna afirmada.

### R1 · Envolvente oficial
- Diámetro/ligne, altura, eje de tija, alturas de agujas y encaje.
- Geometría válida para caja, esfera, agujas y portamovimiento.
- Procedencia oficial por dimensión.

### R2 · Ensamblaje estructural
- Lista oficial de piezas.
- Identidad, referencia y subsistema.
- Posición relativa y orden de capas.
- Conectividad: apoya, engrana, sujeta, acciona, regula.
- Geometría aproximada cuando no existe plano de pieza.

### R3 · Reconstrucción visual
- Contornos refinados a partir de planos, despieces y fotografías oficiales.
- Dientes contados cuando sean visibles y verificables.
- Puentes, tornillos, ruedas, palancas, muelles y acabados reconocibles.
- Caras ocultas o dimensiones no observables siguen marcadas como estimadas.

### R4 · Unidad física medida
- Fotografías ortogonales.
- Espesores, diámetros, alturas, pivotes y distancias medidos.
- Corrección del modelo por pieza.
- Asociación a una unidad física concreta.
- Validación de montaje y cinemática.

## Orden de producción

### 1. MIYOTA 2035

Razones:
- enlaza directamente con la experiencia previa del ISA 8172;
- arquitectura de cuarzo más sencilla para aprender sistemas;
- la documentación oficial incluye especificación, plano, manual y despiece;
- permite construir el primer curso visual completo con menor complejidad.

Recursos prioritarios:
1. envolvente y tija;
2. pila y contacto;
3. circuito;
4. bobina;
5. rotor paso a paso;
6. tren;
7. sistema de puesta en hora;
8. agujas;
9. secuencia de desmontaje;
10. cadena de energía.

Objetivo inicial:
- R2, G2/K2/P0.
- Evolución a R3 con referencias fotográficas y a R4 con una unidad física.

### 2. MIYOTA 8215

Razones:
- movimiento mecánico principal de la ruta;
- documentación oficial de especificación, plano, manual y piezas;
- integra automático, cuerda manual, calendario, tren, escape y regulación;
- sirve de base comparativa para la familia 82.

Subsistemas:
1. platina, puentes y tornillos;
2. barrilete;
3. tren;
4. escape;
5. volante y espiral;
6. keyless works;
7. motion works;
8. calendario;
9. automático;
10. rotor.

Objetivo inicial:
- R2, G2/K2/P0.
- R3 para desmontaje/montaje virtual.
- R4 cuando exista una unidad física documentada.

### 3. 82S0 y 8N24
- Reutilizar interfaces y componentes comunes solo cuando estén documentados.
- No asumir intercambiabilidad por parecido.
- Enfatizar open-heart y skeleton como herramientas pedagógicas de observación.

### 4. 9015 y 9039
- Comparar serie 90 con serie 82.
- Mostrar reducción de altura, 28.800 alternancias/hora y arquitectura de producto.
- 9015 con fecha; 9039 sin fecha.

### 5. 9100 y 9120
- Visualizar capas de complicaciones.
- Comparar reserva de marcha y calendarios.
- Mantener el movimiento base separado de los módulos de indicación.

## Ficha de reconstrucción por pieza

Cada pieza debe registrar:

```text
ID canónico:
Fabricante:
Calibre/familia/variante:
Referencia oficial:
Nombre ES:
Nombre EN:
Subsistema:
Fuente de identidad:
Fuente de posición:
Fuente de geometría:
Dimensiones oficiales:
Dimensiones medidas:
Geometría estimada:
Conteo de dientes:
Pivotes e interfaces:
Material/acabado:
Estado del modelo:
G/K/P:
Limitaciones:
Unidad física asociada:
Fecha y revisión:
```

## Relaciones funcionales

El modelo debe poder expresar:

- `part-of`
- `supports`
- `pivots-in`
- `meshes-with`
- `drives`
- `locks`
- `releases`
- `impulses`
- `winds`
- `sets`
- `retains`
- `covers`
- `fastened-by`
- `lubricated-at`
- `inspect-before`
- `remove-before`

## Recursos visuales comunes

- vista normal;
- vista de esfera;
- vista de puentes;
- sección axial;
- explosionado completo;
- explosionado por subsistema;
- piezas transparentes;
- ruta energética;
- sentido de giro;
- apoyos y rubíes;
- orden de desmontaje;
- orden de montaje;
- error simulado;
- comparación nominal/medido;
- comparación entre calibres.

## Regla de honestidad visual

Un modelo puede ser muy realista y seguir siendo parcialmente estimado. La aplicación debe mostrar siempre:

- qué procede de MIYOTA;
- qué se reconstruyó por proporción;
- qué se observó;
- qué se midió;
- qué no se conoce.

La estética nunca eleva automáticamente la fidelidad.
