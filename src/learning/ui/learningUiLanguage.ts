import type { FidelityProfile } from '../fidelity'
import type { ActivityPedagogicalContract } from '../content/authoring'

const FRIENDLY_TERMS: Record<string, string> = {
  guided: 'Guiada',
  assisted: 'Con ayuda',
  free: 'Libre',
  installed: 'Instalada',
  exposed: 'Visible',
  selected: 'Seleccionada',
  loosened: 'Aflojada',
  removed: 'Retirada',
  inspected: 'Inspeccionada',
  'placed-in-tray': 'En la bandeja',
  'ready-to-install': 'Lista para instalar',
  aligned: 'Alineada',
  'installed-unverified': 'Instalada, pendiente de comprobar',
  'installed-verified': 'Instalada y comprobada',
  'as-installed': 'Como está instalada',
  'top-up': 'Cara superior arriba',
  'bottom-up': 'Cara inferior arriba',
  rotated: 'Girada',
  energy: 'Energía',
  'gear-pair': 'Par de engranajes',
  automatic: 'Carga automática',
  integration: 'Integración del movimiento',
  neutral: 'Posición neutra',
  'time-setting': 'Puesta en hora',
  'mainspring-discharged': 'Muelle descargado',
  'barrel-blocked': 'Barrilete bloqueado',
  'missing-mesh': 'Engrane interrumpido',
  'incorrect-ratio': 'Relación de engranajes incorrecta',
  'pivot-outside-jewel': 'Pivote fuera del rubí',
  'wheel-no-freedom': 'Rueda sin libertad de giro',
  'escapement-blocked': 'Escape bloqueado',
  'pallet-no-alternation': 'Áncora sin alternancia',
  'balance-blocked': 'Volante bloqueado',
  'low-amplitude-conceptual': 'Amplitud conceptual baja',
  'hairspring-rubbing': 'Espiral rozando',
  'motion-works-disconnected': 'Minutería desconectada',
  'wrong-crown-position': 'Corona en posición incorrecta',
  'automatic-disconnected': 'Carga automática desconectada',
  'calendar-blocked': 'Calendario bloqueado',
  'hands-rubbing': 'Agujas rozando',
  'hold-movement': 'Sujetar el movimiento',
  'engage-fastener': 'Encajar el tornillo',
  'loosen-fastener': 'Aflojar el tornillo',
  'tighten-fastener': 'Apretar el tornillo',
  'pick-part': 'Tomar una pieza',
  'place-part': 'Colocar una pieza',
  'rotate-part': 'Girar una pieza',
  'remove-hands': 'Retirar las agujas',
  'install-hands': 'Instalar las agujas',
  inspect: 'Inspeccionar',
  'remove-loose-dust': 'Retirar polvo suelto',
  'measure-dimension': 'Medir una dimensión',
  'check-electrical-conceptually': 'Comprobar el circuito de forma conceptual',
  complete: 'Vista completa',
  'dial-side': 'Lado de la esfera',
  side: 'Vista lateral',
  exploded: 'Vista explosionada',
  provenance: 'Fuentes y procedencia',
  'energy-route': 'Ruta de energía',
  textual: 'Vista textual',
  normal: 'Vista normal',
  schematic: 'Esquema',
  section: 'Vista en corte',
  'energy-flow': 'Flujo de energía',
  kinematics: 'Movimiento coordinado',
  'step-by-step': 'Paso a paso',
  'compare-8215': 'Comparar con MIYOTA 8215',
  'functional-continuity': 'Continuidad funcional',
  alignment: 'Alineación',
  'supports-present': 'Apoyos presentes',
  'part-identity': 'Identidad de la pieza',
  'fastener-identity': 'Identidad del tornillo',
  orientation: 'Orientación',
  'calendar-state': 'Estado del calendario',
  'stem-state': 'Estado de la tija',
  'rotor-presence': 'Rotor presente',
  'assembly-restored': 'Montaje restaurado',
  'does-not-start': 'No se pone en marcha',
  'train-interrupted': 'Tren interrumpido',
  'wrong-fastener': 'Tornillo incorrecto',
  'pivot-outside-support': 'Pivote fuera de su apoyo',
  supported: 'Apoyo correcto',
  'excess-axial': 'Juego axial excesivo',
  'no-freedom': 'Sin libertad de giro',
  rubbing: 'Rozamiento',
  'valid-conceptual': 'Separación conceptual válida',
  'too-far': 'Demasiado separadas',
  overlapping: 'Solapadas',
  'locked-left': 'Bloqueo izquierdo',
  'unlock-left': 'Desbloqueo izquierdo',
  'impulse-left': 'Impulso izquierdo',
  'drop-left': 'Caída izquierda',
  'locked-right': 'Bloqueo derecho',
  'unlock-right': 'Desbloqueo derecho',
  'impulse-right': 'Impulso derecho',
  'drop-right': 'Caída derecha',
  service: 'Método de servicio',
  diagnosis: 'Diagnóstico',
  planning: 'Planificación',
  'process-planning': 'Planificación de proceso',
  'simulated-review': 'Revisión simulada',
  'physical-observation': 'Observación física registrada',
  manufacturing: 'Fabricación',
  'manufacturing-dfm-datums': 'Diseño para fabricar y medir',
  'manufacturing-case': 'Fabricación de caja',
  'manufacturing-dial': 'Fabricación de esfera',
  'manufacturing-hands': 'Fabricación de agujas',
  'manufacturing-plates-bridges': 'Platinas y puentes',
  'manufacturing-micromechanics': 'Micromecánica',
  'manufacturing-decoration': 'Acabados y decoración',
  dial: 'Esfera',
  hands: 'Agujas',
  mainplate: 'Platina',
  'micromechanical-part': 'Pieza micromecánica',
  'decorated-surface': 'Superficie decorada',
  'acquired-movement-watch': 'Reloj con movimiento adquirido',
  'controlled-architecture-modification': 'Modificación arquitectónica controlada',
  'own-movement': 'Movimiento propio',
  requirements: 'Requisitos',
  concept: 'Concepto',
  architecture: 'Arquitectura',
  detail: 'Diseño de detalle',
  'prototype-plan': 'Plan de prototipo',
  release: 'Liberación',
  'watchmaker-review': 'Revisión relojera',
  'beginner-usability': 'Pruebas con principiantes',
  'calibre-transfer': 'Transferencia entre calibres',
  accessibility: 'Accesibilidad',
  'deferred-retention': 'Retención diferida',
  'guided-practice': 'Práctica guiada',
  demonstration: 'Demostración sin ayuda',
  transfer: 'Transferencia',
  'identity-and-provenance': 'Identidad y procedencia',
  'trade-offs': 'Ventajas, costes y compromisos',
  'seconds-layout': 'Disposición del segundero',
  'winding-system': 'Sistema de carga',
  serviceability: 'Facilidad de servicio',
  'bridge-layout': 'Disposición de puentes',
  'thinness-strategy': 'Estrategia de reducción de altura',
  'chronograph-control': 'Control del cronógrafo',
  'chronograph-coupling': 'Acoplamiento del cronógrafo',
  'document-table': 'Tabla documental',
  'causal-diagram': 'Diagrama causal',
  'existing-fixture': 'Modelo existente',
  'official-and-curated-secondary': 'Fuentes oficiales y secundarias curadas',
  'official-only': 'Solo fuentes oficiales',
  seconds: 'Segundos',
  winding: 'Carga automática',
  construction: 'Construcción',
  chronograph: 'Cronógrafo',
  none: 'Sin modelo disponible',
  structural: 'Modelo estructural',
  'official-plus-secondary': 'Fuentes oficiales y secundarias',
  'secondary-discovery': 'Recurso secundario para descubrir casos',
  'historical-reference': 'Referencia histórica',
  'fourth-wheel-drives-small-seconds-hand': 'La cuarta rueda mueve la aguja del pequeño segundero',
  'central-fourth-wheel-drives-centre-seconds-hand': 'La cuarta rueda central mueve la aguja del segundero',
  'fourth-wheel-meshes-with-intermediate-seconds-wheel': 'La cuarta rueda engrana con la rueda intermedia de segundos',
  'intermediate-seconds-wheel-drives-centre-seconds-pinion': 'La rueda intermedia mueve el piñón del segundero central',
  'rotor-drives-reversing-wheels': 'El rotor mueve las ruedas inversoras',
  'reversing-wheels-drive-reduction-wheel': 'Las ruedas inversoras mueven la rueda reductora',
  'reduction-wheel-winds-barrel-arbor': 'La rueda reductora da cuerda al árbol del barrilete',
  'rotor-eccentric-drives-pawl-lever': 'La excéntrica del rotor mueve la palanca de uñas',
  'pawl-lever-indexes-transmission-wheel': 'La palanca de uñas hace avanzar la rueda de transmisión',
  'transmission-wheel-winds-ratchet-wheel': 'La rueda de transmisión hace girar el rochete de carga',
  'rotor-drives-winding-train-in-one-direction': 'El rotor acciona el tren de carga en un solo sentido',
  'freewheel-releases-opposite-direction': 'La rueda libre desacopla el sentido contrario',
  'bridge-supports-wheel-set': 'El puente sostiene el conjunto de ruedas',
  'screws-retain-bridge-to-mainplate': 'Los tornillos fijan el puente a la platina',
  'height-budget-constrains-wheel-stack': 'El límite de altura condiciona el apilado de ruedas',
  'integrated-component-replaces-stacked-components': 'Una pieza integrada sustituye varias piezas apiladas',
  'escape-wheel-locks-on-pallet-stone': 'La rueda de escape se bloquea contra una paleta',
  'pallet-fork-impulses-balance': 'El áncora transmite el impulso al volante',
  'motion-works-drives-date-driving-wheel': 'La minutería mueve la rueda conductora de fecha',
  'date-finger-advances-date-ring': 'El dedo de fecha hace avanzar el disco',
  'jumper-retains-date-ring': 'El saltador posiciona el disco de fecha',
  'push-piece-actuates-operating-lever': 'El pulsador acciona la palanca de mando',
  'operating-lever-indexes-cam': 'La palanca de mando hace avanzar la leva',
  'cam-positions-coupling-and-brake': 'La leva posiciona el acoplamiento y el freno',
  'operating-lever-indexes-column-wheel': 'La palanca de mando hace avanzar la rueda de pilares',
  'columns-position-control-levers': 'Los pilares posicionan las palancas de control',
  'coupling-wheel-translates': 'La rueda de acoplamiento se desplaza lateralmente',
  'coupling-wheel-meshes-with-chronograph-wheel': 'La rueda de acoplamiento engrana con la rueda del cronógrafo',
  'clutch-surfaces-engage-axially': 'Las superficies del embrague acoplan en sentido axial',
  'clutch-drives-chronograph-wheel-coaxially': 'El embrague mueve coaxialmente la rueda del cronógrafo',
  'activity-declarative': 'Práctica guiada',
  explanation: 'Explicación',
  'conceptual-quartz': 'Reloj de cuarzo conceptual',
  'conceptual-mechanical': 'Movimiento mecánico conceptual',
  'conceptual-quartz-chain': 'Cadena funcional de cuarzo',
  'conceptual-mechanical-chain': 'Movimiento mecánico conceptual',
  'official-calibre-quartz': 'Calibre de cuarzo documentado',
  'official-calibre-mechanical': 'Calibre mecánico documentado',
  case: 'Caja',
  'motion-works': 'Minutería',
  keyless: 'Puesta en hora',
  train: 'Tren de ruedas',
  indication: 'Indicación',
  mainspring: 'Muelle real',
  barrel: 'Barrilete',
  'escape-wheel': 'Rueda de escape',
  'pallet-fork': 'Áncora',
  balance: 'Volante',
  hairspring: 'Espiral',
  'automatic-winding': 'Carga automática',
  calendar: 'Calendario',
  'power-source': 'Fuente de energía',
  'electronic-control': 'Control electrónico',
  'quartz-resonator': 'Resonador de cuarzo',
  coil: 'Bobina',
  'stepper-rotor': 'Rotor paso a paso',
  fixture: 'Modelo',
  selectors: 'Piezas interactivas',
  retained: 'Consolidada',
  official: 'Fuente oficial',
  measured: 'medido',
  reconstructed: 'reconstruido',
  estimated: 'estimado',
  conceptual: 'Modelo conceptual',
  unknown: 'desconocido',
  desconocida: 'desconocida',
  movement: 'Movimiento',
  battery: 'Pila',
  calibre: 'Calibre',
  'main-plate': 'Platina',
  bridge: 'Puente',
  structure: 'Estructura',
  escapement: 'Escape',
  oscillator: 'Oscilador',
  motor: 'Motor',
  fasteners: 'Tornillos y sujeciones',
  transmission: 'Transmisión',
  regulation: 'Regulación',
  'gear-train': 'Tren de ruedas',
  classification: 'Clasificación',
  'identify-functional-subsystems': 'Funciones de las piezas del reloj',
  documented: 'Documentada',
  'envelope-only': 'Forma general',
  'structurally-modelled': 'Estructura modelada',
  'visually-reconstructed': 'Reconstrucción visual',
  'physically-measured': 'Medida sobre una unidad',
  validated: 'Validada',
  blocked: 'Bloqueada por datos ausentes',
  'part-of': 'Forma parte de',
  supports: 'Sostiene',
  'pivots-in': 'Gira apoyada en',
  'meshes-with': 'Engrana con',
  drives: 'Mueve',
  locks: 'Bloquea',
  releases: 'Libera',
  impulses: 'Da impulso a',
  winds: 'Da cuerda a',
  sets: 'Ajusta',
  retains: 'Mantiene',
  covers: 'Cubre',
  'fastened-by': 'Fijada por',
  'remove-before': 'Se retira antes que',
  'inspect-before': 'Se revisa antes que',
  'official-miyota': 'Documentación oficial MIYOTA',
  'manufacturer-primary': 'Documentación primaria de fabricante',
  'technical-training': 'Formación técnica',
  'reference-database': 'Base de datos de referencia',
  'expert-practice': 'Práctica experta documentada',
  'educational-secondary': 'Explicación educativa secundaria',
  'community-discovery': 'Recurso de descubrimiento',
  'private-book-theory': 'Libro privado de teoría',
  'original-educational': 'Contenido educativo original',
  'official-linked': 'Fuente oficial enlazada',
  'external-linked': 'Recurso externo enlazado',
  'private-local': 'Referencia privada local',
  'user-created': 'Contenido del curso',
  shareable: 'Recurso compartible',
  source: 'Fuente original',
  'official-primary': 'Documentación oficial primaria',
  'official-historical-primary': 'Documentación oficial histórica',
  'institutional-training': 'Formación institucional',
  'institutional-textbook': 'Manual académico institucional',
  'historical-training': 'Formación histórica de taller',
  'technical-reference': 'Referencia técnica',
  'expert-observation': 'Observación experta',
  'educational-explainer': 'Explicación educativa',
  'database-index': 'Índice o base de datos',
  'historical-context': 'Contexto histórico',
  'commercial-course': 'Curso externo',
  current: 'Vigente',
  historical: 'Histórica',
  mixed: 'Contenido histórico y vigente',
  'current-reviewed': 'Revisada para uso actual',
  'historical-context-only': 'Solo contexto histórico',
  'modern-substitute-required': 'Exige sustituto moderno',
  'supervised-only': 'Solo con supervisión competente',
  'prohibited-instruction': 'Procedimiento histórico bloqueado',
  allowed: 'Uso permitido',
  'contextual-only': 'Solo para estudio contextual',
  online: 'Disponible en línea',
  partial: 'Acceso parcial o irregular',
  legacy: 'Tecnología obsoleta',
  unavailable: 'No disponible al revisar',
  local: 'Disponible localmente',
  session: 'Sesión',
  assessment: 'Evaluación',
  package: 'Contenido',
  evidence: 'Resultado guardado',
  import: 'Importación',
  runtime: 'Práctica',
  content: 'Contenido',
  active: 'En curso',
  paused: 'En pausa',
  suspended: 'Guardada',
  interrupted: 'Interrumpida',
  recovering: 'En recuperación',
  completed: 'Completada',
  cancelled: 'Cancelada',
  failed: 'Necesita atención',
  archived: 'Archivada',
  'functional-layers-observe': 'Observar las funciones del reloj',
}

