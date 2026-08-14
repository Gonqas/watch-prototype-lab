# Accesibilidad visual 0.14D

| Control | Estado |
| --- | --- |
| Un solo h1 y headingLevel h2/h3/h4 | Implementado y cubierto por tests |
| Índice y documento | Comparten outline y niveles |
| aria-live sobre figure | Retirado |
| Anuncio de cue | Solo mediante botón explícito |
| Alt, caption, límites | Conservados |
| Movimiento reducido | Estados 3D pausados y sin autoplay |
| Texto sin canvas/WebGL | Conservado; fallback textual estable |
| Layout sin visual | Clase `no-visual`, sin columna reservada |
| Fallo 3D | “Vista no disponible”, sin SVG genérico |
| Lectura | Visuales esenciales inline; no hay rail sticky |

El árbol de encabezados y la ausencia de anuncios repetitivos se validan automáticamente. La calidad de la experiencia con lectores de pantalla reales sigue requiriendo revisión humana.
