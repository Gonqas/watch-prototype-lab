import { z } from 'zod'

const localized = z.object({ es: z.string().min(1), en: z.string().min(1).optional() }).strict()

export const ManufacturingHazardSchema = z.object({
  id: z.string().min(3),
  title: localized,
  severity: z.enum(['moderate', 'serious', 'critical']),
  triggers: z.array(z.string().min(1)).min(1),
  controls: z.array(z.string().min(1)).min(1),
  stopConditions: z.array(z.string().min(1)).min(1),
  sourceIds: z.array(z.string().min(3)).min(1),
}).strict()

export const ManufacturingInspectionSchema = z.object({
  id: z.string().min(3),
  title: localized,
  question: z.string().min(1),
  evidence: z.array(z.string().min(1)).min(1),
  beforeOperationIds: z.array(z.string().min(3)).default([]),
}).strict()

const operationSchema = z.object({
  id: z.string().min(3),
  title: localized,
  purpose: z.string().min(1),
  inputState: z.string().min(1),
  outputState: z.string().min(1),
  hazardIds: z.array(z.string().min(3)).min(1),
  inspectionIds: z.array(z.string().min(3)).min(1),
}).strict()

export const ManufacturingProcessPlanSchema = z.object({
  id: z.string().min(3),
  title: localized,
  artifactKinds: z.array(z.enum([
    'case',
    'dial',
    'hands',
    'mainplate',
    'bridge',
    'micromechanical-part',
    'decorated-surface',
  ])).min(1),
  purpose: z.string().min(1),
  operations: z.array(operationSchema).min(2),
  materialDecisions: z.array(z.object({ id: z.string().min(3), question: z.string().min(1) }).strict()).min(1),
  datums: z.array(z.object({ id: z.string().min(3), title: z.string().min(1), controls: z.array(z.string().min(1)).min(1) }).strict()).min(1),
  toleranceDecisions: z.array(z.object({ id: z.string().min(3), requirement: z.string().min(1), verification: z.string().min(1) }).strict()).min(1),
  acceptanceCriteria: z.array(z.object({ id: z.string().min(3), title: z.string().min(1), passWhen: z.array(z.string().min(1)).min(1) }).strict()).min(1),
  sourceIds: z.array(z.string().min(3)).min(1),
  physicalBoundary: z.string().min(1),
}).strict()

export type ManufacturingHazard = z.infer<typeof ManufacturingHazardSchema>
export type ManufacturingInspection = z.infer<typeof ManufacturingInspectionSchema>
export type ManufacturingProcessPlan = z.infer<typeof ManufacturingProcessPlanSchema>