export function friendlyLearningTerm(value: string): string {
  const source = value.toLowerCase()
  const normalized = value
    .trim()
    .replace(/^fixture[._-]/i, '')
    .replace(/^(?:(?:scene|step|activity|lesson|module|route)[._-])+/i, '')
    .replace(/^conceptual[._-]/i, 'conceptual-')
    .replace(/^(?:(?:term|competency|evidence|rubric)[._-])?(?:horology[._-])?/i, '')
    .toLowerCase()
    .replace(/[._\s]+/g, '-')
  if (FRIENDLY_TERMS[normalized]) return FRIENDLY_TERMS[normalized]
  if (source.includes('2035')) return 'MIYOTA 2035'
  if (source.includes('8215')) return 'MIYOTA 8215'
  return value
    .replace(/^fixture[._-]/i, '')
    .replace(/^(?:term|competency|evidence|rubric)[._-]/i, '')
    .replace(/^horology[._-]/i, '')
    .replaceAll(/[._-]+/g, ' ')
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())
}

export function friendlyDifficulty(value: string): string {
  return {
    introductory: 'Inicial',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }[value.toLowerCase()] ?? friendlyLearningTerm(value)
}

export function friendlyPedagogicalPurpose(
  value: ActivityPedagogicalContract['purpose'] | undefined,
): string {
  if (!value) return 'Práctica guiada'
  return {
    diagnostic: 'Comprobación inicial sin nota',
    'worked-example': 'Ejemplo resuelto paso a paso',
    'guided-practice': 'Práctica con ayuda',
    'completion-problem': 'Práctica con ayuda gradual',
    'independent-practice': 'Práctica independiente',
    'mastery-check': 'Comprobación de dominio',
    transfer: 'Aplicación a un caso nuevo',
    retention: 'Repaso de consolidación',
  }[value]
}

