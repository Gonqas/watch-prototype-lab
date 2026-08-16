import { localize } from '../../application/i18n'
import { segmentLessonBlock } from '../lessonSegmentation'
import { academyReaderPilotCuration } from './academyReaderPilot'
import {
  academyDiagramIsContentSpecific,
  academyDiagramPayloadHash,
  academySectionVisualCuration,
} from './academyReaderCuration'
import { academy3dVisualStateForPhase } from './academyReader3dStates'
import {
  academyCurationMetadataForLesson,
  academyCurationVisualForSection,
  academyPhaseIncludes,
  academyPhaseRank,
  applyAcademyCurationLayers,
} from './academyPersonalCurriculum'
import { academyReaderShortDocumentVersion, academyReaderStableHash } from './academyReaderIdentity'
import type {
  AcademyLegacySectionAlias,
  AcademyReaderBuildInput,
  AcademyReaderCurationPhase,
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

function legacyVisualCue(
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

function structuralVisualCue(
  lessonId: string,
  sectionId: string,
  order: number,
  title: string,
  role: AcademyReaderSectionRole,
): AcademyVisualCue {
  const visualExpected = ['visual-anatomy', 'observation', 'worked-example', 'procedure'].includes(role)
  return {
    cueId: `reader.cue.${sectionId}`,
    lessonId,
    sectionId,
    order,
    purpose: role === 'visual-anatomy' ? 'locate' : role === 'procedure' ? 'sequence' : role === 'observation' ? 'diagnose' : 'follow',
    kind: 'none',
    sourceType: 'none',
    visualDecision: visualExpected ? 'visual-gap' : 'text-sufficient',
    selectorIds: [],
    isolation: [],
    isolationIds: [],
    transparencyById: {},
    labels: [],
    labelDefinitions: [],
    pedagogicalQuestion: `¿Necesita «${title}» un apoyo visual independiente?`,
    caption: title,
    altText: visualExpected
      ? `No existe todavía un recurso visual específico verificado para «${title}»; el texto permanece completo.`
      : `El apartado «${title}» se comprende íntegramente mediante el texto.`,
    fidelity: 'not-applicable',
    limitations: visualExpected
      ? ['Vacío registrado; no se presenta una plantilla genérica ni un placeholder.']
      : ['No se añade una imagen decorativa o redundante.'],
    expectedObservation: visualExpected ? 'Pendiente de curación visual específica.' : 'El texto conserva el significado completo.',
    readingModePolicy: 'omit',
    semanticSpecificity: visualExpected ? 'topic-specific' : 'generic-scaffold',
    evidenceOfSpecificity: visualExpected ? ['Decisión estructural por rol; sin payload visual implementado.'] : [],
    reviewStatus: 'unreviewed',
    implementationStatus: visualExpected ? 'gap-recorded' : 'not-required',
    provenance: 'editorial-decision',
    sourceRole: 'none',
    curationStatus: visualExpected ? 'gap' : 'unnecessary',
  }
}

function curatedVisualCue(
  section: AcademyReaderSection,
  curation: NonNullable<AcademyReaderDocument['sectionCurations']>[number],
  activities: AcademyReaderBuildInput['material']['activities'],
  phase: AcademyReaderCurationPhase,
): AcademyVisualCue {
  const activity = curation.activityId ? activities.find(({ id }) => id === curation.activityId) : undefined
  const visualState = academy3dVisualStateForPhase(curation.visualStateId, phase)
  const implementedDiagram = Boolean(curation.diagramData && academyDiagramIsContentSpecific(curation.diagramData))
  const implementedScene = curation.visualKind === 'scene-3d' && Boolean(activity?.fixtureBinding && visualState)
  const implemented = implementedDiagram || implementedScene
  const gap = ['visual-gap', 'source-review-required'].includes(curation.visualDecision)
  const compositionId = curation.fixtureBinding?.kind === 'composition'
    ? curation.fixtureBinding.compositionId
    : curation.fixtureBinding?.kind === 'fixture'
      ? `composition.${curation.fixtureBinding.fixtureId}`
      : undefined
  return {
    cueId: `reader.cue.${section.sectionId}`,
    lessonId: section.lessonId,
    sectionId: section.sectionId,
    order: section.order,
    purpose: section.role === 'visual-anatomy'
      ? 'locate'
      : section.role === 'procedure'
        ? 'sequence'
        : section.role === 'diagnosis' || section.role === 'observation'
          ? 'diagnose'
          : section.role === 'comparison' || section.role === 'worked-example'
            ? 'compare'
            : 'follow',
    kind: implemented ? curation.visualKind : 'none',
    sourceType: implementedScene ? 'existing-fixture' : implementedDiagram ? 'original-diagram' : 'none',
    visualDecision: curation.visualDecision,
    visualDesignId: curation.visualDesignId,
    diagramSchemaId: curation.diagramSchemaId,
    diagramData: curation.diagramData,
    diagramPayloadHash: academyDiagramPayloadHash(curation.diagramData),
    activityId: curation.activityId,
    fixtureBinding: activity?.fixtureBinding,
    compositionId,
    visualStateId: curation.visualStateId,
    diagramKind: curation.visualKind === 'comparison'
      ? 'comparison'
      : curation.visualKind === 'sequence'
        ? 'inspection-path'
        : curation.visualKind === 'diagram'
          ? 'system-map'
          : undefined,
    modelReference: visualState?.fixtureId ?? curation.visualDesignId,
    selectorIds: curation.selectorIds,
    cameraPreset: curation.cameraPreset,
    isolation: curation.isolationIds,
    isolationIds: curation.isolationIds,
    transparencyById: curation.transparencyById,
    explodedState: curation.explodedState,
    animationState: curation.animationState,
    labels: curation.labelDefinitions.map(({ label }) => label),
    labelDefinitions: curation.labelDefinitions,
    pedagogicalQuestion: curation.pedagogicalQuestion,
    caption: curation.diagramData?.title ?? section.title,
    altText: curation.expectedObservation,
    fidelity: curation.fidelity,
    limitations: curation.limitations,
    expectedObservation: curation.expectedObservation,
    misconceptionAddressed: curation.misconceptionAddressed,
    readingModePolicy: curation.readingModePolicy,
    semanticSpecificity: implemented ? 'section-specific' : gap ? 'topic-specific' : 'generic-scaffold',
    evidenceOfSpecificity: implementedDiagram
      ? curation.diagramData?.nodes.map(({ label }) => label) ?? []
      : implementedScene
        ? [visualState?.visualStateId ?? '', ...curation.selectorIds].filter(Boolean)
        : [],
    reviewStatus: 'codex-assisted',
    implementationStatus: implemented
      ? 'implemented'
      : curation.visualKind === 'scene-3d' && curation.visualDecision === 'content-specific-3d'
        ? 'unavailable'
        : gap ? 'gap-recorded' : 'not-required',
    provenance: implementedScene ? 'existing-fixture' : implementedDiagram ? 'original-data-driven-svg' : 'editorial-decision',
    sourceRole: implemented ? 'supporting' : 'none',
    curationStatus: implemented ? 'implemented' : gap ? 'gap' : 'unnecessary',
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

export function buildAcademyReaderDocument(
  input: AcademyReaderBuildInput,
  options: { compatibility?: '0.14C'; curationPhase?: AcademyReaderCurationPhase } = {},
): AcademyReaderDocument {
  const legacy014C = options.compatibility === '0.14C'
  const curationPhase = options.curationPhase ?? '0.14D'
  const lessonId = input.material.lesson.id
  const pilot = academyReaderPilotCuration(lessonId)
  const isPersonalPhase = academyPhaseIncludes(curationPhase, '0.14E')
  const activeCuration = academyCurationMetadataForLesson(curationPhase, lessonId)
  const fixtureActivity = input.material.activities.find(({ fixtureBinding }) => Boolean(fixtureBinding))
  const visualDeclared = Boolean(input.material.lesson.authoring?.visualStrategy)
  const contentBasis = input.material.blocks.map(({ bodyMarkdown }) => bodyMarkdown.replaceAll('\r\n', '\n').trim()).join('\n\n')
  let documentContentHash = academyReaderStableHash(contentBasis)
  const sectionIds = new Map<string, number>()
  let sections: AcademyReaderSection[] = []
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
      const cue = legacy014C
        ? legacyVisualCue(lessonId, sectionId, sections.length + 1, draft.title, role, pilot, visualDeclared, fixtureActivity)
        : structuralVisualCue(lessonId, sectionId, sections.length + 1, draft.title, role)
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
        ...(!legacy014C ? {
          conceptIds: [...(block.pedagogy?.conceptIds ?? [])],
          claimIds: block.claims.map(({ id }) => id),
          sourceLocators: [...new Set(block.claims.flatMap(({ sources }) => sources.map((source) => [
            source.id,
            source.page ? `p. ${source.page}` : '',
            source.figure ? `fig. ${source.figure}` : '',
            source.resource.locator ?? '',
          ].filter(Boolean).join(' · '))))],
        } : {}),
        requiredForStudy: !reference,
        collapsible: reference,
        defaultExpanded: !reference,
        curationMethod: pilot ? 'pilot-override' : 'authored-structure',
        curationConfidence: pilot ? 'high' : 'medium',
        visualCue: cue,
      })
    }
  }
  let layerAliases: AcademyLegacySectionAlias[] = []
  if (!legacy014C) {
    const layered = applyAcademyCurationLayers(curationPhase, lessonId, sections)
    sections = layered.sections
    layerAliases = layered.aliases
    if (layered.transformed) {
      documentContentHash = academyReaderStableHash(sections.map(({ sectionId, markdown }) => `${sectionId}\n${markdown}`).join('\n\n'))
    }
  }
  const sourceIds = input.material.sources.map(({ id }) => id)
  const sectionCurations = legacy014C ? [] : sections.flatMap((section) => {
    const baseCuration = academySectionVisualCuration({
      lessonId,
      section,
      contentHash: documentContentHash,
      sectionHash: academyReaderStableHash(section.markdown),
      activities: input.material.activities,
      sourceIds,
    })
    const layeredVisual = academyCurationVisualForSection(curationPhase, {
      lessonId,
      section,
      contentHash: documentContentHash,
      sectionHash: academyReaderStableHash(section.markdown),
      sourceIds,
    })
    const curation = layeredVisual ?? baseCuration
    if (!curation) return []
    return isPersonalPhase ? [{
      ...curation,
      curationId: curation.curationId.replace('curation.0.14d.', `curation.${curationPhase.toLowerCase()}.`),
      contentHash: documentContentHash,
      sectionHash: academyReaderStableHash(section.markdown),
      curationMethod: 'codex-assisted-personal-curation' as const,
      technicalReviewStatus: 'not-required' as const,
      technicalStatus: activeCuration?.technicalStatus ?? curation.technicalStatus ?? 'source-reviewed' as const,
      notes: [
        ...curation.notes,
        academyPhaseRank(curationPhase) === academyPhaseRank('0.14E')
          ? 'Revisada para uso personal en español en 0.14E; claridad pendiente del propietario.'
          : 'Revisada para uso personal en español; claridad pendiente de tu revisión.',
      ],
    }] : [curation]
  })
  if (!legacy014C) {
    const curationBySection = new Map(sectionCurations.map((curation) => [curation.sectionId, curation]))
    for (const section of sections) {
      const curation = curationBySection.get(section.sectionId)
      if (!curation) continue
      const cue = curatedVisualCue(section, curation, input.material.activities, curationPhase)
      section.visualCue = cue
      section.visualCueIds = [cue.cueId]
      section.curationMethod = 'pilot-override'
      section.curationConfidence = 'high'
    }
  }
  const requiredActivityIds = [...(input.requiredActivityIds ?? [])]
  const optionalActivityIds = input.material.activities
    .map(({ id }) => id)
    .filter((id) => !requiredActivityIds.includes(id))
  const aliases = [
    ...aliasesForDocument(input, sections),
    ...layerAliases,
  ]
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
  const legacyVersion = academyReaderDocumentVersion(input)
  const structureHash = academyReaderStableHash(sections.map(({ sectionId, sourceBlockVersion, headingLevel, title }) =>
    `${sectionId}|${sourceBlockVersion}|${headingLevel}|${title}`).join('\n'))
  const diagnosticSignature = `reader-${curationPhase}:${legacyVersion}:${documentContentHash}:${structureHash}`
  const compatibilityVersion = 'legacy-section-aliases-0.14C-v1'
  const shortVersion = academyReaderShortDocumentVersion({
    contentHash: documentContentHash,
    structureHash,
    compatibilityVersion,
    diagnosticSignature,
    legacyDocumentVersion: legacyVersion,
  })
  const documentVersion = legacy014C ? legacyVersion : shortVersion
  return {
    readerSchemaVersion: legacy014C ? '0.14C' : curationPhase,
    documentId: `reader.document.${lessonId}`,
    documentVersion,
    version: documentVersion,
    packageId: input.material.packageId,
    packageVersion: input.material.packageVersion,
    lessonId,
    lessonVersion: input.material.lesson.version,
    locale: input.locale ?? 'es-ES',
    contentHash: documentContentHash,
    ...(!legacy014C ? {
      identity: {
        schemaVersion: 1 as const,
        contentHash: documentContentHash,
        structureHash,
        compatibilityVersion,
        diagnosticSignature,
        legacyDocumentVersion: legacyVersion,
      },
    } : {}),
    title: input.title,
    purpose: input.purpose,
    whyNow: activeCuration?.whyNow ?? input.whyNow,
    outcome: activeCuration && 'observableOutcome' in activeCuration ? activeCuration.observableOutcome : input.outcome,
    estimatedDurationMinutes,
    stageId: input.stageId,
    chapterId: input.chapterId,
    stepId: input.stepId,
    sections,
    ...(!legacy014C ? { sectionCurations } : {}),
    referenceSections: sections.filter(({ role }) => ['reference', 'sources', 'limitations'].includes(role)),
    visualCues: sections.map(({ visualCue }) => visualCue),
    outline: sections.map(({ sectionId, title, headingLevel, role }) => ({ sectionId, title, level: headingLevel, role })),
    glossaryTermIds: [...new Set(sections.flatMap(({ glossaryTermIds: ids }) => ids))],
    sourceIds,
    legacyAliases: aliases,
    compatibility: { legacyAliases: aliases, legacyModePolicy: 'map-to-learn-or-read' },
    completion,
    completionPolicy: completion,
    pilot: Boolean(pilot),
    centralQuestion: activeCuration?.centralQuestion ?? pilot?.centralQuestion,
    curation: {
      method: activeCuration ? 'codex-assisted-personal-curation' : pilot ? 'codex-assisted-editorial-curation' : 'automated-structural-migration',
      confidence: pilot || activeCuration ? 'high' : 'medium',
      ownerReviewPending: legacy014C ? Boolean(pilot) : true,
      ...(!legacy014C ? {
        editorialStatus: activeCuration ? 'codex-assisted-curation' as const : pilot ? 'codex-assisted-curation' as const : 'automated-structural-migration' as const,
        ownerReviewStatus: 'owner-review-pending' as const,
        technicalReviewStatus: isPersonalPhase
          ? 'not-required' as const
          : sectionCurations.some(({ technicalReviewStatus }) => technicalReviewStatus === 'technical-expert-review-pending')
            ? 'technical-expert-review-pending' as const
            : 'not-required' as const,
        ...(isPersonalPhase
          ? { technicalStatus: activeCuration?.technicalStatus ?? 'source-reviewed' as const }
          : {}),
      } : {}),
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
    if (document.readerSchemaVersion !== '0.14C' && section.visualCue.kind === 'scene-3d' && !section.visualCue.activityId) {
      issues.push({ code: 'missing-3d-activity', lessonId: document.lessonId, sectionId: section.sectionId, message: 'El cue 3D no declara una actividad exacta.' })
    }
    if (document.readerSchemaVersion !== '0.14C' && section.visualCue.kind === 'scene-3d' && !section.visualCue.visualStateId) {
      issues.push({ code: 'missing-3d-state', lessonId: document.lessonId, sectionId: section.sectionId, message: 'El cue 3D no declara un estado visual exacto.' })
    }
    if (document.readerSchemaVersion !== '0.14C'
      && section.visualCue.visualDecision?.startsWith('content-specific')
      && section.visualCue.diagramData
      && !academyDiagramIsContentSpecific(section.visualCue.diagramData)) {
      issues.push({ code: 'generic-diagram-misclassified', lessonId: document.lessonId, sectionId: section.sectionId, message: 'Un payload genérico se marcó como contenido específico.' })
    }
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
