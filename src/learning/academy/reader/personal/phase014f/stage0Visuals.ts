import { academyReaderStableHash } from '../../academyReaderIdentity'
import type { AcademySourceLocator, AcademyStage0PhotoBrief, AcademyStage0VisualDesign } from '../types'

const bulovaLocator = (page: string, figure?: string): AcademySourceLocator => ({
  sourceId: 'source.private.bulova.preliminary',
  documentLocator: 'reference-library/originals/Joseph Bulova School of Watch Making.pdf',
  page,
  ...(figure ? { figure } : {}),
  verificationMethod: 'visual-pdf-inspection',
  verifiedAt: '2026-08-15',
})

type VisualInput = Omit<AcademyStage0VisualDesign, 'contentHash' | 'visualHash'>

const visual = (input: VisualInput): AcademyStage0VisualDesign => ({
  ...input,
  contentHash: academyReaderStableHash([input.pedagogicalQuestion, input.longDescription, ...input.limitations].join('\n')),
  visualHash: academyReaderStableHash(JSON.stringify(input.semanticPayload)),
})

export const ACADEMY_STAGE_0_VISUAL_DESIGNS: readonly AcademyStage0VisualDesign[] = [
  visual({
    visualDesignId: 'visual.stage0.bench-map.v1',
    lessonIds: ['lesson.quartz2035.workstation'],
    sectionIds: ['reader.section.block.quartz2035.workstation.014f-mapa-del-banco'],
    pedagogicalQuestion: '¿Dónde debe estar cada elemento para que una pausa no destruya el estado de la sesión?',
    semanticPayload: {
      title: 'Mapa de un banco recuperable',
      nodes: [
        { id: 'active', label: 'Zona activa', detail: 'Una pieza y su soporte', lane: 'trabajo', emphasis: 'primary' },
        { id: 'tools', label: 'Herramientas', detail: 'Fuera de la trayectoria de las manos', lane: 'preparación' },
        { id: 'parts', label: 'Piezas retiradas', detail: 'Bandeja y compartimentos ordenados', lane: 'control' },
        { id: 'waste', label: 'Residuos', detail: 'Separados y sin retorno', lane: 'control', emphasis: 'warning' },
        { id: 'record', label: 'Foto y nota', detail: 'Estado inicial y punto de parada', lane: 'documentación' },
        { id: 'cover', label: 'Cubrir y pausar', detail: 'Sesión recuperable', lane: 'documentación' },
      ],
      edges: [
        { from: 'tools', to: 'active', label: 'solo el útil necesario', kind: 'decision' },
        { from: 'active', to: 'parts', label: 'retirada ordenada', kind: 'mechanical' },
        { from: 'active', to: 'waste', label: 'material no reutilizable', kind: 'decision' },
        { from: 'record', to: 'active', label: 'orientación inicial', kind: 'comparison' },
        { from: 'parts', to: 'cover', label: 'recuento', kind: 'decision' },
        { from: 'record', to: 'cover', label: 'último estado', kind: 'decision' },
      ],
      annotations: ['Las posiciones son conceptuales y se adaptan al espacio disponible.'],
    },
    sourceIds: ['source.private.bulova.preliminary'],
    sourceLocators: [bulovaLocator('PDF 5 / impresa 3'), bulovaLocator('PDF 6 / impresa 4', 'Fig. 1')],
    fidelity: 'conceptual',
    limitations: ['No representa escala, mobiliario obligatorio ni una distribución profesional universal.'],
    accessibilitySummary: 'Cuatro zonas, una ruta de documentación y una pausa; etiquetas y conexiones no dependen del color.',
    longDescription: 'El diagrama separa zona activa, herramientas, piezas y residuos. Foto y nota alimentan la orientación inicial. El recuento de piezas y el último estado convergen en cubrir y pausar la sesión.',
    implementationStatus: 'implemented',
    colorIndependent: true,
    reducedMotionSafe: true,
  }),
  visual({
    visualDesignId: 'visual.stage0.eye-loupe-part-axis.v1',
    lessonIds: ['lesson.quartz2035.tools', 'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion'],
    sectionIds: [
      'reader.section.block.quartz2035.tools.014f-lupa-eje-visual',
      'reader.section.block.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion.014f-luz-y-aumento',
    ],
    pedagogicalQuestion: '¿Cómo conservar contexto y postura al alinear ojo, lupa y pieza?',
    semanticPayload: {
      title: 'Eje de observación',
      nodes: [
        { id: 'eye', label: 'Ojo', detail: 'Postura estable', emphasis: 'primary' },
        { id: 'loupe', label: 'Lupa', detail: 'Aumento elegido por la pregunta' },
        { id: 'part', label: 'Pieza apoyada', detail: 'Orientación conocida' },
        { id: 'light', label: 'Luz', detail: 'Dirección controlada' },
        { id: 'context', label: 'Campo general', detail: 'Permite volver a orientarse' },
        { id: 'detail', label: 'Detalle', detail: 'Se comprueba cambiando una condición' },
      ],
      edges: [
        { from: 'eye', to: 'loupe', label: 'línea cómoda', kind: 'mechanical' },
        { from: 'loupe', to: 'part', label: 'campo de visión', kind: 'mechanical' },
        { from: 'light', to: 'part', label: 'incidencia', kind: 'mechanical' },
        { from: 'context', to: 'detail', label: 'aumentar con intención', kind: 'decision' },
        { from: 'detail', to: 'context', label: 'recuperar orientación', kind: 'decision' },
      ],
    },
    sourceIds: ['source.private.bulova.preliminary'],
    sourceLocators: [bulovaLocator('PDF 6 / impresa 4', 'Fig. 1'), bulovaLocator('PDF 7 / impresa 5', 'Fig. 4')],
    fidelity: 'conceptual',
    limitations: ['No prescribe aumento, distancia ocular ni postura médica universal.'],
    accessibilitySummary: 'Cadena lineal ojo–lupa–pieza con luz lateral y retorno entre campo general y detalle.',
    longDescription: 'Ojo, lupa y pieza forman un eje de observación. La luz llega a la pieza desde un lado. El alumno alterna campo general y detalle para no perder orientación.',
    implementationStatus: 'implemented',
    colorIndependent: true,
    reducedMotionSafe: true,
  }),
  visual({
    visualDesignId: 'visual.stage0.tweezers-control.v1',
    lessonIds: ['lesson.quartz2035.tools', 'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion', 'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica'],
    sectionIds: [
      'reader.section.block.quartz2035.tools.014f-pinzas-contacto',
      'reader.section.block.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion.014f-manipulacion-minima',
      'reader.section.block.encyclopedia.workshop-tools-materials.bulova-destreza-basica.014f-pinzas-controladas',
    ],
    pedagogicalQuestion: '¿Qué cambia entre un contacto controlado y una pieza expulsada por las pinzas?',
    semanticPayload: {
      title: 'Control de pinzas',
      nodes: [
        { id: 'tips', label: 'Puntas alineadas', detail: 'Contacto simétrico' },
        { id: 'robust', label: 'Zona robusta', detail: 'Lejos de superficies funcionales', emphasis: 'primary' },
        { id: 'low', label: 'Trabajo bajo', detail: 'Sobre bandeja contenida' },
        { id: 'minimum', label: 'Presión mínima', detail: 'Solo evita la caída' },
        { id: 'transfer', label: 'Traslado corto', detail: 'Recorrido visible' },
        { id: 'stop', label: 'Parar', detail: 'Cruce, giro o expulsión', emphasis: 'warning' },
      ],
      edges: [
        { from: 'tips', to: 'robust', label: 'presentar', kind: 'mechanical' },
        { from: 'robust', to: 'minimum', label: 'cerrar', kind: 'mechanical' },
        { from: 'low', to: 'transfer', label: 'contener', kind: 'decision' },
        { from: 'minimum', to: 'transfer', label: 'control estable', kind: 'mechanical' },
        { from: 'minimum', to: 'stop', label: 'pieza rota o sale', kind: 'decision' },
      ],
    },
    sourceIds: ['source.private.bulova.preliminary'],
    sourceLocators: [bulovaLocator('PDF 7 / impresa 5', 'Fig. 2'), bulovaLocator('PDF 9 / impresa 7', 'Fig. 6')],
    fidelity: 'conceptual',
    limitations: ['No representa una pieza concreta, una fuerza admisible ni una técnica certificada.'],
    accessibilitySummary: 'Secuencia con cinco condiciones de control y una salida de parada, comprensible por texto y forma.',
    longDescription: 'Las puntas alineadas llegan a una zona robusta. La pieza permanece baja sobre una bandeja, se sujeta con presión mínima y recorre una distancia corta. Cruce, giro o expulsión conducen a detenerse.',
    implementationStatus: 'implemented',
    colorIndependent: true,
    reducedMotionSafe: true,
  }),
  visual({
    visualDesignId: 'visual.stage0.screwdriver-fit.v1',
    lessonIds: ['lesson.quartz2035.tools', 'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica'],
    sectionIds: [
      'reader.section.block.quartz2035.tools.014f-destornillador-ajuste',
      'reader.section.block.encyclopedia.workshop-tools-materials.bulova-destreza-basica.014f-tornillos-entrenamiento',
    ],
    pedagogicalQuestion: '¿Cómo se reconoce un apoyo estable antes de girar un tornillo de entrenamiento?',
    semanticPayload: {
      title: 'Ajuste de hoja y ranura',
      nodes: [
        { id: 'narrow', label: 'Hoja estrecha', detail: 'Concentra contacto', lane: 'rechazar', emphasis: 'warning' },
        { id: 'wide', label: 'Hoja ancha', detail: 'No asienta', lane: 'rechazar', emphasis: 'warning' },
        { id: 'fit', label: 'Hoja ajustada', detail: 'Apoyo uniforme', lane: 'aceptar', emphasis: 'primary' },
        { id: 'vertical', label: 'Alineación', detail: 'Sin balanceo', lane: 'aceptar' },
        { id: 'short', label: 'Giro corto', detail: 'Volver a observar', lane: 'comprobar' },
        { id: 'damage', label: 'Marca o resbalón', detail: 'Detener', lane: 'comprobar', emphasis: 'warning' },
      ],
      edges: [
        { from: 'narrow', to: 'damage', label: 'riesgo', kind: 'decision' },
        { from: 'wide', to: 'damage', label: 'riesgo', kind: 'decision' },
        { from: 'fit', to: 'vertical', label: 'presentar', kind: 'mechanical' },
        { from: 'vertical', to: 'short', label: 'estable', kind: 'mechanical' },
        { from: 'short', to: 'damage', label: 'si cambia la ranura', kind: 'decision' },
      ],
    },
    sourceIds: ['source.private.bulova.preliminary'],
    sourceLocators: [bulovaLocator('PDF 7 / impresa 5', 'Fig. 3'), bulovaLocator('PDF 9 / impresa 7', 'Fig. 7')],
    fidelity: 'conceptual',
    limitations: ['No muestra medidas, par, geometría de afilado ni un tornillo de reloj específico.'],
    accessibilitySummary: 'Comparación de dos rechazos y una ruta aceptable, con etiquetas explícitas y sin dependencia cromática.',
    longDescription: 'Hoja estrecha y hoja ancha conducen a riesgo de marca. La hoja ajustada pasa por alineación, un giro corto y una nueva observación. Cualquier resbalón conduce a parada.',
    implementationStatus: 'implemented',
    colorIndependent: true,
    reducedMotionSafe: true,
  }),
  visual({
    visualDesignId: 'visual.stage0.parts-session-control.v1',
    lessonIds: ['lesson.quartz2035.workstation', 'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad'],
    sectionIds: [
      'reader.section.block.quartz2035.workstation.014f-estado-de-la-sesion',
      'reader.section.block.encyclopedia.workshop-tools-materials.banco-y-seguridad.014f-control-de-piezas',
    ],
    pedagogicalQuestion: '¿Qué información permite reanudar una sesión sin depender de la memoria?',
    semanticPayload: {
      title: 'Control de piezas y sesión',
      nodes: [
        { id: 'photo', label: 'Fotografía inicial', detail: 'Orientación y recuento' },
        { id: 'sequence', label: 'Compartimentos', detail: 'Orden de retirada', emphasis: 'primary' },
        { id: 'note', label: 'Nota de estado', detail: 'Última acción confirmada' },
        { id: 'cover', label: 'Bandeja cubierta', detail: 'Pausa protegida' },
        { id: 'compare', label: 'Comparar al volver', detail: 'Foto, nota y piezas' },
        { id: 'resume', label: 'Reanudar', detail: 'Solo si todo coincide' },
        { id: 'stop', label: 'Mantener la pausa', detail: 'Si falta o no coincide', emphasis: 'warning' },
      ],
      edges: [
        { from: 'photo', to: 'sequence', kind: 'comparison' },
        { from: 'sequence', to: 'note', label: 'actualizar', kind: 'decision' },
        { from: 'note', to: 'cover', label: 'cerrar', kind: 'decision' },
        { from: 'photo', to: 'compare', kind: 'comparison' },
        { from: 'note', to: 'compare', kind: 'comparison' },
        { from: 'cover', to: 'compare', kind: 'comparison' },
        { from: 'compare', to: 'resume', label: 'coincide', kind: 'decision' },
        { from: 'compare', to: 'stop', label: 'duda o falta', kind: 'decision' },
      ],
    },
    sourceIds: ['source.private.bulova.preliminary'],
    sourceLocators: [bulovaLocator('PDF 5 / impresa 3'), bulovaLocator('PDF 7 / impresa 5', 'Fig. 4')],
    fidelity: 'conceptual',
    limitations: ['No sustituye una hoja de servicio ni prescribe el orden de desmontaje de un calibre.'],
    accessibilitySummary: 'Flujo de cierre y reanudación con salida explícita de no continuar.',
    longDescription: 'Fotografía, compartimentos y nota construyen un estado. La bandeja se cubre. Al volver se comparan las tres evidencias; solo la coincidencia conduce a reanudar y cualquier duda mantiene la pausa.',
    implementationStatus: 'implemented',
    colorIndependent: true,
    reducedMotionSafe: true,
  }),
  visual({
    visualDesignId: 'visual.bench.contamination-transfer.v1',
    lessonIds: ['lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza'],
    sectionIds: ['reader.section.block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.014f-mapa-de-transferencia'],
    pedagogicalQuestion: '¿Cómo llega un contaminante a una pieza y dónde puede interrumpirse la ruta?',
    semanticPayload: {
      title: 'Mapa de contaminación del banco',
      nodes: [
        { id: 'hands', label: 'Manos', detail: 'Contacto directo o cruzado', lane: 'fuentes', emphasis: 'warning' },
        { id: 'air', label: 'Aire y fibras', detail: 'Depósito visible o no visible', lane: 'fuentes' },
        { id: 'tools', label: 'Herramientas', detail: 'Puente de transferencia', lane: 'puentes' },
        { id: 'bench', label: 'Banco', detail: 'Superficie compartida', lane: 'puentes' },
        { id: 'container', label: 'Recipiente', detail: 'Puede proteger o transferir', lane: 'puentes' },
        { id: 'part', label: 'Pieza', detail: 'Destino que se protege', lane: 'destino', emphasis: 'primary' },
        { id: 'control', label: 'Punto de control', detail: 'Separar, cubrir, comprobar y registrar', lane: 'control' },
      ],
      edges: [
        { from: 'hands', to: 'tools', label: 'contacto', kind: 'mechanical' },
        { from: 'hands', to: 'bench', label: 'contacto', kind: 'mechanical' },
        { from: 'air', to: 'bench', label: 'depósito', kind: 'mechanical' },
        { from: 'air', to: 'part', label: 'depósito', kind: 'mechanical' },
        { from: 'tools', to: 'part', label: 'contacto', kind: 'mechanical' },
        { from: 'bench', to: 'container', label: 'apoyo', kind: 'mechanical' },
        { from: 'container', to: 'part', label: 'contacto', kind: 'mechanical' },
        { from: 'control', to: 'tools', label: 'interrumpir', kind: 'decision' },
        { from: 'control', to: 'container', label: 'interrumpir', kind: 'decision' },
        { from: 'control', to: 'part', label: 'proteger', kind: 'decision' },
      ],
    },
    sourceIds: ['source.institutional.awci.standards', 'source.private.daniels.workshop-equipment'],
    sourceLocators: [
      { sourceId: 'source.institutional.awci.standards', documentLocator: 'Registro canónico 0.14A · estándares institucionales AWCI', section: 'workshop practices', verificationMethod: 'source-limited' },
      { sourceId: 'source.private.daniels.workshop-equipment', documentLocator: 'reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf', section: 'Workshop and Equipment', verificationMethod: 'curated-inventory' },
    ],
    fidelity: 'conceptual',
    limitations: ['No representa un contaminante concreto, una compatibilidad química ni un método de limpieza.'],
    accessibilitySummary: 'Tres carriles de fuentes, puentes y destino, con un control que corta varias rutas.',
    longDescription: 'Manos y aire alimentan herramientas, banco y pieza. Herramientas, banco y recipiente pueden llevar contaminación a la pieza. Un punto de control separa, cubre, comprueba y registra para cortar esas rutas.',
    implementationStatus: 'reused-and-versioned',
    colorIndependent: true,
    reducedMotionSafe: true,
  }),
] as const

