import type { LearningApplicationSnapshot } from '../application/service'
import { localize } from '../application/i18n'
import type { LearningPack } from '../content/learningPack'
import {
  INTEGRATED_LEARNING_CONTENT,
} from '../product/integratedContent'
import type {
  LearningActivityDescriptor,
  LearningModuleDescriptor,
  LearningProductIndex,
  LearningRouteDescriptor,
} from '../product/demoPackage'
import { TECHNICAL_MOVEMENT_FIXTURES } from '../technical/fixtures'
import type { TechnicalMovementFixture } from '../technical/reconstruction'
import type { AcademyNote } from './academyLocalState'
import {
  academyRoutePrerequisiteStatus as curriculumPrerequisiteStatus,
  canonicalAcademyRouteIds,
  type AcademyRoutePrerequisiteStatus,
} from './academyCurriculum'

export interface AcademyRouteTree {
  route: LearningRouteDescriptor
  modules: Array<{
    module: LearningModuleDescriptor
    lessons: Array<LearningProductIndex['lessons'][number] & {
      activities: LearningActivityDescriptor[]
    }>
  }>
  activityIds: string[]
}

export interface AcademyRouteProgress {
  completedActivities: number
  startedActivities: number
  totalActivities: number
  completedDemonstrationActivities: number
  totalDemonstrationActivities: number
  routeComplete: boolean
  demonstratedCompetencies: number
  transferredCompetencies: number
  retainedCompetencies: number
  totalCompetencies: number
  nextLearningUnit?: AcademyNextLearningUnit
  /**
   * Compatibilidad con consumidores anteriores. En una ruta nueva permanece
   * vacío hasta que la persona inicia explícitamente una práctica desde su
   * lección.
   */
  nextActivityId?: string
}

export type AcademyActivityAchievement =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'demonstrated'
  | 'transferred'
  | 'retained'

export function academyActivityAchievement(
  snapshot: LearningApplicationSnapshot,
  activity: LearningActivityDescriptor,
): AcademyActivityAchievement {
  const sessions = snapshot.sessions.items.filter(({ activityId }) => activityId === activity.id)
  if (sessions.length === 0) return 'not-started'
  const completed = sessions.some(({ state }) => state === 'completed')
  if (!completed) return 'in-progress'
  const evidenceIds = new Set(
    snapshot.evidence.items
      .filter(({ activityId, status }) => activityId === activity.id && status === 'active')
      .map(({ id }) => id),
  )
  const passedAssessments = snapshot.assessments.items.filter((assessment) =>
    assessment.result.passed
    && assessment.competencyId
    && activity.competencyIds.includes(assessment.competencyId)
    && assessment.evidenceIds.some((id) => evidenceIds.has(id)))
  const purpose = activity.pedagogicalContract?.purpose
  const intent = activity.pedagogicalContract?.assessmentIntent
  if (purpose === 'retention' || intent === 'retention') {
    return activity.competencyIds.some((competencyId) =>
      snapshot.mastery.items.some((item) =>
        item.competencyId === competencyId && item.state === 'retained'))
      ? 'retained'
      : 'completed'
  }
  if (purpose === 'transfer') {
    return passedAssessments.some(({ ruleId }) => ruleId.endsWith('.transfer'))
      ? 'transferred'
      : 'completed'
  }
  if (intent === 'demonstration' || purpose === 'mastery-check') {
    return passedAssessments.some(({ result }) =>
      result.resultingState === 'demonstrated' || result.resultingState === 'retained')
      ? 'demonstrated'
      : 'completed'
  }
  if (intent === 'none') return 'completed'
  // Completar una sesión no equivale a superar su comprobación. Una respuesta
  // formativa fallida permanece como intento y la ruta vuelve a ofrecerla.
  return passedAssessments.length > 0 ? 'completed' : 'in-progress'
}

export function academyActivitySatisfiesProgression(
  snapshot: LearningApplicationSnapshot,
  activity: LearningActivityDescriptor,
): boolean {
  const achievement = academyActivityAchievement(snapshot, activity)
  const purpose = activity.pedagogicalContract?.purpose
  const intent = activity.pedagogicalContract?.assessmentIntent
  if (purpose === 'retention' || intent === 'retention') return achievement === 'retained'
  if (purpose === 'transfer') return achievement === 'transferred'
  if (intent === 'demonstration' || purpose === 'mastery-check') {
    return achievement === 'demonstrated' || achievement === 'retained'
  }
  return achievement === 'completed'
    || achievement === 'demonstrated'
    || achievement === 'transferred'
    || achievement === 'retained'
}

