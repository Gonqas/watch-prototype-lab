# Blueprint editorial de etapa 5 — 0.14B

La etapa 5 conserva `coverageStatus = partial`. Estos registros no son lecciones de producción y todos declaran `productionLessonId = null`.

Resumen: 8 vacíos y 5 temas parciales.

## 1. Aro o movement holder como interfaz estructural

- Referencia editorial: `stage5-gap.movement-holder`
- Estado: gap
- Objetivo observable: Comparar el movimiento, la caja y un aro propuesto y registrar apoyos, retención y cotas desconocidas.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Plano oficial del movimiento elegido; Plano de caja y especificación del proveedor del aro
- Visual requerido: Sección axial y vista explotada con contactos, holguras y sentidos de montaje.
- Práctica propuesta: Completar una matriz de interfaces y rechazar una propuesta con apoyo o retención insuficiente.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.1`
- Aceptación: Cada contacto tiene autoridad y cota localizable; Los desconocidos permanecen marcados como pendientes
- Riesgos: Deformación del movimiento; Retención insuficiente; Transferencia indebida de medidas entre calibres
- Relación con Watch Prototype Lab: Consumir geometría y envolvente del proyecto técnico sin modificarla automáticamente.
- Lección de producción: no creada

## 2. Pies de esfera: posición, fijación y servicio

- Referencia editorial: `stage5-gap.dial-feet`
- Estado: gap
- Objetivo observable: Verificar si posición, longitud y fijación de los pies son compatibles con movimiento, aro y caja.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Plano oficial del movimiento con posiciones de pies; Plano del proveedor de esfera
- Visual requerido: Superposición frontal y sección de pie, abrazadera y holgura posterior.
- Práctica propuesta: Clasificar una interfaz como compatible, adaptada o no verificable y justificar la decisión.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.2`
- Aceptación: Coincidencias y desviaciones quedan cuantificadas; No se propone cortar o soldar sin vía de taller y seguridad
- Riesgos: Daño de esfera; Interferencia con movimiento; Adaptación irreversible
- Relación con Watch Prototype Lab: Añadir una comprobación de interfaz al dossier técnico, no una operación automática.
- Lección de producción: no creada

## 3. Diámetro de esfera y asiento en caja

- Referencia editorial: `stage5-gap.dial-diameter`
- Estado: gap
- Objetivo observable: Comprobar diámetro, asiento, apertura visible y tolerancia periférica usando documentación aplicable.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Plano de caja; Plano o ficha de esfera; Requisitos del bisel o rehaut
- Visual requerido: Sección radial con asiento, apertura, rehaut y tolerancias.
- Práctica propuesta: Completar un stack dimensional y detectar una esfera que no puede asentarse o queda expuesta.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.2`
- Aceptación: La cadena dimensional cierra sin cotas inventadas; La apertura visible se distingue del diámetro total
- Riesgos: Pinzamiento; Juego radial; Cota de proveedor ambigua
- Relación con Watch Prototype Lab: Comparar envolventes CAD y registrar margen verificable.
- Lección de producción: no creada

## 4. Agujeros, tubos y ajuste de agujas

- Referencia editorial: `stage5-gap.hand-holes-fit`
- Estado: gap
- Objetivo observable: Relacionar agujeros y tubos de agujas con cañón de minutos, rueda de horas y eje de segundos aplicables.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Especificación oficial de alturas y diámetros del movimiento; Ficha del juego de agujas
- Visual requerido: Sección ampliada del ajuste y tabla de correspondencias con tolerancias verificadas.
- Práctica propuesta: Rechazar un juego incompatible y documentar qué medida o tolerancia falta.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.2`
- Aceptación: Cada interfaz se vincula a una cota oficial; No se asume que diámetro nominal equivale a ajuste válido
- Riesgos: Deformación de tubo; Aguja suelta; Daño de pivote
- Relación con Watch Prototype Lab: Vincular especificaciones del movimiento y componentes externos al dossier.
- Lección de producción: no creada

