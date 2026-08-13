# Fuentes oficiales MIYOTA

## Alcance curado

El registro técnico verificable cubre exclusivamente:

- MIYOTA 2035;
- MIYOTA 8215.

El registro conserva contratos vacíos para `82S0`, `8N24`, `9015`, `9039`, `9100` y `9120`, pero el verificador no permite descargarlos. Añadir un calibre exige una decisión editorial posterior y no se deriva de recorrer o descargar el catálogo completo.

La fuente canónica es `src/learning/technical/officialSources.ts`. Para cada uno de los dos calibres contiene exactamente:

1. página oficial del producto;
2. especificación;
3. plano;
4. manual de instrucciones;
5. lista de piezas o despiece oficial enlazado.

Cada registro fija URL solicitada, fecha de consulta, tipo documental, tipo MIME observado, tamaño y SHA-256. Los PDF se hashean como bytes sin transformar. Las páginas HTML se hashean después de normalizar únicamente el token CSRF generado en cada petición; el tamaño conservado sigue siendo el de la respuesta original.

La huella demuestra qué contenido remoto se verificó. No demuestra que MIYOTA haya publicado un número de revisión, ni concede una licencia de copia o redistribución.

## Verificación reproducible y selectiva

```powershell
npm run learning:miyota-sources:verify
npm run learning:miyota-sources:verify -- --calibre 2035
npm run learning:miyota-sources:verify -- --calibre 8215 --document drawing
npm run learning:miyota-sources:verify -- --offline
npm run learning:miyota-sources:verify -- --json
```

El comando:

- acepta solo `2035` o `8215`;
- descarga únicamente los documentos que ya están en el registro;
- rechaza una redirección fuera de `https://miyotamovement.com`;
- limita cada respuesta a 30 MiB;
- comprueba URL, tipo, tamaño y SHA-256;
- guarda los bytes únicamente bajo `tmp/miyota-official-sources`;
- nunca cambia ni acepta automáticamente la línea base.

`tmp` está ignorado por Git. La caché sirve para comprobación privada y para repetir la prueba sin conexión; no forma parte de la aplicación, instalador, paquete educativo o exportación `.wplab`.

## Respuesta ante un cambio

Una diferencia de hash, tamaño, tipo MIME, URL solicitada o destino final produce `drift`, salida distinta de cero y `requiresReview: true`.

No se debe sustituir la huella automáticamente. La revisión humana debe:

1. conservar los bytes anterior y nuevo en una caché privada;
2. comprobar que el destino continúa siendo oficial;
3. comparar visual y semánticamente los documentos;
4. identificar qué hechos, referencias o piezas han cambiado;
5. ejecutar las pruebas doradas;
6. elevar la revisión del registro y actualizar claims afectados;
7. aceptar la huella nueva únicamente después de documentar la decisión.

Si una misma URL oficial empieza a servir una revisión distinta sin identificador editorial, esa diferencia se trata como una revisión nueva del recurso. Si cambia la URL, se crea un registro nuevo o una revisión explícitamente revisada; no se sigue el enlace de manera silenciosa.

## Derechos, licencia y almacenamiento

Mientras no exista autorización verificable, todos los documentos declaran:

- `license: unknown`;
- `redistribution: requires-review`;
- `repositoryStorage: prohibited-until-reviewed`;
- `verificationCache: private-local-only`.

Por tanto:

- no se incorporan PDF, imágenes, CAD ni capturas oficiales al repositorio;
- no se empaquetan en la aplicación;
- no se publican copias en contenido educativo;
- las citas distribuidas conservan URL y huella, no el archivo;
- una descarga temporal no cambia el estado jurídico del recurso.

Antes de distribuir un documento o activo MIYOTA debe obtenerse por escrito el alcance permitido: almacenamiento, modificación, reconstrucción derivada, uso educativo/comercial, territorios, duración, atribución, sublicencia y distribución dentro de una aplicación sin conexión.

## Solicitud de CAD y autorización

La página pública ofrece documentación e imágenes, pero este registro no considera que exista CAD oficial descargable. Para solicitarlo debe contactarse con MIYOTA o su distribuidor autorizado indicando:

- entidad y producto: Watch Prototype Lab;
- calibres exactos: 2035 y 8215;
- formato requerido: STEP, Parasolid o glTF/GLB, con unidades y ejes;
- piezas, niveles de ensamblaje y variantes solicitadas;
- uso educativo y visual, no fabricación ni certificación de servicio;
- necesidad o no de adaptar, simplificar y generar LOD;
- almacenamiento local, funcionamiento sin conexión e inclusión en instaladores;
- usuarios, territorios y naturaleza comercial;
- medidas de protección y trazabilidad;
- permiso para redistribuir geometría o solo resultados renderizados;
- procedimiento para revisiones, retirada y caducidad.

Una respuesta comercial informal o el acceso a un PDF no se interpreta como licencia CAD. La autorización y el activo recibido se registrarían como fuentes nuevas, con sus propios hashes, restricciones y revisión.

## Frontera entre R3 y R4

### R3 — reconstrucción visual

Puede usar documentación oficial, fotografías autorizadas y observación visual para crear contornos y volúmenes reconocibles. Toda dimensión no nominal continúa como estimada. R3 no valida:

- superficies ocultas;
- tolerancias;
- perfiles de diente;
- pivotes y centros funcionales;
- holguras;
- cinemática o física de una unidad concreta.

Un CAD oficial autorizado puede mejorar R3, pero solo alcanza R4 si representa la misma variante, está documentado, se contrasta con la unidad y se cumplen las mediciones requeridas.

### R4 — unidad física medida

Requiere identificar una unidad concreta y conservar:

- procedencia, variante, lote o marcas observables;
- secuencia fotográfica de desmontaje;
- instrumento, calibración, incertidumbre y operador;
- medidas de cada interfaz funcional necesaria;
- recuentos de dientes y relaciones comprobadas;
- discrepancias frente a nominales y reconstrucción R3;
- revisión y evidencia trazable.

Los valores de una unidad R4 no sustituyen los nominales oficiales y no se generalizan automáticamente a todo el calibre.

## Criterio de uso

- Una cota de ficha o plano se etiqueta como nominal oficial y conserva fuente y huella.
- El diámetro o altura de envolvente no se presenta como geometría completa de platina, puente o rueda.
- El despiece prueba identidad y referencia, no ajuste, perfil oculto o compatibilidad.
- Una proporción de una imagen continúa siendo estimación visual.
- Un dato medido y un nominal discrepante se conservan como claims separados.
- Ninguna fuente oficial convierte una simulación educativa en validación de ingeniería.