export type AcademyNextLearningUnit =
  | {
    kind: 'lesson'
    routeId: string
    moduleId: string
    lessonId: string
    title: string
    href: string
    reason: 'introduction'
  }
  | {
    kind: 'block'
    routeId: string
    moduleId: string
    lessonId: string
    blockId: string
    title: string
    href: string
    reason: 'introduction'
  }
  | {
    kind: 'activity'
    routeId: string
    moduleId: string
    lessonId: string
    activityId: string
    title: string
    href: string
    reason: 'resume' | 'practice'
  }

export interface AcademyLessonMaterial {
  packageId: string
  packageVersion: string
  pack: LearningPack
  lesson: LearningPack['lessons'][number]
  blocks: LearningPack['blocks']
  activities: LearningActivityDescriptor[]
  sources: LearningPack['sources']
  glossary: LearningPack['glossary']
}

export type AcademyGlossaryEntry = LearningPack['glossary'][number]

/**
 * Presents a single glossary entry per canonical term while preserving every
 * source declared by otherwise identical, self-contained content packs.
 */
export function academyGlossaryEntries(): AcademyGlossaryEntry[] {
  const entries = new Map<string, AcademyGlossaryEntry>()
  for (const { pack } of INTEGRATED_LEARNING_CONTENT) {
    for (const entry of pack.glossary) {
      const existing = entries.get(entry.id)
      if (!existing) {
        entries.set(entry.id, entry)
        continue
      }
      if (!existing.authoring && entry.authoring) {
        entries.set(entry.id, entry)
        continue
      }
      if (existing.authoring && entry.authoring) {
        entries.set(entry.id, {
          ...existing,
          authoring: {
            ...existing.authoring,
            sourceIds: [...new Set([
              ...existing.authoring.sourceIds,
              ...entry.authoring.sourceIds,
            ])],
          },
        })
      }
    }
  }
  return [...entries.values()]
}

export type AcademySearchKind =
  | 'route'
  | 'module'
  | 'lesson'
  | 'activity'
  | 'fixture'
  | 'part'
  | 'term'
  | 'source'
  | 'note'

export interface AcademySearchEntry {
  id: string
  kind: AcademySearchKind
  title: string
  description: string
  keywords: string
  href: string
  context: string
}

