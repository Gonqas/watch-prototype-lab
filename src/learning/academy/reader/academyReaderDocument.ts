import { localize } from '../../application/i18n'
import { segmentLessonBlock } from '../lessonSegmentation'
import { academyReaderPilotCuration } from './academyReaderPilot'
import type {
  AcademyLegacySectionAlias,
  AcademyReaderBuildInput,
  AcademyReaderDocument,
  AcademyReaderSection,
  AcademyReaderSectionRole,
  AcademyReaderValidationIssue,
  AcademyVisualCue,
} from './academyReaderModel'

const HEADING = /^(#{1,6})\s+(.+?)\s*$/

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[`*_~(){}]/g, '')
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'section'
}

function plainHeading(value: string): string {
  return value
    .replace(/\{\{term:([^}]+)\}\}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim()
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function countWords(value: string): number {
  return value
    .replace(/\{\{term:([^}]+)\}\}/g, '$1')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[`#*_|>~-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function contentHash(value: string): string {
  let hash = 0xcbf29ce484222325n
  for (const character of new TextEncoder().encode(value)) {
    hash ^= BigInt(character)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`
}

function glossaryTerms(value: string): string[] {
  return [...new Set([...value.matchAll(/\{\{term:([^}]+)\}\}/g)].map((match) => match[1]))]
}

function sectionRole(
  blockKind: string,
  pedagogyRole: string | undefined,
  title: string,
): AcademyReaderSectionRole {
  const normalized = normalizeText(title)
  if (blockKind === 'warning' || /seguridad|advertencia|precaucion|riesgo/.test(normalized)) return 'safety'
  if (/fuentes|bibliografia/.test(normalized)) return 'sources'
  if (/limites|limitaciones|alcance|fidelidad/.test(normalized)) return 'limitations'
  if (/referencias|procedencia/.test(normalized)) return 'reference'
  if (/vocabulario|terminos clave|lenguaje tecnico/.test(normalized)) return 'vocabulary'
  if (/comparacion|comparar|equivalencia|contraste/.test(normalized)) return 'comparison'
  if (/diagnostico|hipotesis|sintoma/.test(normalized)) return 'diagnosis'
  if (/checkpoint|punto de control|criterio de aceptacion|criterio de exito|actividad|practica|evidencia|feedback|ayuda despues|comprueba|comprobacion antes|transferencia/.test(normalized)) return 'checkpoint'
  if (/siguiente|conexion|continuar/.test(normalized)) return 'next-connection'
  if (blockKind === 'procedure' || /procedimiento|secuencia|desmontaje|montaje/.test(normalized)) return 'procedure'
  if (/error|fallo habitual|confusion|remediacion/.test(normalized)) return 'common-errors'
  if (/resumen|sintesis|comprobacion final|conclusion/.test(normalized)) return 'summary'
  if (/antes de empezar|preparacion|proposito|objetivo|conocimientos previos|pregunta central|pregunta de estudio|finalidad/.test(normalized)) return 'preparation'
  if (/visual|anatomia|arquitectura|partes|componentes|despiece/.test(normalized)) return 'visual-anatomy'
  if (/observa|observacion|inspeccion|identifica/.test(normalized)) return 'observation'
  if (/ejemplo|caso resuelto|paso a paso/.test(normalized)) return 'worked-example'
  if (pedagogyRole === 'activate-prior-knowledge') return 'orientation'
  if (pedagogyRole === 'pretrain') return 'preparation'
  if (pedagogyRole === 'worked-example') return 'worked-example'
  if (pedagogyRole === 'guided-observation') return 'observation'
  if (pedagogyRole === 'summary') return 'summary'
  if (pedagogyRole === 'remediation') return 'common-errors'
  return 'explanation'
}

interface SectionDraft {
  title: string
  headingLevel: number
  markdown: string
}

function semanticDrafts(title: string, markdown: string): SectionDraft[] {
  const lines = markdown.split(/\r?\n/)
  const drafts: SectionDraft[] = []
  let current: SectionDraft = { title, headingLevel: 2, markdown: '' }
  const push = () => {
    if (!current.markdown.trim()) return
    drafts.push({ ...current, markdown: current.markdown.trim() })
  }
  for (const line of lines) {
    const heading = line.match(HEADING)
    if (!heading) {
      current.markdown += `${line}\n`
      continue
    }
    push()
    current = {
      title: plainHeading(heading[2]),
      headingLevel: Math.min(4, Math.max(2, heading[1].length + 1)),
      markdown: '',
    }
  }
  push()
  if (drafts.length === 0 && markdown.trim()) return [{ title, headingLevel: 2, markdown: markdown.trim() }]
  return drafts
}

function visualCue(
  lessonId: string,
  sectionId: string,
  order: number,
  title: string,
  role: AcademyReaderSectionRole,
  pilotPlan: ReturnType<typeof academyReaderPilotCuration>,
  visualDeclared: boolean,
  fixtureActivity: AcademyReaderBuildInput['material']['activities'][number] | undefined,
): AcademyVisualCue {
  const purpose: AcademyVisualCue['purpose'] = role === 'visual-anatomy'
    ? 'locate'
    : role === 'comparison' || role === 'worked-example'
      ? 'compare'
      : role === 'procedure'
        ? 'sequence'
        : role === 'diagnosis' || role === 'observation'
          ? 'diagnose'
          : role === 'checkpoint'
            ? 'measure'
            : role === 'summary'
              ? 'summarize'
              : 'follow'
  const base = {
    cueId: `reader.cue.${sectionId}`,
    lessonId,
    sectionId,
    order,
    purpose,
    selectorIds: [],
    isolation: [],
    labels: [],
    pedagogicalQuestion: `¿Qué relación debes reconocer en «${title}»?`,
    caption: title,
  }
  if (['reference', 'sources', 'limitations', 'safety', 'preparation', 'orientation', 'vocabulary', 'checkpoint', 'next-connection'].includes(role)) {
    return {
      ...base,
      kind: 'none',
      sourceType: 'none',
      altText: `El apartado «${title}» se comprende íntegramente mediante el texto.`,
      fidelity: 'not-applicable',
      limitations: ['No se añade una imagen decorativa ni se oculta información en un recurso visual.'],
      implementationStatus: 'not-required',
      provenance: 'editorial-decision',
      sourceRole: 'none',
      curationStatus: 'unnecessary',
    }
  }
  if (fixtureActivity && ['visual-anatomy', 'observation', 'worked-example', 'procedure'].includes(role)) {
    const modelReference = fixtureActivity.fixtureBinding?.kind === 'fixture'
      ? fixtureActivity.fixtureBinding.fixtureId
      : fixtureActivity.fixtureBinding?.compositionId
    return {
      ...base,
      kind: 'scene-3d',
      sourceType: 'existing-fixture',
      activityId: fixtureActivity.id,
      fixtureBinding: fixtureActivity.fixtureBinding,
      modelReference,
      cameraPreset: 'academy-reader-default',
      explodedState: 'authored-fixture-default',
      animationState: 'paused-until-user-action',
      altText: `Vista de estudio del modelo asociado a «${title}». El texto contiene la explicación completa.`,
      fidelity: modelReference?.includes('conceptual') ? 'conceptual' : 'calibre-specific',
      limitations: ['Vista de consulta no evaluable.', 'La interacción virtual no acredita competencia física.'],
      implementationStatus: 'implemented',
      provenance: 'existing-fixture',
      sourceRole: 'supporting',
      curationStatus: 'implemented',
    }
  }
  if (pilotPlan || visualDeclared) {
    const diagramKind = role === 'visual-anatomy'
      ? 'annotated-anatomy'
      : role === 'procedure' || role === 'observation' || role === 'diagnosis'
        ? 'inspection-path'
        : role === 'comparison' || role === 'worked-example'
          ? 'comparison'
          : pilotPlan?.visualPlan ?? 'system-map'
    return {
      ...base,
      kind: 'diagram',
      sourceType: 'original-diagram',
      diagramKind,
      modelReference: `reader.diagram.${diagramKind}`,
      labels: ['entrada', 'función', 'relación', 'límite'],
      altText: `Diagrama conceptual de «${title}»: organiza las relaciones descritas en el texto sin añadir datos técnicos.`,
      fidelity: 'conceptual',
      limitations: ['Esquema editorial original, no dibujo a escala.', 'No sustituye documentación oficial ni evidencia física.'],
      implementationStatus: 'implemented',
      provenance: 'original-data-driven-svg',
      sourceRole: 'visual-inspiration',
      curationStatus: 'implemented',
    }
  }
  const visualExpected = ['visual-anatomy', 'observation', 'worked-example', 'procedure'].includes(role)
  return visualExpected
    ? {
        ...base,
        kind: 'none',
        sourceType: 'none',
        altText: `No existe todavía un recurso visual verificado para «${title}»; el texto permanece completo.`,
        fidelity: 'not-applicable',
        limitations: ['Vacío registrado para revisión editorial; no se presenta un marcador vacío al alumno.'],
        implementationStatus: 'gap-recorded',
        provenance: 'editorial-decision',
        sourceRole: 'none',
        curationStatus: 'gap',
      }
    : {
        ...base,
        kind: 'none',
        sourceType: 'none',
        altText: `El apartado «${title}» no necesita una visual independiente para conservar su significado.`,
        fidelity: 'not-applicable',
        limitations: ['La decisión se basa en la función semántica del apartado.'],
        implementationStatus: 'not-required',
        provenance: 'editorial-decision',
        sourceRole: 'none',
        curationStatus: 'unnecessary',
      }
}

function aliasesForDocument(
  input: AcademyReaderBuildInput,
  sections: AcademyReaderSection[],
): AcademyLegacySectionAlias[] {
  const aliases: AcademyLegacySectionAlias[] = []
  for (const block of input.material.blocks) {
    const markdown = block.localization?.bodyMarkdown
      ? localize(input.locale, block.localization.bodyMarkdown)
      : block.bodyMarkdown
    const legacySegments = segmentLessonBlock(block.id, markdown)
    const blockSections = sections.filter(({ sourceBlockId }) => sourceBlockId === block.id)
    for (const [index, legacy] of legacySegments.entries()) {
      const explicit = sections.find(({ sectionId }) => sectionId === legacy.id)
      const heading = blockSections.find(({ title }) => normalizeText(title) === normalizeText(legacy.title))
      const content = blockSections.find(({ markdown: sectionMarkdown }) => {
        const sample = normalizeText(legacy.markdown).slice(0, 120)
        return sample.length > 24 && normalizeText(sectionMarkdown).includes(sample)
      })
      const nearest = blockSections[Math.min(index, Math.max(0, blockSections.length - 1))]
      const target = explicit ?? heading ?? content ?? nearest ?? sections[0]
      if (!target) continue
      const method = explicit
        ? 'explicit-alias'
        : heading ? 'same-block-and-heading' : content ? 'same-block' : nearest ? 'nearest-order' : 'fallback-start'
      aliases.push({
        lessonId: input.material.lesson.id,
        legacySegmentId: legacy.id,
        sectionId: target.sectionId,
        newSectionId: target.sectionId,
        method,
        matchMethod: method,
        confidence: explicit || heading ? 'high' : content || nearest ? 'medium' : 'low',
        fallbackSectionId: sections[0]?.sectionId ?? target.sectionId,
      })
    }
  }
  return aliases
}

export function academyReaderDocumentVersion(input: AcademyReaderBuildInput): string {
  return [
    'reader-0.14C',
    input.material.packageVersion,
    input.material.lesson.version,
    ...input.material.blocks.map(({ id, version }) => `${id}@${version}`),
  ].join(':')
}

export function buildAcademyReaderDocument(input: AcademyReaderBuildInput): AcademyReaderDocument {
  const lessonId = input.material.lesson.id
  const pilot = academyReaderPilotCuration(lessonId)
  const fixtureActivity = input.material.activities.find(({ fixtureBinding }) => Boolean(fixtureBinding))
  const visualDeclared = Boolean(input.material.lesson.authoring?.visualStrategy)
  const sectionIds = new Map<string, number>()
  const sections: AcademyReaderSection[] = []
  for (const block of input.material.blocks) {
    const markdown = block.localization?.bodyMarkdown
      ? localize(input.locale, block.localization.bodyMarkdown)
      : block.bodyMarkdown
    const drafts = semanticDrafts(block.title, markdown)
    for (const draft of drafts) {
      const base = `reader.section.${block.id}.${slug(draft.title)}`
      const occurrence = (sectionIds.get(base) ?? 0) + 1
      sectionIds.set(base, occurrence)
      const sectionId = occurrence === 1 ? base : `${base}.${occurrence}`
      const wordCount = countWords(draft.markdown)
      const role = sectionRole(block.kind, block.pedagogy?.role, draft.title)
      const cue = visualCue(lessonId, sectionId, sections.length + 1, draft.title, role, pilot, visualDeclared, fixtureActivity)
      const reference = ['reference', 'sources', 'limitations'].includes(role)
      sections.push({
        sectionId,
        lessonId,
        blockId: block.id,
        sourceBlockId: block.id,
        sourceBlockIds: [block.id],
        sourceBlockVersion: block.version,
        order: sections.length + 1,
        ordinal: sections.length + 1,
        heading: draft.title,
        headingLevel: draft.headingLevel,
        title: draft.title,
        role,
        markdown: draft.markdown,
        wordCount,
        ...(drafts.length === 1 && block.pedagogy?.estimatedMinutes
          ? { estimatedMinutes: block.pedagogy.estimatedMinutes }
          : {}),
        visualCueIds: [cue.cueId],
        glossaryTermIds: glossaryTerms(draft.markdown),
        requiredForStudy: !reference,
        collapsible: reference,
        defaultExpanded: !reference,
        curationMethod: pilot ? 'pilot-override' : 'authored-structure',
        curationConfidence: pilot ? 'high' : 'medium',
        visualCue: cue,
      })
    }
  }
  const requiredActivityIds = [...(input.requiredActivityIds ?? [])]
  const optionalActivityIds = input.material.activities
    .map(({ id }) => id)
    .filter((id) => !requiredActivityIds.includes(id))
  const aliases = aliasesForDocument(input, sections)
  const completion = {
    explicitActionRequired: true as const,
    scrollNeverCompletes: true as const,
    elapsedTimeNeverCompletes: true as const,
    visitedSectionsNeverComplete: true as const,
    completionActivityId: requiredActivityIds[0],
    requiredActivityIds,
    optionalActivityIds,
  }
  const blockDurations = input.material.blocks.map(({ pedagogy }) => pedagogy?.estimatedMinutes)
  const estimatedDurationMinutes = blockDurations.length > 0 && blockDurations.every((value): value is number => value !== undefined)
    ? blockDurations.reduce((total, value) => total + value, 0)
    : undefined
  const contentBasis = input.material.blocks.map(({ bodyMarkdown }) => bodyMarkdown.replaceAll('\r\n', '\n').trim()).join('\n\n')
  return {
    readerSchemaVersion: '0.14C',
    documentId: `reader.document.${lessonId}`,
    documentVersion: academyReaderDocumentVersion(input),
    version: academyReaderDocumentVersion(input),
    packageId: input.material.packageId,
    packageVersion: input.material.packageVersion,
    lessonId,
    lessonVersion: input.material.lesson.version,
    locale: input.locale ?? 'es-ES',
    contentHash: contentHash(contentBasis),
    title: input.title,
    purpose: input.purpose,
    whyNow: input.whyNow,
    outcome: input.outcome,
    estimatedDurationMinutes,
    stageId: input.stageId,
    chapterId: input.chapterId,
    stepId: input.stepId,
    sections,
    referenceSections: sections.filter(({ role }) => ['reference', 'sources', 'limitations'].includes(role)),
    visualCues: sections.map(({ visualCue }) => visualCue),
    outline: sections.map(({ sectionId, title, headingLevel, role }) => ({ sectionId, title, level: headingLevel, role })),
    glossaryTermIds: [...new Set(sections.flatMap(({ glossaryTermIds: ids }) => ids))],
    sourceIds: input.material.sources.map(({ id }) => id),
    legacyAliases: aliases,
    compatibility: { legacyAliases: aliases, legacyModePolicy: 'map-to-learn-or-read' },
    completion,
    completionPolicy: completion,
    pilot: Boolean(pilot),
    centralQuestion: pilot?.centralQuestion,
    curation: {
      method: pilot ? 'codex-assisted-editorial-curation' : 'automated-structural-migration',
      confidence: pilot ? 'high' : 'medium',
      ownerReviewPending: Boolean(pilot),
    },
  }
}

export function resolveAcademyReaderSection(
  document: AcademyReaderDocument,
  requestedId: string | undefined,
): { sectionId: string; restoredFromLegacyAlias: boolean } {
  if (requestedId && document.sections.some(({ sectionId }) => sectionId === requestedId)) {
    return { sectionId: requestedId, restoredFromLegacyAlias: false }
  }
  const alias = requestedId
    ? document.legacyAliases.find(({ legacySegmentId }) => legacySegmentId === requestedId)
    : undefined
  return {
    sectionId: alias?.sectionId ?? document.sections[0]?.sectionId ?? '',
    restoredFromLegacyAlias: Boolean(alias),
  }
}

export function validateAcademyReaderDocument(document: AcademyReaderDocument): AcademyReaderValidationIssue[] {
  const issues: AcademyReaderValidationIssue[] = []
  if (document.sections.length === 0) {
    issues.push({ code: 'empty-document', lessonId: document.lessonId, message: 'La lección no produjo apartados semánticos.' })
  }
  const seen = new Set<string>()
  for (const section of document.sections) {
    if (!section.markdown.trim()) issues.push({ code: 'empty-section', lessonId: document.lessonId, sectionId: section.sectionId, message: 'El apartado no contiene texto.' })
    if (seen.has(section.sectionId)) issues.push({ code: 'duplicate-section-id', lessonId: document.lessonId, sectionId: section.sectionId, message: 'El ID de apartado está duplicado.' })
    seen.add(section.sectionId)
    if (!section.visualCue) issues.push({ code: 'missing-visual-decision', lessonId: document.lessonId, sectionId: section.sectionId, message: 'Falta una decisión visual explícita.' })
    if (/\]\(\s*(?:javascript|vbscript|data):/i.test(section.markdown)) {
      issues.push({ code: 'unsafe-markdown-url', lessonId: document.lessonId, sectionId: section.sectionId, message: 'El Markdown contiene una URL no permitida.' })
    }
  }
  for (const alias of document.legacyAliases) {
    if (!seen.has(alias.sectionId)) issues.push({ code: 'missing-alias-target', lessonId: document.lessonId, sectionId: alias.sectionId, message: `El alias ${alias.legacySegmentId} no resuelve a un apartado.` })
  }
  if (!document.completion.explicitActionRequired
    || !document.completion.scrollNeverCompletes
    || !document.completion.elapsedTimeNeverCompletes
    || !document.completion.visitedSectionsNeverComplete) {
    issues.push({ code: 'completion-contract-invalid', lessonId: document.lessonId, message: 'La finalización no conserva el contrato explícito.' })
  }
  return issues
}