## 5. Rueda de horas dentro del apilamiento axial

- Referencia editorial: `stage5-gap.hour-wheel-stack`
- Estado: gap
- Objetivo observable: Explicar y comprobar el apilamiento de rueda de horas, esfera y agujas a través de todo su recorrido.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Sección oficial del movimiento; Alturas de agujas y esfera del fabricante
- Visual requerido: Sección axial parametrizada con tolerancias, juego y barridos.
- Práctica propuesta: Detectar pérdida de engrane o interferencia al variar el espesor de esfera dentro de datos permitidos.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.2`
- Aceptación: Se conserva engrane y libertad en todos los estados; Los márgenes se calculan solo con datos aplicables
- Riesgos: Desengrane; Roce entre agujas; Carga axial indebida
- Relación con Watch Prototype Lab: Usar el motor de interferencias del proyecto técnico cuando exista, sin crear un laboratorio nuevo.
- Lección de producción: no creada

## 6. Fondo y holgura posterior

- Referencia editorial: `stage5-gap.caseback-clearance`
- Estado: gap
- Objetivo observable: Verificar la envolvente posterior del movimiento, rotor y fijación frente al fondo en estados estáticos y dinámicos.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Plano de caja y fondo; Envolvente oficial del movimiento y rotor
- Visual requerido: Sección axial con barrido de rotor y compresión de junta.
- Práctica propuesta: Comparar dos fondos y justificar cuál conserva holgura y cierre.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.2`
- Aceptación: Holgura mínima documentada o marcada pendiente; El barrido del rotor no interfiere
- Riesgos: Contacto del rotor; Cierre incompleto; Compresión incorrecta de junta
- Relación con Watch Prototype Lab: Consultar envolventes y barridos del ensamblaje técnico.
- Lección de producción: no creada

## 7. Interferencias estáticas y durante barridos

- Referencia editorial: `stage5-gap.dynamic-interferences`
- Estado: gap
- Objetivo observable: Comprobar interferencias de agujas, corona, tija, rotor y exterior en todos los estados relevantes.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Planos de todos los componentes elegidos; Tolerancias y estados de uso del fabricante
- Visual requerido: Mapa de interferencias por estado con barridos y secciones seleccionables.
- Práctica propuesta: Ejecutar una lista de estados y registrar cada interferencia con componente, momento y autoridad.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.3`
- Aceptación: Todos los estados declarados se revisan; Cada hallazgo incluye reproducción y decisión
- Riesgos: Falso negativo por estado omitido; Geometría aproximada tratada como oficial
- Relación con Watch Prototype Lab: Reutilizar comprobaciones de ensamblaje del WPL técnico, no crear simulación paralela.
- Lección de producción: no creada

## 8. Orden y verificación del montaje final

- Referencia editorial: `stage5-gap.final-assembly-verification`
- Estado: gap
- Objetivo observable: Construir una secuencia de montaje final con puntos de control, reversibilidad y criterios de liberación.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Instrucciones del fabricante de movimiento y componentes; Procedimiento moderno de hermeticidad y seguridad aplicable
- Visual requerido: Árbol de dependencias de montaje con checkpoints y estados de bloqueo.
- Práctica propuesta: Ordenar el montaje, ubicar verificaciones y detener la liberación ante un hallazgo crítico.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.4`
- Aceptación: Cada paso tiene prerrequisito y verificación; La liberación exige cierre de hallazgos críticos
- Riesgos: Daño por orden incorrecto; Hermeticidad no comprobada; Liberación sin revisión
- Relación con Watch Prototype Lab: Generar un dossier de verificación enlazado al proyecto, sin afirmar montaje físico.
- Lección de producción: no creada

## 9. Cerrar dimensiones exteriores aplicables