export function humanizeLearningId(value: string): string {
  const segments = value.split('.')
  const meaningful = segments.slice(Math.min(2, Math.max(0, segments.length - 2))).join(' ')
  return meaningful
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function realAcademyRoutes(product: LearningProductIndex): LearningRouteDescriptor[] {
  const order = new Map(canonicalAcademyRouteIds(product).map((id, index) => [id, index]))
  return product.routes
    .filter(({ demo }) => !demo)
    .sort((left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER))
}

export function academyRouteTree(
  product: LearningProductIndex,
  routeId: string,
): AcademyRouteTree | undefined {
  const route = product.routes.find(({ id }) => id === routeId)
  if (!route) return undefined
  const modules = route.moduleIds.flatMap((moduleId) => {
    const module = product.modules.find(({ id }) => id === moduleId)
    if (!module) return []
    return [{
      module,
      lessons: module.lessonIds.flatMap((lessonId) => {
        const lesson = product.lessons.find(({ id }) => id === lessonId)
        if (!lesson) return []
        return [{
          ...lesson,
          activities: lesson.activityIds.flatMap((activityId) => {
            const activity = product.activities.find(({ id }) => id === activityId)
            return activity ? [activity] : []
          }),
        }]
      }),
    }]
  })
  return {
    route,
    modules,
    activityIds: modules.flatMap(({ lessons }) =>
      lessons.flatMap(({ activities }) => activities.map(({ id }) => id))),
  }
}

/**
 * Las actividades enlazadas únicamente por hitos opcionales permanecen en el
 * árbol para exploración directa, pero no cuentan para completar ni continuar
 * la ruta obligatoria.
 */
export function academyRequiredActivityIds(
  product: LearningProductIndex,
  routeId: string,
): string[] {
  const tree = academyRouteTree(product, routeId)
  if (!tree) return []
  const milestones = tree.route.learningDesign?.milestones ?? []
  const optionalIds = new Set(milestones
    .filter(({ optional }) => optional)
    .flatMap(({ activityId }) => activityId ? [activityId] : []))
  const requiredIds = new Set(milestones
    .filter(({ optional }) => !optional)
    .flatMap(({ activityId }) => activityId ? [activityId] : []))
  return tree.activityIds.filter((activityId) =>
    !optionalIds.has(activityId) || requiredIds.has(activityId))
}

export function academyRouteProgress(
  snapshot: LearningApplicationSnapshot,
  routeId: string,
): AcademyRouteProgress {
  const tree = academyRouteTree(snapshot.product, routeId)
  if (!tree) {
    return {
      completedActivities: 0,
      startedActivities: 0,
      totalActivities: 0,
      completedDemonstrationActivities: 0,
      totalDemonstrationActivities: 0,
      routeComplete: false,
      demonstratedCompetencies: 0,
      transferredCompetencies: 0,
      retainedCompetencies: 0,
      totalCompetencies: 0,
    }
  }
  const requiredActivityIds = academyRequiredActivityIds(snapshot.product, routeId)
  const requiredActivityIdSet = new Set(requiredActivityIds)
  const sessions = snapshot.sessions.items.filter(({ activityId }) => requiredActivityIdSet.has(activityId))
  const completed = new Set(
    tree.modules.flatMap(({ lessons }) => lessons.flatMap(({ activities }) =>
      activities
        .filter(({ id }) => requiredActivityIdSet.has(id))
        .filter((activity) => academyActivitySatisfiesProgression(snapshot, activity))
        .map(({ id }) => id))),
  )
  const started = new Set(sessions.map(({ activityId }) => activityId))
  const demonstrationActivityIds = (tree.route.learningDesign?.demonstrationActivityIds ?? [])
    .filter((activityId) => requiredActivityIdSet.has(activityId))
  const completedDemonstrations = demonstrationActivityIds.filter((activityId) => {
    const activity = snapshot.product.activities.find(({ id }) => id === activityId)
    if (!activity) return false
    const achievement = academyActivityAchievement(snapshot, activity)
    return achievement === 'demonstrated' || achievement === 'transferred' || achievement === 'retained'
  })
  const requiredCompetencyIds = [...new Set(requiredActivityIds.flatMap((activityId) =>
    snapshot.product.activities.find(({ id }) => id === activityId)?.competencyIds ?? []))]
  const mastery = requiredCompetencyIds.flatMap((competencyId) => {
    const item = snapshot.mastery.items.find((candidate) => candidate.competencyId === competencyId)
    return item ? [item] : []
  })
  const nextLearningUnit = academyNextLearningUnit(snapshot, routeId)
  return {
    completedActivities: completed.size,
    startedActivities: started.size,
    totalActivities: requiredActivityIds.length,
    completedDemonstrationActivities: completedDemonstrations.length,
    totalDemonstrationActivities: demonstrationActivityIds.length,
    routeComplete: completed.size >= requiredActivityIds.length
      && (demonstrationActivityIds.length === 0 || completedDemonstrations.length >= demonstrationActivityIds.length),
    demonstratedCompetencies: mastery.filter(({ state }) => state === 'demonstrated' || state === 'retained').length,
    transferredCompetencies: mastery.filter(({ transferEvidenceIds }) => (transferEvidenceIds?.length ?? 0) > 0).length,
    retainedCompetencies: mastery.filter(({ state }) => state === 'retained').length,
    totalCompetencies: requiredCompetencyIds.length,
    nextLearningUnit,
    nextActivityId: nextLearningUnit?.kind === 'activity'
      ? nextLearningUnit.activityId
      : undefined,
  }
}

export function completedAcademyRouteIds(snapshot: LearningApplicationSnapshot): Set<string> {
  return new Set(realAcademyRoutes(snapshot.product)
    .filter((route) => academyRouteProgress(snapshot, route.id).routeComplete)
    .map(({ id }) => id))
}

export function academyRoutePrerequisiteStatus(
  snapshot: LearningApplicationSnapshot,
  routeId: string,
): AcademyRoutePrerequisiteStatus {
  return curriculumPrerequisiteStatus(routeId, completedAcademyRouteIds(snapshot))
}

function latestSessionForActivity(
  snapshot: LearningApplicationSnapshot,
  activityId: string,
) {
  return snapshot.sessions.items
    .filter((session) => session.activityId === activityId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
}

/**
 * Resuelve el siguiente paso de la ruta sin confundir "continuar aprendiendo"
 * con "abrir la siguiente evaluación".
 *
 * Una lección que todavía no tiene sesiones comienza por su primer bloque
 * editorial (o por la ficha de lección si no contiene bloques). La actividad
 * solo pasa a ser el siguiente paso después de que se haya iniciado
 * explícitamente desde la lección o desde una superficie de exploración libre.
 */
export function academyNextLearningUnit(
  snapshot: LearningApplicationSnapshot,
  routeId: string,
): AcademyNextLearningUnit | undefined {
  const tree = academyRouteTree(snapshot.product, routeId)
  if (!tree) return undefined
  const requiredActivityIdSet = new Set(academyRequiredActivityIds(snapshot.product, routeId))

  for (const { module, lessons } of tree.modules) {
    for (const lesson of lessons) {
      const requiredActivities = lesson.activities.filter(({ id }) => requiredActivityIdSet.has(id))
      if (requiredActivities.length === 0) continue
      const sessions = requiredActivities.flatMap(({ id }) =>
        snapshot.sessions.items.filter((session) => session.activityId === id))
      const completedActivityIds = new Set(
        requiredActivities
          .filter((activity) => academyActivitySatisfiesProgression(snapshot, activity))
          .map(({ id }) => id),
      )
      const pendingActivities = requiredActivities.filter(({ id }) => !completedActivityIds.has(id))

      if (pendingActivities.length === 0) continue

      if (sessions.length === 0) {
        const material = academyLessonMaterial(snapshot.product, lesson.id)
        const firstBlock = material?.blocks[0]
        if (firstBlock) {
          return {
            kind: 'block',
            routeId,
            moduleId: module.id,
            lessonId: lesson.id,
            blockId: firstBlock.id,
            title: firstBlock.localization?.title
              ? localize(snapshot.profile?.locale, firstBlock.localization.title)
              : firstBlock.title,
            href: `#/learning/lesson/${encodeURIComponent(lesson.id)}?block=${encodeURIComponent(firstBlock.id)}`,
            reason: 'introduction',
          }
        }
        return {
          kind: 'lesson',
          routeId,
          moduleId: module.id,
          lessonId: lesson.id,
          title: localize(snapshot.profile?.locale, lesson.title),
          href: `#/learning/lesson/${encodeURIComponent(lesson.id)}`,
          reason: 'introduction',
        }
      }

      const recoverable = pendingActivities
        .map((activity) => ({ activity, session: latestSessionForActivity(snapshot, activity.id) }))
        .filter(({ session }) => session && ['active', 'paused', 'suspended', 'interrupted', 'recovering'].includes(session.state))
        .sort((left, right) => right.session!.updatedAt.localeCompare(left.session!.updatedAt))[0]
      if (recoverable?.session) {
        return {
          kind: 'activity',
          routeId,
          moduleId: module.id,
          lessonId: lesson.id,
          activityId: recoverable.activity.id,
          title: localize(snapshot.profile?.locale, recoverable.activity.title),
          href: `#/learning/recovery/${encodeURIComponent(recoverable.session.id)}`,
          reason: 'resume',
        }
      }

      const activity = pendingActivities[0]
      if (activity) {
        return {
          kind: 'activity',
          routeId,
          moduleId: module.id,
          lessonId: lesson.id,
          activityId: activity.id,
          title: localize(snapshot.profile?.locale, activity.title),
          href: `#/learning/activity/${encodeURIComponent(activity.id)}`,
          reason: 'practice',
        }
      }

      return {
        kind: 'lesson',
        routeId,
        moduleId: module.id,
        lessonId: lesson.id,
        title: localize(snapshot.profile?.locale, lesson.title),
        href: `#/learning/lesson/${encodeURIComponent(lesson.id)}`,
        reason: 'introduction',
      }
    }
  }
  return undefined
}

export function currentAcademyRoute(snapshot: LearningApplicationSnapshot): LearningRouteDescriptor | undefined {
  const realRoutes = realAcademyRoutes(snapshot.product)
  const latestRelevant = snapshot.sessions.items
    .filter(({ activityId }) => snapshot.product.activities.some(({ id, demo }) => id === activityId && !demo))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  if (latestRelevant) {
    const route = realRoutes.find(({ id }) =>
      academyRouteTree(snapshot.product, id)?.activityIds.includes(latestRelevant.activityId))
    if (route) return route
  }
  return realRoutes.find((route) => academyRouteProgress(snapshot, route.id).startedActivities > 0)
    ?? realRoutes[0]
}

export function academyLessonMaterial(
  product: LearningProductIndex,
  lessonId: string,
): AcademyLessonMaterial | undefined {
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  if (!descriptor) return undefined
  for (const content of INTEGRATED_LEARNING_CONTENT) {
    const lesson = content.pack.lessons.find(({ id }) => id === lessonId)
    if (!lesson) continue
    const blocks = content.pack.blocks.filter(({ id }) => lesson.blockIds.includes(id))
    const lessonMarkdown = blocks.map(({ bodyMarkdown }) => bodyMarkdown).join('\n')
    const sourceIds = new Set([
      ...(lesson.authoring?.sourceIds ?? []),
      ...blocks
        .flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id))),
    ])
    return {
      packageId: content.pack.manifest.id,
      packageVersion: content.pack.manifest.packageVersion,
      pack: content.pack,
      lesson,
      blocks,
      activities: descriptor.activityIds.flatMap((activityId) => {
        const activity = product.activities.find(({ id }) => id === activityId)
        return activity ? [activity] : []
      }),
      sources: content.pack.sources.filter(({ id }) => sourceIds.has(id)),
      glossary: content.pack.glossary.filter(({ id }) => lessonMarkdown.includes(`{{term:${id}}}`)),
    }
  }
  return undefined
}