export const MANUFACTURING_HAZARDS: ManufacturingHazard[] = [
  {
    id: 'hazard.manufacturing.rotating-machinery', title: { es: 'Atrapamiento en maquinaria rotativa' }, severity: 'critical',
    triggers: ['Torno, fresadora, taladro o pulidora en movimiento.', 'Ropa, guantes, pelo o herramientas cerca del giro.'],
    controls: ['Formación presencial y resguardos.', 'Sujeción verificada y zona despejada.', 'Nunca usar guantes junto a elementos giratorios cuando exista riesgo de atrapamiento.'],
    stopConditions: ['Resguardo ausente.', 'Pieza o herramienta mal sujeta.', 'Ruido, vibración o excentricidad no explicados.'],
    sourceIds: ['source.niosh.machine-safety'],
  },
  {
    id: 'hazard.manufacturing.sharp-tools-swarf', title: { es: 'Cortes, virutas y proyección de partículas' }, severity: 'serious',
    triggers: ['Aristas, buriles, brocas, limas, viruta larga o abrasivo.'],
    controls: ['Protección ocular adecuada.', 'Retirada de viruta con útil, nunca con la mano.', 'Desbarbado y orden del puesto.'],
    stopConditions: ['Pantalla o protección ocular ausente.', 'Viruta enredada con la máquina en marcha.'],
    sourceIds: ['source.niosh.machine-safety'],
  },
  {
    id: 'hazard.manufacturing.metalworking-fluids', title: { es: 'Exposición a fluidos de mecanizado' }, severity: 'serious',
    triggers: ['Contacto cutáneo, salpicadura, niebla o fluido contaminado.'],
    controls: ['Consultar ficha de seguridad.', 'Evitar aerosol, mantener ventilación y gestionar el fluido.', 'Protección ocular frente a salpicaduras y lavado correcto.'],
    stopConditions: ['Producto desconocido o sin ficha.', 'Niebla visible, olor anómalo, contaminación o irritación.'],
    sourceIds: ['source.osha.metalworking-fluids', 'source.niosh.metalworking-fluids'],
  },
  {
    id: 'hazard.manufacturing.abrasive-dust', title: { es: 'Polvo y partículas de abrasión' }, severity: 'serious',
    triggers: ['Rectificado, pulido, satinado, esmerilado o limpieza abrasiva.'],
    controls: ['Extracción localizada compatible con el material.', 'Protección ocular y respiratoria definida por evaluación de riesgos.', 'Separar abrasivos por material y acabado.'],
    stopConditions: ['Polvo suspendido sin extracción.', 'Material o recubrimiento no identificado.'],
    sourceIds: ['source.niosh.machine-safety'],
  },
  {
    id: 'hazard.manufacturing.heat-flame', title: { es: 'Calor, llama y tratamiento térmico' }, severity: 'critical',
    triggers: ['Azulado térmico, soldadura, recocido, temple o pieza caliente.'],
    controls: ['Supervisión experta, superficie incombustible y control térmico.', 'Manipulación con útiles apropiados y tiempo de enfriamiento.'],
    stopConditions: ['Material o tratamiento desconocidos.', 'Ausencia de control de incendio o ventilación.'],
    sourceIds: ['source.niosh.machine-safety'],
  },
  {
    id: 'hazard.manufacturing.chemicals-coatings', title: { es: 'Químicos, baños y recubrimientos' }, severity: 'critical',
    triggers: ['Desengrase, galvanoplastia, lacas, decapado, adhesivos o disolventes.'],
    controls: ['Ficha de seguridad, compatibilidad, ventilación y gestión de residuos.', 'No mezclar productos ni improvisar concentraciones.'],
    stopConditions: ['Producto sin identificar.', 'Ventilación o contención insuficiente.', 'Reacción, calor u olor inesperados.'],
    sourceIds: ['source.osha.metalworking-fluids'],
  },
]

export const MANUFACTURING_INSPECTIONS: ManufacturingInspection[] = [
  { id: 'inspection.manufacturing.revision-datums', title: { es: 'Revisión y datums' }, question: '¿La operación usa el plano, revisión, referencias y estado correctos?', evidence: ['Plano o modelo identificado.', 'Revisión y datums registrados.'], beforeOperationIds: [] },
  { id: 'inspection.manufacturing.incoming-material', title: { es: 'Material de entrada' }, question: '¿Material, condición, dimensiones y procedencia son adecuados?', evidence: ['Identidad de material.', 'Medidas iniciales y condición visual.'], beforeOperationIds: [] },
  { id: 'inspection.manufacturing.in-process', title: { es: 'Control durante proceso' }, question: '¿Se conserva material para la siguiente operación y el datum sigue válido?', evidence: ['Medición intermedia.', 'Desviaciones y decisión de continuar.'], beforeOperationIds: [] },
  { id: 'inspection.manufacturing.critical-dimensions', title: { es: 'Dimensiones críticas' }, question: '¿Tamaños, posiciones y batimientos cumplen la especificación con incertidumbre declarada?', evidence: ['Serie de medida.', 'Instrumento y regla de decisión.'], beforeOperationIds: [] },
  { id: 'inspection.manufacturing.fit-clearance', title: { es: 'Ajustes y holguras' }, question: '¿La interfaz ensambla sin forzar, perder retención ni crear interferencias?', evidence: ['Resultado funcional.', 'Componentes y condiciones probados.'], beforeOperationIds: [] },
  { id: 'inspection.manufacturing.surface-finish', title: { es: 'Textura y acabado' }, question: '¿Textura, dirección, límites y zonas protegidas coinciden con la intención?', evidence: ['Iluminación y aumento declarados.', 'Muestra o criterio de comparación.'], beforeOperationIds: [] },
  { id: 'inspection.manufacturing.traceability', title: { es: 'Trazabilidad final' }, question: '¿Se conservan revisión, operaciones, instrumentos, desviaciones y aceptación?', evidence: ['Dossier de fabricación.', 'Firmas de revisión y no conformidades.'], beforeOperationIds: [] },
]