export function friendlyAssessmentIntent(
  value: ActivityPedagogicalContract['assessmentIntent'] | undefined,
): { label: string; detail: string } {
  if (value === 'none') {
    return {
      label: 'Sin evaluación',
      detail: 'Sirve para orientarte y detectar qué explicación necesitas; no cambia tu nivel.',
    }
  }
  if (value === 'demonstration') {
    return {
      label: 'Demostración de capacidad',
      detail: 'Puede aportar una demostración si se completa sin ayudas y se cumplen todos los criterios declarados.',
    }
  }
  if (value === 'retention') {
    return {
      label: 'Comprobación posterior',
      detail: 'Comprueba si recuerdas y aplicas la idea en otra sesión; no sustituye una destreza física.',
    }
  }
  return {
    label: 'Práctica formativa',
    detail: 'Te ayuda a aprender y guarda el intento, pero una respuesta correcta aislada no se presenta como dominio.',
  }
}

export function friendlyEvidenceLevel(
  value: ActivityPedagogicalContract['evidenceLevel'] | undefined,
): string {
  if (!value) return 'Resultado formativo'
  return {
    exposure: 'Primera toma de contacto',
    recognition: 'Reconocimiento de la idea o pieza',
    'causal-explanation': 'Explicación de la relación causal',
    'guided-simulation': 'Ejecución simulada con ayuda',
    'independent-simulation': 'Ejecución simulada sin ayuda',
    'physical-observation': 'Observación de una unidad física',
    transfer: 'Aplicación a una situación diferente',
  }[value]
}