export function academyFixtureSummaries(): Array<{
  fixture: TechnicalMovementFixture
  officialParts: number
  conceptualParts: number
  sourceCount: number
  subsystems: string[]
}> {
  return TECHNICAL_MOVEMENT_FIXTURES.map((fixture) => ({
    fixture,
    officialParts: fixture.ledger.filter(({ entityKind }) => entityKind.startsWith('official-')).length,
    conceptualParts: fixture.ledger.filter(({ entityKind }) => entityKind === 'conceptual-component').length,
    sourceCount: fixture.sourceIds.length,
    subsystems: [...new Set(fixture.ledger.map(({ subsystem }) => subsystem))].sort(),
  }))
}

function contentSearchEntries(locale: string | undefined): AcademySearchEntry[] {
  return INTEGRATED_LEARNING_CONTENT.flatMap(({ pack }) => [
    ...pack.glossary.map((entry): AcademySearchEntry => ({
      id: entry.id,
      kind: 'term',
      title: entry.authoring ? localize(locale, entry.authoring.terms) : entry.term,
      description: entry.authoring?.simpleDefinition
        ? localize(locale, entry.authoring.simpleDefinition)
        : entry.definitionMarkdown,
      keywords: [
        entry.term,
        ...(entry.authoring?.synonyms.es ?? []),
        ...(entry.authoring?.synonyms.en ?? []),
      ].join(' '),
      href: `#/learning/glossary?term=${encodeURIComponent(entry.id)}`,
      context: String(pack.manifest.title),
    })),
    ...pack.sources.map((source): AcademySearchEntry => ({
      id: `${pack.manifest.id}:${source.id}`,
      kind: 'source',
      title: source.resource.title,
      description: source.supportedClaim,
      keywords: [
        source.authority,
        source.usage,
        source.sourceType,
        source.calibre,
        source.chapter,
      ].filter(Boolean).join(' '),
      href: `#/learning/sources?source=${encodeURIComponent(source.id)}`,
      context: `${pack.manifest.id}@${pack.manifest.packageVersion}`,
    })),
  ])
}

