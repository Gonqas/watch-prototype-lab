# Composición preservadora de fuente · 0.14I

La capa recibe autoría, salida previa, salida en composición, aliases históricos y bloques fuente como valores distintos. Esto permite recuperar teoría sin alterar los snapshots F/G/H.

| Fase | Incluye | Capas |
|---|---|---|
| 0.14E | 0.14E | 0.14C → 0.14D → 0.14E |
| 0.14F | 0.14E → 0.14F | 0.14C → 0.14D → 0.14E → 0.14F |
| 0.14G | 0.14E → 0.14F → 0.14G | 0.14C → 0.14D → 0.14E → 0.14F → 0.14G |
| 0.14H | 0.14E → 0.14F → 0.14G → 0.14H | 0.14C → 0.14D → 0.14E → 0.14F → 0.14G → 0.14H |
| 0.14I | 0.14E → 0.14F → 0.14G → 0.14H → 0.14I | 0.14C → 0.14D → 0.14E → 0.14F → 0.14G → 0.14H → 0.14I |

Una fase vacía o desconocida se rechaza. La fachada de etapa 2 conserva sus exports públicos.