export function friendlyReconstructionLevel(value: string): string {
  return {
    R0: 'Referencia documentada',
    R1: 'Forma general',
    R2: 'Ensamblaje estructural',
    R3: 'Reconstrucción visual',
    R4: 'Unidad física medida',
  }[value.toUpperCase()] ?? friendlyLearningTerm(value)
}

export function friendlyInstruction(value: string): string {
  const normalized = value.trim()
  if (/^Antes de responder, recorre la ruta numerada/i.test(normalized)) {
    return 'Observa la ruta de energía y localiza el tren de ruedas.'
  }
  if (/^Selecciona la función que corresponde al tren de ruedas/i.test(normalized)) {
    return 'Elige la función del tren de ruedas.'
  }
  if (/^Vuelve a seleccionar el tren de ruedas/i.test(normalized)) {
    return 'Comprueba la ruta completa y restaura el modelo.'
  }
  if (/^Manipula o recorre la lista equivalente/i.test(normalized)) {
    return 'Explora las piezas si lo necesitas. Después, confirma lo que has observado.'
  }
  if (/^Selecciona una entidad en la lista accesible o en el viewport/i.test(normalized)) {
    return 'Selecciona una pieza en el modelo o en la lista de piezas.'
  }
  return normalized
}

export function friendlyRecommendationReason(value: string): string {
  const source = value.trim()
  if (/^Retained exige/i.test(source)) {
    return 'Esta habilidad se confirmará más adelante con otra práctica, en una sesión distinta y mediante una comprobación independiente.'
  }
  if (/^Clasificar subsistemas sobre/i.test(source)) {
    return 'Reconoce qué función cumple cada grupo de piezas y comprueba tu respuesta sobre un modelo que siempre puedes restaurar.'
  }
  return source
    .replace(/\bfixtures?\b/gi, (match) => match.toLowerCase().endsWith('s') ? 'modelos' : 'modelo')
    .replace(/\bselectors?\b/gi, 'piezas interactivas')
    .replace(/\bparts list and exploded view\b/gi, 'lista de piezas y vista explosionada')
    .replace(/\bkeyless\b/gi, 'puesta en hora')
    .replace(/\bevidencias activas\b/gi, 'resultados guardados')
    .replace(/\bensamblaje canónico\b/gi, 'modelo de referencia')
    .replace(/\btrazable\b/gi, 'documentado paso a paso')
    .replace(/\breversible\b/gi, 'que siempre puedes restaurar')
    .replace(/\bevidencia física\b/gi, 'comprobación sobre una pieza real')
    .replace(/\bevidencia independiente\b/gi, 'una comprobación independiente')
}

