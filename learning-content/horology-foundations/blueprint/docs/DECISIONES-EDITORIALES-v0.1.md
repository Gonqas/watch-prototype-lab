# Decisiones editoriales aprobadas — v0.1

## Idioma

- El primer curso publicable declarará únicamente `es-ES`.
- El glosario incluirá equivalencias técnicas en inglés desde el principio.
- No se declarará `en-US` en el manifiesto hasta que títulos, propósitos, instrucciones, preguntas y feedback estén realmente traducidos y revisados.
- La interfaz de la aplicación puede seguir siendo ES/EN; esta decisión afecta al contenido del curso.

## Responsabilidades

- **Dirección pedagógica y redacción:** ChatGPT, a partir del libro privado, documentación oficial y objetivos del usuario.
- **Aprobación del curso y de la experiencia visual:** usuario.
- **Validación de contratos, integración, tests y render:** Codex.
- **Observación y medición de unidades físicas:** usuario, con registro de instrumentos y confianza.
- **Autoridad sobre datos de calibre:** documentación oficial MIYOTA cuando exista.

## Política de fuentes

### Libro privado
- `authority`: `private-book-theory`
- `usage`: `private-local`
- `sourceType`: `private-book`
- `privateUse`: `true`
- Se cita capítulo, página y figura.
- No se copia texto extenso al paquete.
- Se usa para teoría, taller, fabricación, diseño y alta relojería.

### Documentación oficial MIYOTA
- `authority`: `official-miyota`
- `usage`: `official-linked` o `official-cached`
- `sourceType`: `official-miyota-documentation`
- Se registra calibre, tipo de documento, revisión y fecha de consulta.
- Es obligatoria para claims `official` específicos del calibre.

### Observación propia
- `authority`: `own-observation`
- Se limita a lo visible en una unidad concreta.
- No sustituye a la especificación nominal.

### Medición propia
- `authority`: `own-measurement`
- Incluye instrumento, resolución, método, repetición y unidad física.
- Puede contradecir el nominal en esa unidad sin invalidar el nominal.

### Explicación educativa
- `authority`: `original-educational`
- Resume, compara o explica.
- Nunca se etiqueta como oficial.

## Claims que bloquean publicación

Bloquean la publicación:

- claim oficial sin fuente oficial;
- dimensión o tolerancia inventada;
- selector crítico que no resuelve;
- escena sin restauración;
- actividad evaluable sin evidencia o rúbrica;
- recurso visual crítico en estado `planned` o `blocked`;
- falta de alternativa textual;
- falta de reduced motion cuando existe animación;
- fuente rota;
- términos técnicos ambiguos no resueltos;
- una inferencia presentada como hecho.

## Warnings no bloqueantes iniciales

- recurso visual secundario pendiente;
- traducción inglesa ausente cuando el paquete solo declara español;
- modelo de fidelidad menor al objetivo futuro, siempre que esté declarado;
- medición física pendiente;
- fotografía propia pendiente en una lección que ya funciona con 3D.

## G/K/P por tipo de recurso

### Esquema conceptual
- Objetivo habitual: G1 / K1–K2 / P0.
- No pretende representar geometría real.

### Modelo oficial estructural
- Objetivo inicial: G2 / K1 / P0.
- Piezas, identidad, envolvente y posición relativa respaldadas; geometría interna parcial.

### Reconstrucción visual de alta fidelidad
- Objetivo: G3 / K2–K3 / P0–P1.
- Apariencia y cinemática plausibles; no equivale a CAD de fabricación.

### Gemelo de unidad medida
- Objetivo: G4 / K3 / P1–P2.
- Requiere mediciones, fotografías y validación física.
- No implica por sí solo desgaste, lubricación, choque, fatiga o presión.

## Versionado

- Patch: corrección editorial sin cambiar significado ni evaluación.
- Minor: nueva lección, actividad o recurso compatible.
- Major: cambia una regla, significado evaluable, identificador semántico o interpretación técnica incompatible.
- Nunca se reescribe una versión publicada y usada por sesiones.

## Primeros fixtures requeridos

1. Cadena funcional de cuarzo conceptual.
2. MIYOTA 2035 oficial estructural.
3. Movimiento mecánico conceptual completo.
4. MIYOTA 8215 oficial estructural.
5. Familia 82 comparativa: 8215, 82S0 y 8N24.
6. Serie 90 comparativa: 9015 y 9039.
7. Complicaciones 9100/9120.

## Aprobación visual

Un recurso pasa de `ready` a `approved` cuando:

- responde al objetivo pedagógico;
- no oculta una limitación importante;
- usa las fuentes declaradas;
- los selectores funcionan;
- la restauración funciona;
- tiene alternativa accesible;
- el usuario aprueba su claridad;
- Codex confirma que la implementación real coincide con el storyboard.
