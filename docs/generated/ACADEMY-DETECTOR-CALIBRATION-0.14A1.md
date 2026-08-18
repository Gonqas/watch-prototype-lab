# Calibración de detectores — 0.14A.1

La unidad de conteo 0.14A.1 es una incidencia revisable o una causa global. Una incidencia derivada conserva `rootCauseId` y no suma como defecto independiente en prioridad.

## 1. Encabezados Markdown vacíos

- **Definición:** Encabezados Markdown vacíos
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** alta en incidencias confirmadas
- **Antes → después:** 37 → 37
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 2. Secciones declaradas sin contenido

- **Definición:** Secciones declaradas sin contenido
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 0 → 0
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 3. Campos ingleses idénticos al español

- **Definición:** Detecta locale en idéntico a es.
- **Método anterior:** Una incidencia por lección.
- **Método nuevo:** Una migración global exacta con localeStatus.
- **Falsos positivos conocidos:** No era falso que estuvieran duplicados; era falsa la prioridad individual.
- **Falsos negativos conocidos:** Traducciones parciales no equivalentes requieren otra política.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** alta en incidencias confirmadas
- **Antes → después:** 222 → 1 (+ 222 entidades en migración global)
- **Variación:** Las instancias se agrupan en una migración global y dejan de puntuar por lección.

## 4. Título de otra lección dentro del contenido

- **Definición:** Título de otra lección dentro del contenido
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** media
- **Antes → después:** 47 → 47
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 5. Objetivos genéricos reutilizados

- **Definición:** Objetivos genéricos reutilizados
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 67 → 67
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 6. Párrafos o instrucciones repetidos

- **Definición:** Párrafos o instrucciones repetidos
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 47 → 47
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 7. Dependencias circulares

- **Definición:** Dependencias circulares
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 0 → 0
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 8. Prerrequisitos de nivel superior

- **Definición:** Detecta prerrequisitos semánticamente impropios.
- **Método anterior:** Solo comparaba orden de rutas.
- **Método nuevo:** Origen exacto, orden de lección, rol y overrides curados.
- **Falsos positivos conocidos:** Referencias laterales justificadas.
- **Falsos negativos conocidos:** Aplicaciones concretas no marcadas en metadatos.
- **Casos gold:** `lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple`, `lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante`, `lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b`
- **Precisión gold:** 3/3
- **Recall gold:** 3/3
- **Confianza:** alta en incidencias confirmadas
- **Antes → después:** 0 → 9
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 9. Conceptos recomendados tratados como obligatorios

- **Definición:** Conceptos recomendados tratados como obligatorios
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 0 → 0
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 10. Módulos con una sola lección

- **Definición:** Módulos con una sola lección
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** alta en incidencias confirmadas
- **Antes → después:** 216 → 1 (+ 216 entidades en migración global)
- **Variación:** Las instancias se agrupan en una migración global y dejan de puntuar por lección.

## 11. Nombres redundantes

- **Definición:** Nombres redundantes
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** alta en incidencias confirmadas
- **Antes → después:** 216 → 1 (+ 216 entidades en migración global)
- **Variación:** Las instancias se agrupan en una migración global y dejan de puntuar por lección.

## 12. Citas demasiado amplias

- **Definición:** Citas demasiado amplias
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 220 → 110
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 13. Datos numéricos sin localizador aplicable

- **Definición:** Detecta dato numérico sin localizador aplicable.
- **Método anterior:** Buscaba números en todo el cuerpo y cualquier página en la lección.
- **Método nuevo:** Evalúa cada claim y su fuente primaria derivada.
- **Falsos positivos conocidos:** Números editoriales o históricos fuera de claims.
- **Falsos negativos conocidos:** Datos numéricos no formalizados como claim.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 120 → 35
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 14. Fórmulas OCR sin verificación visual

- **Definición:** Detecta fórmula OCR no verificada.
- **Método anterior:** Patrón de fórmula en cuerpo + cualquier fuente OCR.
- **Método nuevo:** Fórmula concreta en claim vinculada a fuente OCR.
- **Falsos positivos conocidos:** Palabras como fórmula o símbolos en contexto.
- **Falsos negativos conocidos:** Fórmulas aún no formalizadas como claim.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 66 → 17
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 15. Procedimientos históricos peligrosos

- **Definición:** Detecta procedimiento histórico peligroso accionable.
- **Método anterior:** Heredaba peligros de toda fuente.
- **Método nuevo:** Exige verbo, peligro, secuencia, contexto y fragmento exacto.
- **Falsos positivos conocidos:** Menciones, advertencias y referencias históricas.
- **Falsos negativos conocidos:** Paráfrasis peligrosas sin vocabulario reconocido.
- **Casos gold:** `lesson.horology.functional-equivalence`, `lesson.encyclopedia.history-language.medir-el-tiempo`, `lesson.encyclopedia.history-language.toh-tiempo-escalas`, `lesson.encyclopedia.service-tribology.tm-inspeccion-previa`
- **Precisión gold:** no calculable; especificidad 4/4
- **Recall gold:** no calculable (sin positivo peligroso curado)
- **Confianza:** baja/no calculable
- **Antes → después:** 44 → 0
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 16. Procedimientos que necesitan fuente moderna de seguridad

