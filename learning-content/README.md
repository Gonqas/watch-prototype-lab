# Workspace de contenido de Aprender

Este directorio contiene fuentes editoriales declarativas y artefactos técnicos de apoyo. No contiene código de producción.

- `example/`: paquete ejecutable que enseña a redactar contenido.
- `templates/minimal/`: esqueletos mínimos válidos o fragmentos embebibles.
- `templates/complete/`: modelos completos con todos los campos de autoría.
- `templates/PLANTILLAS-COMENTADAS.md`: explicación campo por campo.
- `horology-foundations/blueprint/`: los cuatro documentos editoriales v0.1 entregados externamente. Se conservan como documentos aprobados; Sistema 4B no los transforma en lecciones ni decide el currículo.
- `horology-foundations/generated/`: informe técnico regenerable de fixtures, piezas, selectores, procedencia, G/K/P y carencias de viewport.

Los únicos artefactos publicables son los generados en `example/dist/` por `npm run learning:pack`. El ZIP usa exactamente `wplab-learning-pack`, `formatVersion: 1` y `learning-pack-v1`.

`npm run learning:fixture-report` regenera el informe técnico de Sistema 4B. Ese informe no es un paquete publicable ni contenido pedagógico.
