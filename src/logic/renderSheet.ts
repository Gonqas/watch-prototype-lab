import {
  MATERIAL_PRESETS,
  MOVEMENTS,
  STEMS,
  TECHNICAL_DIALS,
} from '../data/catalog'
import {
  DATA_QUALITY_LABELS,
  VIEW_LABELS,
  type HandConfig,
  type ReliefFeature,
  type ValidationFinding,
  type ValidationResult,
  type VisualReflectionLevel,
  type WatchDesign,
  type StudioViewMode,
} from '../types'

export interface RenderSheetOptions {
  visualCrystalVisible: boolean
  visualReflectionLevel: VisualReflectionLevel
  studioViewMode: StudioViewMode
}

export interface RenderSheetExport {
  fileBase: string
  markdown: string
  json: Record<string, unknown>
}

const reflectionLabel: Record<VisualReflectionLevel, string> = {
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
  off: 'Off',
}

const viewLabel = (viewMode: WatchDesign['viewMode']) => (viewMode === 'free' ? '3/4' : VIEW_LABELS[viewMode])

const round = (value: number, digits = 3) => Number(value.toFixed(digits))

const mm = (value: number | null | undefined) => (typeof value === 'number' ? `${round(value)} mm` : 'No definido')

const yesNo = (value: boolean) => (value ? 'si' : 'no')

const escapeMd = (value: unknown) => String(value ?? '').replaceAll('|', '\\|')

const material = (id: keyof typeof MATERIAL_PRESETS) => {
  const preset = MATERIAL_PRESETS[id]
  return {
    id,
    label: preset.label,
    family: preset.family,
    color: preset.color,
    metalness: preset.metalness,
    roughness: preset.roughness,
    opacity: preset.opacity ?? null,
    clearcoat: preset.clearcoat ?? null,
    transmission: preset.transmission ?? null,
  }
}

const roleReliefs = (reliefs: ReliefFeature[], role: ReliefFeature['visualRole']) =>
  reliefs.filter((relief) => relief.visualRole === role)

const generatedPresets = (reliefs: ReliefFeature[]) =>
  Array.from(new Set(reliefs.map((relief) => relief.generatedByPreset).filter(Boolean))).join(', ') || 'manual / no declarado'

const reliefPosition = (relief: ReliefFeature) => ({
  x: round(relief.x),
  y: round(relief.y),
  radiusFromCenter: round(Math.hypot(relief.x, relief.y)),
  angleDeg: round((Math.atan2(relief.y, relief.x) * 180) / Math.PI),
  rotationDeg: round(relief.rotationDeg ?? 0),
})

const reliefKind = (relief: ReliefFeature) => {
  if (relief.height <= 0.035) return 'impreso/grabado visual bajo'
  if (relief.height <= 0.12) return 'aplicado bajo'
  return 'aplicado volumetrico'
}

const reliefSummary = (relief: ReliefFeature, result: ValidationResult) => ({
  id: relief.id,
  name: relief.label,
  type: relief.type,
  role: relief.visualRole ?? 'relief',
  text: relief.text ?? null,
  visible: true,
  color: relief.color,
  material: relief.material,
  height: round(relief.height),
  radius: round(relief.radius),
  width: round(relief.width),
  length: round(relief.length),
  opacity: relief.opacity ?? 1,
  position: reliefPosition(relief),
  finish: reliefKind(relief),
  dataQuality: relief.dataQuality,
  conflict: result.conflictIds.has(`relief:${relief.id}`),
})

const findingsFor = (findings: ValidationFinding[], pieceId: string) =>
  findings
    .filter((finding) => finding.pieceIds.includes(pieceId) || finding.id.includes(pieceId))
    .map((finding) => `${finding.severity}: ${finding.title}`)

const handSheet = (
  label: string,
  partId: 'hourHand' | 'minuteHand' | 'secondHand',
  hand: HandConfig,
  visible: boolean,
  result: ValidationResult,
) => ({
  visible,
  preset: hand.visualStyle ?? 'custom',
  length: round(hand.length),
  baseWidth: round(hand.width),
  tipWidth: round(hand.tipWidth ?? hand.width * 0.16),
  thickness: round(hand.thickness),
  zHeightOverDial: round(hand.heightOverDial),
  tubeHeight: round(hand.tubeHeight),
  outerTubeDiameter: round(hand.outerTubeDiameter),
  curvature: {
    baseHeight: round(hand.curvature.baseHeight),
    midHeight: round(hand.curvature.midHeight),
    tipHeight: round(hand.curvature.tipHeight),
    startRatio: round(hand.curvature.startRatio),
    endRatio: round(hand.curvature.endRatio),
    transition: hand.curvature.transition,
    bridge: hand.curvature.bridge,
    stepHeight: round(hand.curvature.stepHeight),
  },
  color: hand.color,
  material: hand.material,
  lume: !!hand.lume,
  counterweight: !!hand.counterweight,
  skeletonized: !!hand.skeletonized,
  fittingHole: round(hand.holeSize),
  dataQuality: hand.dataQuality,
  warnings: findingsFor(result.findings, partId),
  label,
})