- **Definición:** Exige seguridad moderna para operación real.
- **Método anterior:** Se derivaba de peligro de fuente.
- **Método nuevo:** Solo deriva de procedimiento accionable con exposición.
- **Falsos positivos conocidos:** Lecciones conceptuales con fuente histórica.
- **Falsos negativos conocidos:** Operaciones no estructuradas como procedimiento.
- **Casos gold:** `lesson.horology.functional-equivalence`, `lesson.encyclopedia.history-language.medir-el-tiempo`, `lesson.encyclopedia.history-language.toh-tiempo-escalas`, `lesson.encyclopedia.service-tribology.tm-inspeccion-previa`
- **Precisión gold:** no calculable; especificidad 4/4
- **Recall gold:** no calculable (sin positivo peligroso curado)
- **Confianza:** baja/no calculable
- **Antes → después:** 89 → 0
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 17. Habilidad física evaluada solo digitalmente

- **Definición:** Separa claim de competencia física y evidencia P.
- **Método anterior:** Infería destreza física y recomendaba un escalar.
- **Método nuevo:** Perfil combinable; P solo con ejecución real solicitada.
- **Falsos positivos conocidos:** Simulaciones de desmontaje y diseño.
- **Falsos negativos conocidos:** Competencias físicas no declaradas.
- **Casos gold:** `lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica`, `lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante`, `lesson.metrology.physical-measurement`, `lesson.encyclopedia.micromechanics.bulova-torneado-fundamental`
- **Precisión gold:** 4/4
- **Recall gold:** 4/4
- **Confianza:** alta en incidencias confirmadas
- **Antes → después:** 76 → 4
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 18. Apoyo visual inadecuado para el arquetipo

- **Definición:** Comprueba apoyo visual contra arquetipo calibrado.
- **Método anterior:** Dependía del arquetipo inferido del cuerpo.
- **Método nuevo:** Usa jerarquía curada/metadatos/contrato y enlaza derivaciones.
- **Falsos positivos conocidos:** Conceptuales mal etiquetadas como psicomotoras.
- **Falsos negativos conocidos:** Visual externo no declarado en metadatos.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** media
- **Antes → después:** 154 → 77
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 19. Visual declarado sin desarrollar

- **Definición:** Visual declarado sin desarrollar
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 0 → 0
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 20. Contenido excesivamente condicionado por plantillas

- **Definición:** Contenido excesivamente condicionado por plantillas
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 114 → 114
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 21. Segmentación automática potencialmente disruptiva

- **Definición:** Segmentación automática potencialmente disruptiva
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 145 → 145
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.

## 22. Contenido de calibre sustentado solo por teoría general

- **Definición:** Contenido de calibre sustentado solo por teoría general
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 7 → 0
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 23. Base secundaria tratada como documentación oficial

- **Definición:** Detecta base secundaria como autoridad técnica.
- **Método anterior:** Usaba sourceIds[0].
- **Método nuevo:** Evalúa el claim y roles de fuente por autoridad.
- **Falsos positivos conocidos:** Orden incidental.
- **Falsos negativos conocidos:** Claims no formalizados.
- **Casos gold:** `lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b`
- **Precisión gold:** no calculable; especificidad 1/1
- **Recall gold:** no calculable (sin base secundaria etiquetada como autoridad)
- **Confianza:** baja/no calculable
- **Antes → después:** 4 → 2
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 24. Trabajo especializado clasificado como doméstico

- **Definición:** Trabajo especializado clasificado como doméstico
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 20 → 0
- **Variación:** El detector se recalibró con unidad semántica, contrato, claim o procedimiento.

## 25. Original o extracción rastreado accidentalmente

- **Definición:** Original o extracción rastreado accidentalmente
- **Método anterior:** Regla 0.14A conservada.
- **Método nuevo:** Misma señal con detectionMethod, confidence, scope y reviewStatus.
- **Falsos positivos conocidos:** Requiere revisión humana.
- **Falsos negativos conocidos:** No calculable con el gold set actual.
- **Casos gold:** sin etiqueta específica
- **Precisión gold:** no calculable
- **Recall gold:** no calculable
- **Confianza:** baja/no calculable
- **Antes → después:** 0 → 0
- **Variación:** Se conserva la señal baseline con procedencia y confianza explícitas.