export function friendlyAssessmentSummary(value: string, passed: boolean): string {
  if (/[;]|(?:\ball\b|\bexists\b|\bminimum\b)/i.test(value)) {
    return passed
      ? 'Has completado todos los pasos y la respuesta cumple los criterios de esta práctica.'
      : 'La práctica se ha guardado. Revisa los puntos señalados antes de intentarlo de nuevo.'
  }
  return value
}

export function preferredEntityIdForPrompt(
  prompt: string,
  entities: Array<{ id: string; label: string }>,
): string | undefined {
  const normalized = prompt.toLowerCase()
  const concepts: Array<[RegExp, RegExp]> = [
    [/tren|transmisi[oó]n|gear/, /train|tren|gear|rueda/],
    [/barrilete|barrel/, /barrel|barrilete/],
    [/escape/, /escape/],
    [/[aá]ncora|pallet/, /pallet|anchor|ancora|áncora/],
    [/volante|balance/, /balance|volante/],
    [/espiral|hairspring/, /hairspring|spiral|espiral/],
    [/bobina|coil/, /coil|bobina/],
    [/rotor/, /rotor/],
    [/agujas?|indicaci[oó]n|hands?/, /hand|aguja|indication|indicacion|indicación/],
    [/caja|case/, /case|caja/],
  ]
  const matcher = concepts.find(([promptPattern]) => promptPattern.test(normalized))?.[1]
  if (!matcher) return undefined
  return entities.find(({ id, label }) => matcher.test(`${id} ${label}`.toLowerCase()))?.id
}