export function buildAcademySearchIndex(
  snapshot: LearningApplicationSnapshot,
  notes: AcademyNote[],
): AcademySearchEntry[] {
  const locale = snapshot.profile?.locale
  const product = snapshot.product
  const studentRoutes = realAcademyRoutes(product)
  const studentTrees = studentRoutes.flatMap((route) => {
    const tree = academyRouteTree(product, route.id)
    return tree ? [tree] : []
  })
  const studentModuleIds = new Set(studentTrees.flatMap(({ modules }) => modules.map(({ module }) => module.id)))
  const studentLessonIds = new Set(studentTrees.flatMap(({ modules }) => modules.flatMap(({ lessons }) => lessons.map(({ id }) => id))))
  const studentActivityIds = new Set(studentTrees.flatMap(({ activityIds }) => activityIds))
  const entries: AcademySearchEntry[] = [
    ...studentRoutes.map((route): AcademySearchEntry => ({
      id: route.id,
      kind: 'route',
      title: localize(locale, route.title),
      description: localize(locale, route.purpose),
      keywords: [...route.movementIds, ...route.competencyIds, route.difficulty].join(' '),
      href: `#/learning/route/${encodeURIComponent(route.id)}`,
      context: 'Ruta',
    })),
    ...product.modules.filter(({ id }) => studentModuleIds.has(id)).map((module): AcademySearchEntry => ({
      id: module.id,
      kind: 'module',
      title: localize(locale, module.title),
      description: `${module.lessonIds.length} lecciones`,
      keywords: module.lessonIds.join(' '),
      href: `#/learning/module/${encodeURIComponent(module.id)}`,
      context: 'Módulo',
    })),
    ...product.lessons.filter(({ id }) => studentLessonIds.has(id)).map((lesson): AcademySearchEntry => ({
      id: lesson.id,
      kind: 'lesson',
      title: localize(locale, lesson.title),
      description: localize(locale, lesson.purpose),
      keywords: [...lesson.activityIds, ...lesson.conceptIds].join(' '),
      href: `#/learning/lesson/${encodeURIComponent(lesson.id)}`,
      context: 'Lección',
    })),
    ...product.activities.filter(({ id }) => studentActivityIds.has(id)).map((activity): AcademySearchEntry => ({
      id: activity.id,
      kind: 'activity',
      title: localize(locale, activity.title),
      description: localize(locale, activity.description),
      keywords: [
        activity.subsystem,
        activity.difficulty,
        activity.activityType,
        ...activity.movementIds,
        ...activity.familyIds,
        ...activity.competencyIds,
      ].join(' '),
      href: `#/learning/activity/${encodeURIComponent(activity.id)}`,
      context: `${activity.durationMinutes} min · ${activity.fidelity.geometry}/${activity.fidelity.kinematics}/${activity.fidelity.physics}`,
    })),
    ...academyFixtureSummaries().flatMap(({ fixture }) => [
      {
        id: fixture.id,
        kind: 'fixture' as const,
        title: fixture.calibre ? `${fixture.manufacturer ?? ''} ${fixture.calibre}`.trim() : humanizeLearningId(fixture.id),
        description: `${fixture.reconstructionLevel} · ${fixture.ledger.length} registros · ${fixture.kind}`,
        keywords: `${fixture.family} ${fixture.variant} ${fixture.sourceIds.join(' ')}`,
        href: `#/learning/atlas?fixture=${encodeURIComponent(fixture.id)}`,
        context: `${fixture.fidelity.geometry}/${fixture.fidelity.kinematics}/${fixture.fidelity.physics}`,
      },
      ...fixture.ledger.map((record): AcademySearchEntry => ({
        id: `${fixture.id}:${record.canonicalId}`,
        kind: 'part',
        title: locale?.startsWith('en') ? record.nameEn : record.nameEs,
        description: `${record.subsystem} · ${record.reconstructionLevel} · ${record.modelState}`,
        keywords: [
          record.nameEs,
          record.nameEn,
          record.officialReference,
          record.subsystem,
          record.entityKind,
        ].filter(Boolean).join(' '),
        href: `#/learning/atlas?fixture=${encodeURIComponent(fixture.id)}&part=${encodeURIComponent(record.canonicalId)}`,
        context: fixture.calibre ?? fixture.family,
      })),
    ]),
    ...contentSearchEntries(locale),
    ...notes.map((note): AcademySearchEntry => ({
      id: note.id,
      kind: 'note',
      title: note.title,
      description: note.body,
      keywords: note.tags.join(' '),
      href: `#/learning/notebook?note=${encodeURIComponent(note.id)}`,
      context: 'Nota privada local',
    })),
  ]
  return entries.filter((entry, index) =>
    entries.findIndex(({ kind, id }) => kind === entry.kind && id === entry.id) === index)
}

export function competencyLabel(competencyId: string, locale: string | undefined): string {
  for (const { pack } of INTEGRATED_LEARNING_CONTENT) {
    const competency = pack.competencies.find(({ id }) => id === competencyId)
    if (!competency) continue
    return competency.authoring
      ? localize(locale, competency.authoring.title)
      : competency.title
  }
  return humanizeLearningId(competencyId)
}
