# Cómo funciona un reloj de principio a fin

Workspace editorial local del primer módulo relojero real.

- `blueprint/`: autoridad editorial externa, conservada sin modificaciones de intención.
- `blocks/` y `lessons/`: texto original del módulo.
- `scenes/`, `activities/`, `competencies/`, `evidence/` y `rubrics/`: ejecución y evaluación declarativas.
- `glossary/` y `sources/`: terminología ES/EN y procedencia curada.
- `visual-resources/`: requisitos y estado de los recursos visuales.
- `generated/`: informe técnico de los fixtures del Sistema 4B.
- `dist/`: preview, informe y paquete generados; no es la fuente editorial.

El paquete `wplab.horology.functional-map@0.1.0` es `local-unsigned`,
funciona sin conexión una vez instalado y permanece `in-review`.

Regeneración:

```powershell
node scripts/generate-horology-system4c.mjs
npm run learning:validate -- learning-content/horology-foundations
npm run learning:preview -- learning-content/horology-foundations
npm run learning:visual-report -- learning-content/horology-foundations
npm run learning:pack -- learning-content/horology-foundations
```
