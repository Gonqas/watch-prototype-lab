# Watch Prototype Lab 0.8.0

## Sistema 5A: del objeto físico al modelo revisable

Esta versión incorpora un flujo local y trazable para estudiar una unidad relojera real sin confundirla con un calibre, una familia ni un modelo virtual.

### Novedades principales

- registro privado de unidades físicas y componentes observados;
- inventario de instrumentos y verificaciones, separando resolución, verificación y calibración;
- importación JPEG, PNG y WebP con original inmutable, miniatura, hash SHA-256 y deduplicación;
- sesiones de inspección, observaciones, hallazgos e hipótesis diferenciadas;
- banco fotográfico no destructivo con anotaciones y calibración 2D declarada;
- series de medida que conservan lecturas originales, descartes razonados y una estimación de incertidumbre explícitamente no equivalente al GUM;
- comparación neutral entre nominal y medido;
- propuestas de corrección y parches candidatos reversibles, sin mutación automática de fixtures, CAD o `WatchProject`;
- expediente exportable en JSON y HTML;
- backup Web de metadatos con omisiones binarias explícitas;
- backup y restauración completos en Desktop para SQLite y object store, con previsualización, verificación y copia de seguridad previa;
- curso local de 14 módulos, 28 prácticas, 18 competencias y repaso espaciado a 1/7/21 días;
- integración contextual con Inicio, Explorar, Taller, Atlas, Cuaderno y Progreso.

### Integridad y alcance

- Cada valor mantiene su procedencia: oficial, observado, medido, estimado, diseñado o desconocido.
- Una observación no se presenta como diagnóstico.
- Medir una unidad no generaliza el resultado al calibre o a la familia.
- Una propuesta aprobada sigue siendo un candidato reversible hasta que una revisión humana la aplique expresamente.
- R2, R3 y R4 exigen evidencias distintas; una fotografía o una medida aislada no eleva por sí sola la fidelidad.

### Compatibilidad

- Los proyectos `.wplab` y la base educativa anterior conservan su contrato.
- La migración de metrología es aditiva y usa la versión 2 de `learning.sqlite3`.
- El curso, los fixtures y el trabajo registrado funcionan sin conexión una vez instalada la aplicación.

### Limitaciones conocidas

- La fotogrametría, la reconstrucción 3D automática, el diagnóstico físico y la aplicación automática de cambios CAD no forman parte de 5A.
- La incertidumbre calculada es una declaración educativa y conservadora; no certifica conformidad con el GUM.
- El instalador local no dispone de firma Authenticode comercial, por lo que Windows puede mostrar `Editor desconocido`.