- Referencia editorial: `stage5-partial.external-dimensions`
- Estado: partial
- Objetivo observable: Consolidar diámetro, altura, envolventes y tolerancias oficiales del conjunto elegido.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Planos oficiales de movimiento, caja, esfera, agujas y cristal
- Visual requerido: Stack dimensional trazable.
- Práctica propuesta: Auditar cada cota del stack y señalar su fuente.
- Evidencia: K+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.1`
- Aceptación: Ninguna cota crítica carece de localizador
- Riesgos: Cota aproximada tratada como tolerancia
- Relación con Watch Prototype Lab: Dossier dimensional del proyecto.
- Lección de producción: no creada

## 10. Cañón de minutos como interfaz del conjunto

- Referencia editorial: `stage5-partial.cannon-pinion`
- Estado: partial
- Objetivo observable: Relacionar ajuste, altura y función del cañón de minutos con esfera y agujas.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Especificación oficial del movimiento y agujas
- Visual requerido: Sección axial de minutería y agujas.
- Práctica propuesta: Revisar una cadena axial y localizar la cota que gobierna cada interfaz.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.2`
- Aceptación: Función y cota se mantienen separadas
- Riesgos: Transferir ajuste de otro calibre
- Relación con Watch Prototype Lab: Interfaz movimiento-esfera-agujas.
- Lección de producción: no creada

## 11. Apilamiento axial verificable

- Referencia editorial: `stage5-partial.axial-stack`
- Estado: partial
- Objetivo observable: Cerrar el stack axial completo con tolerancias y estados de movimiento.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Secciones y alturas oficiales
- Visual requerido: Stack axial toleranciado.
- Práctica propuesta: Comprobar márgenes nominales y extremos.
- Evidencia: K+V+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.3`
- Aceptación: Márgenes positivos en estados aplicables
- Riesgos: Acumulación de tolerancias omitida
- Relación con Watch Prototype Lab: Análisis de stack del ensamblaje técnico.
- Lección de producción: no creada

## 12. Hermeticidad como protocolo moderno

- Referencia editorial: `stage5-partial.water-resistance`
- Estado: partial
- Objetivo observable: Distinguir diseño de rutas de fuga, preparación y prueba profesional aplicable.
- Fuentes principales: `source.institutional.awci.standards`
- Documentación oficial necesaria: Especificación moderna de caja, juntas y ensayo
- Visual requerido: Mapa de sellos y rutas de fuga.
- Práctica propuesta: Seleccionar un protocolo seguro y explicar sus límites.
- Evidencia: K+R
- Ejecución: professional-or-outsourced
- Prerrequisitos: `chapter.5.4`
- Aceptación: Protocolo moderno y límite de presión documentados
- Riesgos: Daño por prueba inadecuada; Fuente histórica usada como norma vigente
- Relación con Watch Prototype Lab: Registrar resultado externo revisado en el dossier.
- Lección de producción: no creada

## 13. Piezas donantes en un reloj completo

- Referencia editorial: `stage5-partial.donor-parts`
- Estado: partial
- Objetivo observable: Evaluar identidad, compatibilidad, estado, reversibilidad y procedencia de una pieza donante.
- Fuentes principales: `source.private.daniels.watchmaking-volume`, `source.encyclopedia.original-synthesis`
- Documentación oficial necesaria: Documentación oficial de ambos calibres o componentes
- Visual requerido: Matriz de equivalencia con desconocidos y diferencias.
- Práctica propuesta: Aceptar, rechazar o posponer una pieza donante con evidencia trazable.
- Evidencia: K+R
- Ejecución: simulation
- Prerrequisitos: `chapter.5.4`
- Aceptación: La similitud visual no se trata como compatibilidad; La procedencia queda registrada
- Riesgos: Generalización entre calibres; Pérdida de originalidad
- Relación con Watch Prototype Lab: Vincular alternativas de componente al proyecto sin sustituir la geometría aprobada.
- Lección de producción: no creada