const layer = (
  id: string,
  name: string,
  visible: boolean,
  color: string,
  materialName: string,
  height: number | null,
  details: Record<string, unknown>,
  conflict: boolean,
) => ({
  id,
  name,
  visible,
  color,
  material: materialName,
  height: height === null ? null : round(height),
  conflict,
  ...details,
})

const table = (rows: Array<[string, unknown]>) =>
  rows.map(([key, value]) => `| ${escapeMd(key)} | ${escapeMd(value)} |`).join('\n')

const reliefTable = (title: string, reliefs: ReliefFeature[], result: ValidationResult) => {
  if (reliefs.length === 0) return `### ${title}\n\nSin elementos.`
  return [
    `### ${title}`,
    '',
    '| Nombre | Tipo | Color | Altura | Posicion | Conflicto |',
    '| --- | --- | --- | --- | --- | --- |',
    ...reliefs.map((relief) => {
      const position = reliefPosition(relief)
      return `| ${escapeMd(relief.label)} | ${escapeMd(relief.text ?? relief.type)} | ${relief.color} | ${mm(relief.height)} | r ${mm(position.radiusFromCenter)}, ${position.angleDeg} deg | ${yesNo(result.conflictIds.has(`relief:${relief.id}`))} |`
    }),
  ].join('\n')
}

