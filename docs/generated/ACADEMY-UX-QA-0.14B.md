# QA UX 0.14B

## Alcance

Se reutiliza el harness de QA local y no se añaden capturas binarias al repositorio. La revisión combina contratos automatizados, inspección por teclado y comprobación visual responsive.

| Caso | Viewport | Criterio | Estado |
|---|---|---|---|
| Inicio desktop | 1440 px | Inicio con posición, siguiente acción y resumen secundario | verificado |
| Mi ruta desktop | 1440 px | Ocho etapas verticales y un capítulo inicialmente abierto | verificado |
| Etapa 2 expandida | 1440 px | Seis capítulos sin pared de lecciones | verificado |
| Etapa 4 MIYOTA 8215 | 1024 px | Cinco capítulos y quince unidades agrupadas | verificado |
| Etapa 5 parcial | 1024 px | Cobertura parcial y vacíos planificados, sin lecciones ficticias | verificado |
| Biblioteca desktop | 1440 px | Grupos, búsqueda y 24 rutas conservadas | verificado |
| Inicio móvil | 480 px | Barra de cuatro destinos sin desbordamiento | verificado |
| Mi ruta móvil | 480 px | Tarjetas apiladas y controles táctiles | verificado |
| Biblioteca móvil | 480 px | Drawer cerrable por Escape y retorno de foco | verificado |
| Módulo unitario | 760 px | Ruta abre lección directa; deep link conserva puente | verificado |
| Estado bloqueado | 1024 px | Razón textual y enlace directo al capítulo requerido | verificado |
| Zoom equivalente | 720 px (1440 px al 200 %) | Reflow equivalente a zoom 200 %, sin pérdida funcional | verificado |

## Accesibilidad comprobada

- Navegación primaria con `aria-current` y Biblioteca con `aria-expanded` / `aria-haspopup="dialog"`.
- Drawer con rol de diálogo, nombre accesible, Escape, trampa de foco y devolución al disparador.
- Estados bloqueados incluyen explicación textual; el color no es la única señal.
- Objetivos táctiles de navegación móvil de al menos 46 px y layout de cuatro columnas.
- Estilos de `prefers-reduced-motion` y reflow en 760/480 px.

## Limitaciones

- No se capturó evidencia física real ni se validó hardware de banco.
- La etapa 5 se inspecciona como contenido parcial; sus ocho vacíos siguen siendo blueprints.
- El navegador de QA no expuso control de zoom; se verificó el reflow equivalente de 1440 px al 200 % mediante viewport de 720 px.
- No se guardaron screenshots porque el repositorio no establece una convención para binarios de QA.
