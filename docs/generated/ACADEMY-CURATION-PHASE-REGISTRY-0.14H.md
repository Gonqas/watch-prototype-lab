# Registro acumulativo de fases · 0.14H

## Antes y después

| Propiedad | Baseline 0.14G | 0.14H |
|---|---|---|
| Fase activa | 0.14G | 0.14H |
| Orden personal | 0.14E, 0.14G | 0.14E, 0.14F, 0.14G, 0.14H |
| Comparación | indexOf sin validar; -1 podía parecer válido | rango explícito; vacío y desconocido producen error |
| Composición | condicionales repetidos en el constructor | capas declarativas C→D→E→F→G→H |

Compatibilidad: 0.14C. Fases de lector: 0.14D → 0.14E → 0.14F → 0.14G → 0.14H.

| Rango | Fase | Capa | Función |
|---:|---|---|---|
| 0 | 0.14C | compatibility | compatibilidad de segmentos y progreso históricos |
| 1 | 0.14D | editorial-base | lector continuo y decisiones visuales editoriales |
| 2 | 0.14E | personal-pilots | pilotos personales y visuales revisados |
| 3 | 0.14F | stage-0 | etapa 0 completa |
| 4 | 0.14G | stage-1 | etapa 1 completa |
| 5 | 0.14H | stage-2 | etapa 2 completa |

Las construcciones explícitas 0.14E, 0.14F y 0.14G siguen componiendo exactamente hasta su capa; activar 0.14H no las redirige a la fase actual.