export const buildRenderSheet = (
  design: WatchDesign,
  result: ValidationResult,
  options: RenderSheetOptions,
): RenderSheetExport => {
  const exportedAt = new Date().toISOString()
  const movement = MOVEMENTS[design.movementId]
  const technicalDial = TECHNICAL_DIALS[design.dial.technicalPresetId]
  const stem = STEMS[design.stem.selectedStemId]
  const caseMaterial = material(design.materials.caseMaterial)
  const dialMaterial = material(design.materials.dialMaterial)
  const handsMaterial = material(design.materials.handsMaterial)
  const crystalMaterial = material(design.materials.crystalMaterial)
  const reliefs = design.dial.reliefs
  const indices = roleReliefs(reliefs, 'index')
  const minuteMarks = roleReliefs(reliefs, 'minute')
  const numerals = roleReliefs(reliefs, 'numeral')
  const logoText = reliefs.filter((relief) => relief.visualRole === 'logo' || relief.text)
  const textureReliefs = roleReliefs(reliefs, 'texture')
  const genericReliefs = reliefs.filter((relief) => !relief.visualRole || relief.visualRole === 'relief' || relief.visualRole === 'chapter' || relief.visualRole === 'sector')
  const activeWarnings = result.findings.filter((finding) => finding.severity !== 'ok' && finding.severity !== 'opportunity')
  const romanNumerals = numerals.filter((relief) => /^[IVXL]+$/i.test(relief.text ?? ''))
  const arabicNumerals = numerals.filter((relief) => /^\d+$/.test(relief.text ?? ''))
  const numeralType =
    romanNumerals.length > 0
      ? numerals.length >= 12
        ? 'romanos completos'
        : 'romanos parciales'
      : arabicNumerals.length > 0
        ? numerals.length >= 12
          ? 'arabigos completos'
          : 'arabigos parciales / cardinales'
        : 'sin numerales'

  const layers = [
    layer('base', 'Base', true, design.dial.visualColor ?? dialMaterial.color, dialMaterial.label, design.dial.thickness, {
      diameter: round(design.dial.commercialDiameter),
      texture: design.dial.visualTexture ?? 'none',
    }, result.conflictIds.has('dial')),
    layer('center', 'Centro hundido/elevado', design.dial.sunkenCenter, design.dial.visualColor ?? dialMaterial.color, dialMaterial.label, design.dial.sunkenDepth, {
      radius: round(design.dial.sunkenRadius),
      transition: design.dial.transition,
    }, result.conflictIds.has('dial')),
    layer('outer-ring', 'Anillo exterior', design.dial.outerRingHeight > 0, design.dial.visualAccentColor ?? dialMaterial.color, dialMaterial.label, design.dial.outerRingHeight, {
      diameter: round(design.dial.commercialDiameter),
    }, result.conflictIds.has('dial')),
    layer('hour-indices', 'Indices horarios', indices.length > 0, indices[0]?.color ?? design.dial.visualAccentColor ?? '#ffffff', indices[0]?.material ?? 'visual', null, {
      count: indices.length,
      items: indices.map((relief) => reliefSummary(relief, result)),
    }, indices.some((relief) => result.conflictIds.has(`relief:${relief.id}`))),
    layer('minute-marks', 'Marcas de minuto', minuteMarks.length > 0, minuteMarks[0]?.color ?? design.dial.visualAccentColor ?? '#ffffff', minuteMarks[0]?.material ?? 'visual', null, {
      count: minuteMarks.length,
      items: minuteMarks.map((relief) => reliefSummary(relief, result)),
    }, minuteMarks.some((relief) => result.conflictIds.has(`relief:${relief.id}`))),
    layer('numerals', 'Numerales', numerals.length > 0, numerals[0]?.color ?? design.dial.visualAccentColor ?? '#ffffff', numerals[0]?.material ?? 'visual text', null, {
      count: numerals.length,
      type: numeralType,
      items: numerals.map((relief) => reliefSummary(relief, result)),
    }, numerals.some((relief) => result.conflictIds.has(`relief:${relief.id}`))),
    layer('logo-text', 'Logo/texto', logoText.length > 0, logoText[0]?.color ?? design.dial.visualAccentColor ?? '#ffffff', logoText[0]?.material ?? 'visual text', null, {
      count: logoText.length,
      items: logoText.map((relief) => reliefSummary(relief, result)),
    }, logoText.some((relief) => result.conflictIds.has(`relief:${relief.id}`))),
    layer('reliefs', 'Relieves', genericReliefs.length > 0, genericReliefs[0]?.color ?? design.dial.visualAccentColor ?? '#ffffff', genericReliefs[0]?.material ?? 'visual relief', null, {
      count: genericReliefs.length,
      items: genericReliefs.map((relief) => reliefSummary(relief, result)),
    }, genericReliefs.some((relief) => result.conflictIds.has(`relief:${relief.id}`))),
    layer('textures', 'Grabados/texturas', textureReliefs.length > 0 || (design.dial.visualTexture ?? 'none') !== 'none', design.dial.visualAccentColor ?? '#ffffff', 'textura visual', null, {
      texture: design.dial.visualTexture ?? 'none',
      count: textureReliefs.length,
      items: textureReliefs.map((relief) => reliefSummary(relief, result)),
    }, textureReliefs.some((relief) => result.conflictIds.has(`relief:${relief.id}`))),
    layer('hand-sweep', 'Barrido de agujas', design.dial.showSweepZone, design.hands.sweepColor, 'volumen tecnico visual', result.metrics.maxHandTop - result.metrics.crystalInnerTop, {
      sweepColor: design.hands.sweepColor,
      maxHandTop: round(result.metrics.maxHandTop),
      crystalInnerTop: round(result.metrics.crystalInnerTop),
    }, result.conflictIds.has('hourHand') || result.conflictIds.has('minuteHand') || result.conflictIds.has('secondHand')),
  ]

  const renderPrompt = [
    'Render realista de un reloj de pulsera personalizado',
    `caja ${design.case.shape} de ${round(design.case.outerDiameter)} mm en ${caseMaterial.label.toLowerCase()} color ${caseMaterial.color}`,
    `altura total ${round(design.case.totalHeight)} mm`,
    `dial de ${round(design.dial.commercialDiameter)} mm en ${dialMaterial.label.toLowerCase()}, color base ${design.dial.visualColor ?? dialMaterial.color}`,
    design.dial.sunkenCenter ? `centro hundido ${round(design.dial.sunkenDepth)} mm con radio ${round(design.dial.sunkenRadius)} mm` : 'dial plano sin centro hundido',
    design.dial.outerRingHeight > 0 ? `anillo exterior elevado ${round(design.dial.outerRingHeight)} mm` : 'sin anillo exterior elevado',
    numerals.length > 0 ? `numerales ${numeralType} en ${numerals[0]?.color ?? 'color de acento'}` : 'sin numerales protagonistas',
    `agujas ${design.hands.hour.visualStyle ?? 'custom'} / ${design.hands.minute.visualStyle ?? 'custom'} en ${handsMaterial.label.toLowerCase()}`,
    design.hands.count === 3 && design.hands.secondsEnabled ? 'con segundero central visible' : 'configuracion de dos agujas sin segundero',
    `cristal ${design.crystal.type} ${options.visualCrystalVisible ? 'visible' : 'oculto para inspeccion'} con reflejos ${reflectionLabel[options.visualReflectionLevel].toLowerCase()}`,
    'corona metalica a las 3, iluminacion de estudio clara, fondo limpio tipo producto premium, materiales creibles, sombras suaves y escala de reloj real',
  ].join(', ') + '.'

  const json = {
    project: {
      name: design.name,
      notes: design.notes,
      exportedAt,
      status: result.status,
      conflicts: result.findings.filter((finding) => finding.severity === 'bad').map((finding) => finding.title),
      warnings: activeWarnings.map((finding) => ({ severity: finding.severity, title: finding.title, message: finding.message, reliability: finding.reliability })),
    },
    movement: {
      id: movement.id,
      calibre: movement.calibre,
      family: movement.type,
      function: movement.function,
      height: round(movement.height),
      size: movement.sizeLabel,
      stemPosition: movement.stemPosition,
      handFitting: movement.handFitting,
      dataQuality: movement.dataQuality,
      dataQualityLabel: DATA_QUALITY_LABELS[movement.dataQuality],
    },
    case: {
      shape: design.case.shape,
      presetId: design.case.presetId,
      outerDiameter: round(design.case.outerDiameter),
      totalHeight: round(design.case.totalHeight),
      innerDiameter: round(design.case.innerDiameter),
      interiorHeightAvailable: round(design.case.interiorHeightAvailable),
      bezelThickness: round(design.case.bezelThickness),
      wallThickness: round(design.case.wallThickness),
      backThickness: round(design.case.backThickness),
      backShape: design.case.backShape,
      crownDiameter: round(design.case.crownDiameter),
      crownTubeDiameter: round(design.case.crownTubeDiameter),
      crownThread: design.case.crownThread,
      lugWidth: round(design.case.lugWidth),
      screwCrown: design.case.screwCrown,
      material: caseMaterial,
      dataQuality: design.case.dataQuality,
    },
    crystal: {
      visibleInTechnicalStack: design.crystal.visible,
      visibleInViewer: options.visualCrystalVisible,
      type: design.crystal.type,
      thickness: round(design.crystal.thickness),
      usableInteriorHeight: round(design.crystal.usableInteriorHeight),
      diameter: round(design.crystal.diameter),
      profile: design.crystal.profile,
      material: crystalMaterial,
      transparency: round(design.crystal.transparency),
      reflectionLevel: options.visualReflectionLevel,
      reflectionLabel: reflectionLabel[options.visualReflectionLevel],
      tint: crystalMaterial.color,
      crystalClearance: round(result.metrics.crystalClearance),
      dataQuality: design.crystal.dataQuality,
    },
    dial: {
      technicalPresetId: design.dial.technicalPresetId,
      technicalPreset: {
        standardThickness: technicalDial.standardThickness,
        centerHole: technicalDial.centerHole,
        dataQuality: technicalDial.dataQuality,
      },
      commercialDiameter: round(design.dial.commercialDiameter),
      baseThickness: round(design.dial.thickness),
      centerHole: round(design.dial.centerHole),
      baseColor: design.dial.visualColor ?? dialMaterial.color,
      accentColor: design.dial.visualAccentColor ?? null,
      material: dialMaterial,
      texture: design.dial.visualTexture ?? 'none',
      sunkenCenter: design.dial.sunkenCenter,
      sunkenDepth: round(design.dial.sunkenDepth),
      sunkenRadius: round(design.dial.sunkenRadius),
      transition: design.dial.transition,
      outerRingHeight: round(design.dial.outerRingHeight),
      showDialFeet: design.dial.showDialFeet,
      showSweepZone: design.dial.showSweepZone,
      dataQuality: design.dial.dataQuality,
    },
    layers,
    indices: {
      preset: generatedPresets(indices),
      count: indices.length,
      material: indices[0]?.material ?? null,
      color: indices[0]?.color ?? null,
      items: indices.map((relief) => reliefSummary(relief, result)),
    },
    numerals: {
      type: numeralType,
      preset: generatedPresets(numerals),
      typography: 'Texto 3D vectorial interno ajustado por preset visual',
      count: numerals.length,
      material: numerals[0]?.material ?? null,
      color: numerals[0]?.color ?? null,
      finish: numerals[0] ? reliefKind(numerals[0]) : null,
      legibility: numerals.length > 0 ? 'visual alta si no hay conflicto activo' : 'no aplica',
      items: numerals.map((relief) => reliefSummary(relief, result)),
    },
    hands: {
      presetId: design.hands.presetId,
      familyId: design.hands.familyId,
      count: design.hands.count,
      secondsEnabled: design.hands.secondsEnabled,
      sweepColor: design.hands.sweepColor,
      material: handsMaterial,
      hour: handSheet('Horaria', 'hourHand', design.hands.hour, true, result),
      minute: handSheet('Minutera', 'minuteHand', design.hands.minute, true, result),
      second: handSheet('Segundero', 'secondHand', design.hands.second, design.hands.count === 3 && design.hands.secondsEnabled, result),
      dataQuality: design.hands.dataQuality,
    },
    materials: {
      case: caseMaterial,
      dial: dialMaterial,
      hands: handsMaterial,
      crystal: crystalMaterial,
      textures: {
        dialTexture: design.dial.visualTexture ?? 'none',
        hdriDesign: '/assets/realism/hdri/design_neutral.exr',
        hdriPresentation: '/assets/realism/hdri/presentation_light.exr',
      },
    },
    presentation: {
      studioViewMode: options.studioViewMode,
      currentView: design.viewMode,
      currentViewLabel: viewLabel(design.viewMode),
      background: 'fondo CSS claro de estudio / producto premium',
      hdri: options.studioViewMode === 'presentation' ? 'presentation_light.exr' : 'design_neutral.exr',
      exposure: options.studioViewMode === 'presentation' ? 0.68 : design.renderMode === 'technical' ? 0.92 : 0.82,
      gridVisible: design.renderMode === 'technical',
      crystalVisibleInViewer: options.visualCrystalVisible,
      reflectionsActive: options.visualReflectionLevel !== 'off',
      reflectionLevel: options.visualReflectionLevel,
    },
    stemAndCrown: {
      selectedStemId: design.stem.selectedStemId,
      stemReference: stem?.label ?? design.stem.selectedStemId,
      customLength: round(design.stem.customLength),
      crownInstalled: design.stem.crownInstalled,
      visible: design.stem.visible,
      crownPositionDeg: design.case.crownPositionDeg,
      crownDiameter: round(design.case.crownDiameter),
      crownThread: design.case.crownThread,
    },
    metrics: {
      totalHeight: round(result.metrics.totalHeight),
      crystalClearance: round(result.metrics.crystalClearance),
      dialCenterDepth: round(result.metrics.dialCenterDepth),
      minimumClearance: round(result.metrics.minimumClearance),
      activeConflicts: result.metrics.activeConflicts,
      opportunitiesDetected: result.metrics.opportunitiesDetected,
    },
    renderPrompt,
  }

  const fileBase = `${design.name.replaceAll(' ', '_')}_render_sheet`
  const markdown = [
    `# Ficha de render - ${design.name}`,
    '',
    '## Datos generales',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    table([
      ['Fecha/hora exportacion', exportedAt],
      ['Movimiento', movement.calibre],
      ['Estado tecnico', result.status],
      ['Conflictos activos', result.metrics.activeConflicts],
      ['Advertencias activas', activeWarnings.length],
      ['Cristal en visor', options.visualCrystalVisible ? 'visible' : 'oculto en visor'],
      ['Reflejos', reflectionLabel[options.visualReflectionLevel]],
    ]),
    '',
    '## Movimiento',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    table([
      ['Calibre', movement.calibre],
      ['Familia', movement.type],
      ['Funcion', movement.function],
      ['Altura', mm(movement.height)],
      ['Tamano', movement.sizeLabel],
      ['Tija', `${movement.standardStem} / ${movement.stemPosition}`],
      ['Fitting agujas', `hora ${mm(movement.handFitting.hour)}, minuto ${mm(movement.handFitting.minute)}, segundo ${mm(movement.handFitting.second)}`],
      ['Calidad dato', DATA_QUALITY_LABELS[movement.dataQuality]],
    ]),
    '',
    '## Caja y cristal',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    table([
      ['Caja', `${design.case.shape}, ${mm(design.case.outerDiameter)} exterior, ${mm(design.case.innerDiameter)} interior`],
      ['Altura caja', mm(design.case.totalHeight)],
      ['Material caja', `${caseMaterial.label} ${caseMaterial.color}`],
      ['Bisel', mm(design.case.bezelThickness)],
      ['Corona', `${mm(design.case.crownDiameter)}, tubo ${mm(design.case.crownTubeDiameter)}, rosca ${design.case.crownThread}`],
      ['Cristal', `${design.crystal.type}, grosor ${mm(design.crystal.thickness)}, diametro ${mm(design.crystal.diameter)}`],
      ['Cristal en visor', options.visualCrystalVisible ? 'visible' : 'oculto en visor'],
      ['Reflejos cristal', reflectionLabel[options.visualReflectionLevel]],
      ['Margen al cristal', mm(result.metrics.crystalClearance)],
    ]),
    '',
    '## Dial',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    table([
      ['Diametro comercial', mm(design.dial.commercialDiameter)],
      ['Grosor base', mm(design.dial.thickness)],
      ['Color base', design.dial.visualColor ?? dialMaterial.color],
      ['Color acento', design.dial.visualAccentColor ?? 'no definido'],
      ['Material', dialMaterial.label],
      ['Textura', design.dial.visualTexture ?? 'none'],
      ['Centro hundido', yesNo(design.dial.sunkenCenter)],
      ['Profundidad centro', mm(design.dial.sunkenDepth)],
      ['Radio centro', mm(design.dial.sunkenRadius)],
      ['Anillo exterior', mm(design.dial.outerRingHeight)],
    ]),
    '',
    '## Capas',
    '',
    '| Capa | Visible | Material | Altura | Conflicto |',
    '| --- | --- | --- | --- | --- |',
    ...layers.map((item) => `| ${escapeMd(item.name)} | ${yesNo(Boolean(item.visible))} | ${escapeMd(item.material)} | ${item.height === null ? 'n/a' : mm(Number(item.height))} | ${yesNo(Boolean(item.conflict))} |`),
    '',
    reliefTable('Indices', indices, result),
    '',
    reliefTable('Numerales', numerals, result),
    '',
    '## Agujas',
    '',
    '| Aguja | Visible | Preset | Longitud | Anchura | Grosor | Z | Color | Fitting |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...(['hour', 'minute', 'second'] as const).map((key) => {
      const hand = key === 'hour' ? design.hands.hour : key === 'minute' ? design.hands.minute : design.hands.second
      const visible = key !== 'second' || (design.hands.count === 3 && design.hands.secondsEnabled)
      const label = key === 'hour' ? 'Horaria' : key === 'minute' ? 'Minutera' : 'Segundero'
      return `| ${label} | ${yesNo(visible)} | ${escapeMd(hand.visualStyle ?? 'custom')} | ${mm(hand.length)} | ${mm(hand.width)} | ${mm(hand.thickness)} | ${mm(hand.heightOverDial)} | ${hand.color} | ${mm(hand.holeSize)} |`
    }),
    '',
    '## Materiales y presentacion',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    table([
      ['Material caja', `${caseMaterial.label}, roughness ${caseMaterial.roughness}, metalness ${caseMaterial.metalness}`],
      ['Material dial', `${dialMaterial.label}, roughness ${dialMaterial.roughness}, metalness ${dialMaterial.metalness}`],
      ['Material agujas', `${handsMaterial.label}, roughness ${handsMaterial.roughness}, metalness ${handsMaterial.metalness}`],
      ['Material cristal', `${crystalMaterial.label}, transparencia ${crystalMaterial.transmission ?? crystalMaterial.opacity ?? 'n/a'}`],
      ['Vista actual', viewLabel(design.viewMode)],
      ['HDRI', options.studioViewMode === 'presentation' ? 'presentation_light.exr' : 'design_neutral.exr'],
      ['Exposicion', options.studioViewMode === 'presentation' ? 0.68 : design.renderMode === 'technical' ? 0.92 : 0.82],
    ]),
    '',
    '## Conflictos y advertencias',
    '',
    activeWarnings.length === 0
      ? 'Sin advertencias activas.'
      : activeWarnings.map((finding) => `- ${finding.severity.toUpperCase()}: ${finding.title}. ${finding.message}`).join('\n'),
    '',
    '## Brief natural para render IA',
    '',
    renderPrompt,
    '',
    '## JSON tecnico',
    '',
    '```json',
    JSON.stringify(json, null, 2),
    '```',
    '',
  ].join('\n')

  return { fileBase, markdown, json }
}