const O = (id: string, title: string, purpose: string, inputState: string, outputState: string, hazardIds: string[], inspectionIds: string[]) => ({ id, title: { es: title }, purpose, inputState, outputState, hazardIds, inspectionIds })
const A = (id: string, title: string, passWhen: string[]) => ({ id, title, passWhen })

export const MANUFACTURING_PROCESS_PLANS: ManufacturingProcessPlan[] = [
  {
    id: 'process.manufacturing.dfm-datums', title: { es: 'Diseño para fabricar, medir y revisar' }, artifactKinds: ['case', 'dial', 'hands', 'mainplate', 'bridge', 'micromechanical-part'],
    purpose: 'Convertir intención funcional en datums, características críticas, tolerancias justificadas y una secuencia verificable.',
    operations: [
      O('operation.manufacturing.define-function', 'Definir función e interfaces', 'Fijar qué debe hacer la pieza y con qué se relaciona.', 'Necesidad o pliego.', 'Mapa de interfaces y características críticas.', ['hazard.manufacturing.sharp-tools-swarf'], ['inspection.manufacturing.revision-datums']),
      O('operation.manufacturing.plan-datums', 'Elegir referencias y secuencia', 'Evitar cadenas de cota contradictorias y pérdida de referencias.', 'Mapa funcional.', 'Plan de datums, operaciones y control.', ['hazard.manufacturing.rotating-machinery'], ['inspection.manufacturing.revision-datums', 'inspection.manufacturing.in-process']),
      O('operation.manufacturing.review-drawing', 'Revisar dibujo y regla de decisión', 'Comprobar especificación, verificabilidad y aceptación.', 'Plan preliminar.', 'Dibujo revisado y plan de inspección.', ['hazard.manufacturing.rotating-machinery'], ['inspection.manufacturing.critical-dimensions', 'inspection.manufacturing.traceability']),
    ],
    materialDecisions: [{ id: 'material.manufacturing.select-by-function', question: '¿Qué propiedades funcionales, de proceso, corrosión y acabado exige la pieza?' }],
    datums: [{ id: 'datum.manufacturing.functional', title: 'Datum funcional primario', controls: ['Posición de interfaces.', 'Repetibilidad de sujeción.', 'Coherencia de inspección.'] }],
    toleranceDecisions: [{ id: 'tolerance.manufacturing.justified', requirement: 'Cada tolerancia debe responder a una función o riesgo.', verification: 'Instrumento, estrategia y regla de aceptación declarados antes de fabricar.' }],
    acceptanceCriteria: [A('acceptance.manufacturing.drawing-complete', 'Plano y plan revisables', ['Datums explícitos.', 'Características críticas trazables.', 'Todas las tolerancias pueden verificarse.'])],
    sourceIds: ['source.iso.286-1', 'source.iso.1101', 'source.iso.21920-1', 'source.iso.14253-1'],
    physicalBoundary: 'La Academia revisa el plan; la fabricación exige taller, seguridad, utillaje e inspección reales.',
  },
  {
    id: 'process.manufacturing.case', title: { es: 'Caja y arquitectura exterior' }, artifactKinds: ['case'],
    purpose: 'Planificar carrura, fondo, bisel, cristal, corona, tubo, asas, juntas y alojamiento del movimiento como sistema de interfaces.',
    operations: [
      O('operation.manufacturing.case-interface-map', 'Mapa de interfaces de caja', 'Relacionar movimiento, esfera, agujas, cristal, tija, corona, fondo y correa.', 'Movimiento y pliego.', 'Pila axial y mapa radial.', ['hazard.manufacturing.sharp-tools-swarf'], ['inspection.manufacturing.revision-datums']),
      O('operation.manufacturing.case-machine', 'Plan de mecanizado y sujeciones', 'Preservar concentricidad, espesores y superficies de estanqueidad.', 'Material y datums.', 'Secuencia de torneado, fresado, taladrado y roscado.', ['hazard.manufacturing.rotating-machinery', 'hazard.manufacturing.metalworking-fluids'], ['inspection.manufacturing.incoming-material', 'inspection.manufacturing.in-process']),
      O('operation.manufacturing.case-finish-assemble', 'Acabado, limpieza y montaje de prueba', 'Proteger superficies funcionales y verificar interfaces.', 'Caja mecanizada.', 'Conjunto de prueba documentado.', ['hazard.manufacturing.abrasive-dust', 'hazard.manufacturing.chemicals-coatings'], ['inspection.manufacturing.fit-clearance', 'inspection.manufacturing.surface-finish', 'inspection.manufacturing.traceability']),
    ],
    materialDecisions: [{ id: 'material.manufacturing.case', question: '¿Qué material y tratamiento equilibran mecanizado, corrosión, masa, acabado y contacto con la piel?' }],
    datums: [{ id: 'datum.manufacturing.case-axis', title: 'Eje y plano de asiento del movimiento', controls: ['Concentricidad de alojamientos.', 'Alturas de esfera y tija.', 'Planos de sellado.'] }],
    toleranceDecisions: [{ id: 'tolerance.manufacturing.case-stack', requirement: 'La pila axial evita contacto entre agujas, cristal, esfera y movimiento.', verification: 'Cadena de cotas con peores casos y comprobación física.' }],
    acceptanceCriteria: [A('acceptance.manufacturing.case-fit', 'Interfaces de caja verificadas', ['Movimiento retenido sin deformación.', 'Corona y tija alineadas.', 'Cristal, fondo y juntas tienen especificación verificable.'])],
    sourceIds: ['source.iso.22810', 'source.iso.14856', 'source.iso.1101', 'source.miyota.8215.official'],
    physicalBoundary: 'No se declara estanqueidad por diseño o ajuste visual; requiere el programa de ensayo aplicable.',
  },
  {
    id: 'process.manufacturing.dial', title: { es: 'Esfera, índices y superficies gráficas' }, artifactKinds: ['dial'],
    purpose: 'Coordinar sustrato, pies, abertura de fecha, índices, impresión, acabados y legibilidad con la pila del reloj.',
    operations: [
      O('operation.manufacturing.dial-layout', 'Definir layout e interfaces', 'Fijar centros, pies, fecha, minutería y zonas de texto.', 'Movimiento, caja e intención visual.', 'Dibujo de esfera con interfaces.', ['hazard.manufacturing.sharp-tools-swarf'], ['inspection.manufacturing.revision-datums']),
      O('operation.manufacturing.dial-substrate', 'Preparar sustrato y fijaciones', 'Obtener planitud, espesor y fijación controlados.', 'Material identificado.', 'Sustrato preparado.', ['hazard.manufacturing.rotating-machinery', 'hazard.manufacturing.chemicals-coatings'], ['inspection.manufacturing.incoming-material', 'inspection.manufacturing.critical-dimensions']),
      O('operation.manufacturing.dial-finish', 'Aplicar acabado e indicaciones', 'Crear superficie, índices y texto sin perder interfaces.', 'Sustrato aceptado.', 'Esfera terminada y protegida.', ['hazard.manufacturing.chemicals-coatings', 'hazard.manufacturing.abrasive-dust'], ['inspection.manufacturing.surface-finish', 'inspection.manufacturing.traceability']),
    ],
    materialDecisions: [{ id: 'material.manufacturing.dial', question: '¿El sustrato y la capa decorativa son compatibles con fijación, proceso, espesor, estabilidad y reparación?' }],
    datums: [{ id: 'datum.manufacturing.dial-centre', title: 'Centro de indicación y cara de apoyo', controls: ['Posición de pies.', 'Ventana de fecha.', 'Orientación de índices.'] }],
    toleranceDecisions: [{ id: 'tolerance.manufacturing.dial-stack', requirement: 'Planitud y espesor preservan las holguras de agujas y calendario.', verification: 'Medición de sustrato y montaje de prueba documentado.' }],
    acceptanceCriteria: [A('acceptance.manufacturing.dial-legibility', 'Esfera funcional y legible', ['Interfaces sin interferencias.', 'Índices y texto verificables.', 'Acabado sin contaminar superficies de fijación.'])],
    sourceIds: ['source.iso.1101', 'source.iso.21920-1', 'source.w3c.wcag22'],
    physicalBoundary: 'Baños, lacas, adhesivos y pigmentos requieren ficha de seguridad, proceso validado y control de espesor real.',
  },
  {
    id: 'process.manufacturing.hands', title: { es: 'Agujas, cañones y holguras' }, artifactKinds: ['hands'],
    purpose: 'Diseñar forma, masa, tubo, asiento, apilado y acabado sin interferencias ni pérdida de legibilidad.',
    operations: [
      O('operation.manufacturing.hands-interface', 'Definir tubos y apilado', 'Relacionar diámetros de asiento, alturas y sentido de montaje.', 'Movimiento, esfera y cristal.', 'Especificación de cada aguja.', ['hazard.manufacturing.sharp-tools-swarf'], ['inspection.manufacturing.revision-datums']),
      O('operation.manufacturing.hands-form', 'Formar cuerpo y cañón', 'Conservar concentricidad, planitud y retención.', 'Material y útiles.', 'Aguja formada para inspección.', ['hazard.manufacturing.rotating-machinery', 'hazard.manufacturing.sharp-tools-swarf'], ['inspection.manufacturing.critical-dimensions', 'inspection.manufacturing.fit-clearance']),
      O('operation.manufacturing.hands-finish-balance', 'Acabar y verificar balance', 'Evitar masa excéntrica, deformación y pérdida de contraste.', 'Aguja formada.', 'Juego terminado y documentado.', ['hazard.manufacturing.heat-flame', 'hazard.manufacturing.chemicals-coatings'], ['inspection.manufacturing.surface-finish', 'inspection.manufacturing.traceability']),
    ],
    materialDecisions: [{ id: 'material.manufacturing.hands', question: '¿Material, espesor y acabado permiten formar, fijar, equilibrar y leer cada aguja?' }],
    datums: [{ id: 'datum.manufacturing.hand-axis', title: 'Eje del cañón', controls: ['Concentricidad.', 'Planitud del cuerpo.', 'Altura de montaje.'] }],
    toleranceDecisions: [{ id: 'tolerance.manufacturing.hand-fit', requirement: 'El ajuste retiene sin dañar el eje y permite montaje controlado.', verification: 'Galga o ensayo de inserción definido para el componente real.' }],
    acceptanceCriteria: [A('acceptance.manufacturing.hand-clearance', 'Agujas sin interferencias', ['Holgura entre agujas, esfera y cristal.', 'Retención y concentricidad aceptadas.', 'Lectura suficiente en posiciones previstas.'])],
    sourceIds: ['source.miyota.8215.official', 'source.iso.1101', 'source.w3c.wcag22'],
    physicalBoundary: 'La fuerza de montaje, el ajuste del tubo y el balance se verifican sobre componentes reales con útiles adecuados.',
  },
  {
    id: 'process.manufacturing.plates-bridges', title: { es: 'Platinas, puentes, apoyos y rubíes' }, artifactKinds: ['mainplate', 'bridge'],
    purpose: 'Planificar referencias, centros, alojamientos, espigas, tornillos, rubíes, rigidez y secuencia de acabado.',
    operations: [
      O('operation.manufacturing.plate-coordinate-plan', 'Definir coordenadas y apoyos', 'Relacionar tren, barrilete, escape, puentes y montaje.', 'Arquitectura aprobada.', 'Plano maestro de centros y apoyos.', ['hazard.manufacturing.sharp-tools-swarf'], ['inspection.manufacturing.revision-datums']),
      O('operation.manufacturing.plate-machine', 'Mecanizar referencias y alojamientos', 'Preservar posiciones, perpendicularidad y material para acabado.', 'Material y plano.', 'Platina o puente mecanizado.', ['hazard.manufacturing.rotating-machinery', 'hazard.manufacturing.metalworking-fluids'], ['inspection.manufacturing.in-process', 'inspection.manufacturing.critical-dimensions']),
      O('operation.manufacturing.plate-jewel-finish', 'Preparar rubíes, roscas y acabado', 'Evitar deformar apoyos y perder datums durante decoración y montaje.', 'Pieza mecanizada.', 'Pieza terminada para ensamblaje.', ['hazard.manufacturing.abrasive-dust', 'hazard.manufacturing.chemicals-coatings'], ['inspection.manufacturing.fit-clearance', 'inspection.manufacturing.surface-finish', 'inspection.manufacturing.traceability']),
    ],
    materialDecisions: [{ id: 'material.manufacturing.plate', question: '¿Material y estado proporcionan rigidez, estabilidad, mecanizado, protección y acabado compatibles?' }],
    datums: [{ id: 'datum.manufacturing.plate-master', title: 'Plano maestro y par de referencias', controls: ['Centros de ruedas.', 'Perpendicularidad de pivotes.', 'Posición de puentes y espigas.'] }],
    toleranceDecisions: [{ id: 'tolerance.manufacturing.pivot-centres', requirement: 'Centros y alineación permiten juego axial y radial funcional.', verification: 'Inspección de coordenadas y prueba incremental sin forzar puentes.' }],
    acceptanceCriteria: [A('acceptance.manufacturing.plate-supports', 'Sistema de apoyos verificable', ['Puentes asientan sin balanceo.', 'Pivotes giran con libertad prevista.', 'Rubíes, tornillos y espigas conservan trazabilidad.'])],
    sourceIds: ['source.iso.1101', 'source.iso.286-1', 'source.iso.14253-1', 'source.private.horologia-book'],
    physicalBoundary: 'El ajuste de rubíes, centros y puentes requiere medición, herramientas y revisión relojera reales.',
  },
  {
    id: 'process.manufacturing.micromechanics', title: { es: 'Micromecánica: ejes, piñones, tornillos y muelles' }, artifactKinds: ['micromechanical-part'],
    purpose: 'Planificar piezas pequeñas por función, material, tratamiento, sujeción, acabado, inspección y riesgo de pérdida.',
    operations: [
      O('operation.manufacturing.micro-blank', 'Preparar bruto y sobrematerial', 'Asegurar identidad, sujeción y referencias viables.', 'Barra, chapa o alambre identificado.', 'Bruto trazable.', ['hazard.manufacturing.rotating-machinery', 'hazard.manufacturing.sharp-tools-swarf'], ['inspection.manufacturing.incoming-material']),
      O('operation.manufacturing.micro-form', 'Generar forma funcional', 'Crear pivotes, perfiles, roscas, dientes o elasticidad sin perder referencia.', 'Bruto preparado.', 'Pieza formada antes de tratamiento.', ['hazard.manufacturing.rotating-machinery', 'hazard.manufacturing.metalworking-fluids'], ['inspection.manufacturing.in-process', 'inspection.manufacturing.critical-dimensions']),
      O('operation.manufacturing.micro-treat-finish', 'Tratar, terminar e inspeccionar', 'Obtener propiedades y superficie preservando geometría.', 'Pieza formada.', 'Pieza final registrada.', ['hazard.manufacturing.heat-flame', 'hazard.manufacturing.abrasive-dust'], ['inspection.manufacturing.surface-finish', 'inspection.manufacturing.traceability']),
    ],
    materialDecisions: [{ id: 'material.manufacturing.micro', question: '¿Material, tratamiento y dureza responden a contacto, fatiga, elasticidad y posibilidad de acabado?' }],
    datums: [{ id: 'datum.manufacturing.micro-axis', title: 'Eje o interfaz funcional principal', controls: ['Concentricidad de escalones.', 'Longitud funcional.', 'Superficie de contacto.'] }],
    toleranceDecisions: [{ id: 'tolerance.manufacturing.micro-function', requirement: 'La tolerancia se asigna al contacto o movimiento, no al tamaño visual.', verification: 'Método de medida o galga definido antes del tratamiento final.' }],
    acceptanceCriteria: [A('acceptance.manufacturing.micro-function', 'Pieza micromecánica aceptable', ['Geometría crítica verificada.', 'Tratamiento y acabado trazables.', 'Prueba funcional definida sin sobrecarga.'])],
    sourceIds: ['source.iso.286-1', 'source.iso.1101', 'source.iso.21920-1', 'source.niosh.machine-safety'],
    physicalBoundary: 'La teoría no sustituye entrenamiento en torno relojero, afilado, tratamiento térmico ni control de piezas pequeñas.',
  },
  {
    id: 'process.manufacturing.decoration', title: { es: 'Acabados y decoración funcionalmente seguros' }, artifactKinds: ['decorated-surface', 'bridge', 'mainplate', 'case', 'dial', 'hands'],
    purpose: 'Elegir textura, dirección, secuencia, reservas y protección sin degradar datums, ajustes, espesores o limpieza.',
    operations: [
      O('operation.manufacturing.finish-specify', 'Especificar acabado y límites', 'Definir intención, zonas, textura, dirección y muestra.', 'Pieza diseñada.', 'Mapa de acabado revisado.', ['hazard.manufacturing.abrasive-dust'], ['inspection.manufacturing.revision-datums']),
      O('operation.manufacturing.finish-prepare', 'Preparar superficie y enmascarar', 'Eliminar defectos compatibles y proteger superficies funcionales.', 'Pieza mecanizada.', 'Superficie preparada.', ['hazard.manufacturing.abrasive-dust', 'hazard.manufacturing.chemicals-coatings'], ['inspection.manufacturing.in-process']),
      O('operation.manufacturing.finish-apply-inspect', 'Aplicar, limpiar e inspeccionar', 'Crear acabado repetible sin contaminación ni redondeo funcional.', 'Superficie preparada.', 'Pieza decorada y aceptada.', ['hazard.manufacturing.abrasive-dust', 'hazard.manufacturing.heat-flame', 'hazard.manufacturing.chemicals-coatings'], ['inspection.manufacturing.surface-finish', 'inspection.manufacturing.critical-dimensions', 'inspection.manufacturing.traceability']),
    ],
    materialDecisions: [{ id: 'material.manufacturing.finish-compatibility', question: '¿El material, recubrimiento y estado superficial aceptan el proceso y la limpieza sin degradación?' }],
    datums: [{ id: 'datum.manufacturing.finish-reserve', title: 'Superficies funcionales protegidas', controls: ['Asientos y roscas.', 'Alojamientos y planos de apoyo.', 'Bordes y espesores críticos.'] }],
    toleranceDecisions: [{ id: 'tolerance.manufacturing.finish-stock', requirement: 'El material retirado o añadido no invalida ajustes ni geometría.', verification: 'Medición antes/después o muestra de proceso cuando sea necesario.' }],
    acceptanceCriteria: [A('acceptance.manufacturing.finish-consistent', 'Acabado coherente y seguro', ['Patrón, dirección y límites coherentes.', 'Superficies funcionales preservadas.', 'Defectos, retoques y limpieza registrados.'])],
    sourceIds: ['source.iso.21920-1', 'source.iso.3160-2', 'source.osha.metalworking-fluids', 'source.private.horologia-book'],
    physicalBoundary: 'Anglage, pulido negro, perlado, Côtes, azulado y recubrimientos requieren muestras, seguridad y revisión física; la pantalla no valida textura ni planitud.',
  },
].map((value) => ManufacturingProcessPlanSchema.parse(value))

ManufacturingHazardSchema.array().parse(MANUFACTURING_HAZARDS)
ManufacturingInspectionSchema.array().parse(MANUFACTURING_INSPECTIONS)

export function manufacturingProcessPlan(id: string): ManufacturingProcessPlan | undefined {
  return MANUFACTURING_PROCESS_PLANS.find((plan) => plan.id === id)
}

export function validateManufacturingCatalog(): string[] {
  const hazardIds = new Set(MANUFACTURING_HAZARDS.map(({ id }) => id))
  const inspectionIds = new Set(MANUFACTURING_INSPECTIONS.map(({ id }) => id))
  return MANUFACTURING_PROCESS_PLANS.flatMap((plan) => [
    ...plan.operations.flatMap((operation) => operation.hazardIds.filter((id) => !hazardIds.has(id)).map((id) => `${plan.id}: riesgo desconocido ${id}`)),
    ...plan.operations.flatMap((operation) => operation.inspectionIds.filter((id) => !inspectionIds.has(id)).map((id) => `${plan.id}: inspección desconocida ${id}`)),
  ])
}
