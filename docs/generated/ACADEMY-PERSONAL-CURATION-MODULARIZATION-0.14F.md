# Academia · modularización de la curación personal · 0.14F

`academyPersonalCurriculum.ts` queda como fachada pública. La implementación se divide en:

- `personal/phase014e/`: revisiones piloto, parches, visuales, 3D, claims, fórmulas y política MIYOTA históricas.
- `personal/phase014f/`: lecciones, apartados, prerrequisitos, actividades, claims, visuales, prácticas y correcciones del lector.
- `personal/types.ts`, `helpers.ts` y `registry.ts`: contratos, utilidades y fase activa única.

La composición es determinista: base 0.14C → endurecimiento 0.14D → curación 0.14E → correcciones 0.14F. Los doce informes 0.14E continúan coincidiendo byte a byte y los imports anteriores siguen resolviendo a través de la fachada.