function fidelityLevel(value: string, kind: 'geometry' | 'kinematics' | 'physics'): string {
  const number = Number(value.slice(1))
  if (kind === 'geometry') {
    if (number <= 0) return 'sin geometría evaluable'
    if (number === 1) return 'forma educativa aproximada'
    if (number === 2) return 'estructura visual reconstruida'
    return 'geometría contrastada con fuentes o mediciones'
  }
  if (kind === 'kinematics') {
    if (number <= 0) return 'sin movimiento'
    if (number === 1) return 'movimiento ilustrativo'
    if (number === 2) return 'movimiento educativo coordinado'
    return 'cinemática contrastada'
  }
  if (number <= 0) return 'sin simulación física'
  if (number === 1) return 'comportamiento físico conceptual'
  return 'comportamiento físico validado dentro de límites declarados'
}

export function friendlyFidelity(profile: FidelityProfile): {
  title: string
  summary: string
  details: string[]
} {
  const details = [
    `Forma: ${fidelityLevel(profile.geometry, 'geometry')}.`,
    `Movimiento: ${fidelityLevel(profile.kinematics, 'kinematics')}.`,
    `Física: ${fidelityLevel(profile.physics, 'physics')}.`,
  ]
  return {
    title: 'Alcance del modelo',
    summary: `${details[0]} ${details[1]} ${details[2]}`,
    details: [...details, ...profile.limitations],
  }
}

