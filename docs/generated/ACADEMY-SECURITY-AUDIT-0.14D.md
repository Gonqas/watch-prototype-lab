# Auditoría de dependencias 0.14D

El baseline de instalación mostró cuatro vulnerabilidades transitivas altas. Se aplicó `npm update brace-expansion fast-uri nanoid postcss`, sin `--force` ni cambios de major declarados. `npm audit --json` posterior informa 0 vulnerabilidades; la desaparición se corroboró con las versiones lock concretas y verify.

| Paquete | Cadena | Función afectada | Dev | Build | Runtime desktop | Versión corregida | Lock actual | Cambio / regresión |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brace-expansion | eslint → minimatch → brace-expansion | expansión de patrones | Explotabilidad limitada a entradas de tooling no confiables | Potencial al procesar patrones/CSS manipulados | No se empaqueta como ruta de negocio remota | 5.0.9 | 5.0.9 | Actualización transitiva compatible; lint, Vite, React, Tauri y Markdown se verifican |
| fast-uri | eslint → ajv → fast-uri | validación de URI en esquemas | Explotabilidad limitada a entradas de tooling no confiables | Potencial al procesar patrones/CSS manipulados | No se empaqueta como ruta de negocio remota | 3.1.5 | 3.1.5 | Actualización transitiva compatible; lint, Vite, React, Tauri y Markdown se verifican |
| nanoid | vite → postcss → nanoid | generación de identificadores durante tooling | Explotabilidad limitada a entradas de tooling no confiables | Potencial al procesar patrones/CSS manipulados | No se empaqueta como ruta de negocio remota | 3.3.18 | 3.3.18 | Actualización transitiva compatible; lint, Vite, React, Tauri y Markdown se verifican |
| postcss | vite → postcss | procesamiento CSS de build/dev | Explotabilidad limitada a entradas de tooling no confiables | Potencial al procesar patrones/CSS manipulados | No se empaqueta como ruta de negocio remota | 8.5.23 | 8.5.26 | Actualización transitiva compatible; lint, Vite, React, Tauri y Markdown se verifican |

No se usó `npm audit fix --force`. Riesgo residual: futuras resoluciones del lockfile pueden reintroducir versiones y deben volver a auditarse.