const PHOTO_BRIEF_ROWS = [
  ['photo-brief.stage0.posture-loupe', 'Postura real con lupa', 'Plano medio y detalle de apoyo', 'Lateral y tres cuartos', 'Difusa, sin reflejos fuertes', 'Banco real ordenado', 'Eje ojo–lupa–pieza y apoyo de antebrazos', 'Postura estable frente a cuello flexionado', ['altura de asiento', 'altura de trabajo', 'lupa usada'], ['No presentar una postura como universal ni ocultar adaptaciones'], 'Fotografía propia o encargada con licencia explícita'],
  ['photo-brief.stage0.tweezers-contact', 'Contacto real de pinzas sobre pieza de práctica', 'Macro con referencia de tamaño', 'Oblicuo que muestre ambas puntas', 'Lateral suave', 'Bandeja mate', 'Punto robusto, presión y alineación de puntas', 'Contacto controlado frente a cruce de puntas', ['tipo de pinzas', 'pieza de práctica', 'aumento'], ['No aparentar contacto seguro sobre una pieza funcional frágil'], 'Fotografía propia o encargada con licencia explícita'],
  ['photo-brief.stage0.screwdriver-slot', 'Hoja asentada en ranura de entrenamiento', 'Macro con escala declarada', 'Perfil y vista superior', 'Rasante controlada', 'Placa de entrenamiento', 'Ancho de hoja, apoyo y alineación', 'Hoja ajustada frente a estrecha y ancha', ['hoja', 'ranura', 'tornillo de práctica'], ['No inferir par ni medida oficial'], 'Fotografía propia o encargada con licencia explícita'],
  ['photo-brief.stage0.screw-damage', 'Daño real de ranura', 'Macro con escala', 'Superior y rasante', 'Rasante para mostrar rebaba', 'Fondo neutro', 'Resbalón, borde deformado y contraste con ranura sana', 'Antes y después sobre tornillo descartado', ['causa conocida', 'número de intentos', 'herramienta'], ['No atribuir causalidad si no fue documentada'], 'Fotografía propia o encargada con licencia explícita'],
  ['photo-brief.stage0.fingerprint-contamination', 'Huella real sobre superficie de práctica', 'Macro con escala', 'Rasante y normal', 'Rasante y difusa', 'Fondo oscuro mate', 'Diferencia entre huella, fibra y reflejo', 'Superficie controlada antes y después', ['material', 'luz', 'método de captura'], ['No mostrar una pieza valiosa ni afirmar limpieza química'], 'Fotografía propia o encargada con licencia explícita'],
] as const

export const ACADEMY_STAGE_0_PHOTO_BRIEFS: readonly AcademyStage0PhotoBrief[] = PHOTO_BRIEF_ROWS.map(([photoBriefId, subject, scale, angle, lighting, background, requiredDetail, comparison, metadata, avoidConfusionWith, authorshipAndLicense]) => ({
  photoBriefId, subject, scale, angle, lighting, background, requiredDetail, comparison, metadata, avoidConfusionWith, authorshipAndLicense,
  status: 'future-real-photo-required' as const,
}))

const visualBySectionId = new Map(ACADEMY_STAGE_0_VISUAL_DESIGNS.flatMap((design) => design.sectionIds.map((sectionId) => [sectionId, design] as const)))

export function academyStage0VisualForSection(sectionId: string): AcademyStage0VisualDesign | undefined {
  return visualBySectionId.get(sectionId)
}