export function friendlyRuntimeStatus(
  state: string,
  hasQuestion: boolean,
): { label: string; instruction: string; tone: 'neutral' | 'action' | 'success' | 'warning' } {
  if (state === 'awaiting-interaction') {
    return hasQuestion
      ? { label: 'Tu turno', instruction: 'Elige una respuesta para continuar', tone: 'action' }
      : { label: 'Tu turno', instruction: 'Explora el modelo y confirma el paso', tone: 'action' }
  }
  if (state === 'running') return { label: 'Demostración en curso', instruction: 'Observa el cambio en el modelo', tone: 'neutral' }
  if (state === 'paused') return { label: 'Demostración en pausa', instruction: 'Puedes continuar cuando quieras', tone: 'neutral' }
  if (state === 'completed') return { label: 'Práctica completada', instruction: 'Tu progreso se ha guardado', tone: 'success' }
  if (state === 'failed') return { label: 'Necesita atención', instruction: 'La sesión se conserva y puede recuperarse', tone: 'warning' }
  return { label: 'Práctica preparada', instruction: 'Empieza por el paso destacado', tone: 'neutral' }
}

export function hasMeaningfulResponse(answer: unknown): boolean {
  if (typeof answer === 'string') return answer.trim().length > 0
  if (Array.isArray(answer)) return answer.length > 0
  if (answer && typeof answer === 'object') {
    return Object.values(answer).some((value) => hasMeaningfulResponse(value))
  }
  return typeof answer === 'number' && Number.isFinite(answer)
}
