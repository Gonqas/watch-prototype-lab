import type { LearningPack } from '../content/learningPack'
import type { CompositeAssessmentRule } from '../persistence/assessmentEngine'
import type { EvidenceExtractionRule } from '../persistence/evidenceEngine'
import {
  createIntegratedAuthoringExamplePack,
  createIntegratedAuthoringExamplePackageBytes,
  AUTHORING_EXAMPLE_PRODUCT_INDEX,
} from './authoringExample'
import {
  createIntegratedDemoLearningPack,
  createIntegratedDemoLearningPackageBytes,
  DEMO_LEARNING_PRODUCT_INDEX,
  mergeLearningProductIndexes,
  type LearningProductIndex,
} from './demoPackage'
import {
  createIntegratedHorologyLearningPack,
  createIntegratedHorologyLearningPackageBytes,
  HOROLOGY_LEARNING_PRODUCT_INDEX,
} from './horologyContent'
import {
  createIntegratedQuartz2035LearningPack,
  createIntegratedQuartz2035LearningPackageBytes,
  QUARTZ_2035_LEARNING_PRODUCT_INDEX,
} from './quartz2035Content'
import {
  createIntegratedMechanicalFoundationsPack,
  createIntegratedMechanicalFoundationsPackageBytes,
  MECHANICAL_FOUNDATIONS_PRODUCT_INDEX,
} from './mechanicalFoundationsContent'
import {
  createIntegratedMiyota8215Pack,
  createIntegratedMiyota8215PackageBytes,
  MIYOTA_8215_PRODUCT_INDEX,
} from './miyota8215Content'
import {
  createIntegratedInspectionMetrologyPack,
  createIntegratedInspectionMetrologyPackageBytes,
  INSPECTION_METROLOGY_PRODUCT_INDEX,
} from './inspectionMetrologyContent'
import {
  ADVANCED_WATCHMAKING_PRODUCT_INDEX,
  createIntegratedAdvancedWatchmakingPack,
  createIntegratedAdvancedWatchmakingPackageBytes,
} from './advancedWatchmakingContent'
import {
  WATCHMAKING_CAPSTONE_PRODUCT_INDEX,
  createIntegratedWatchmakingCapstonePack,
  createIntegratedWatchmakingCapstonePackageBytes,
} from './watchmakingCapstoneContent'
import {
  WATCHMAKING_ENCYCLOPEDIA_PRODUCT_INDEX,
  createIntegratedWatchmakingEncyclopediaPack,
  createIntegratedWatchmakingEncyclopediaPackageBytes,
} from './watchmakingEncyclopediaContent'

export interface IntegratedLearningContent {
  pack: LearningPack
  bytes: Uint8Array
  product: LearningProductIndex
}

function contentKey(packageId: string, packageVersion: string): string {
  return `${packageId}@${packageVersion}`
}

const integratedContent: IntegratedLearningContent[] = [
  {
    pack: createIntegratedDemoLearningPack(),
    bytes: createIntegratedDemoLearningPackageBytes(),
    product: DEMO_LEARNING_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedAuthoringExamplePack(),
    bytes: createIntegratedAuthoringExamplePackageBytes(),
    product: AUTHORING_EXAMPLE_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedHorologyLearningPack(),
    bytes: createIntegratedHorologyLearningPackageBytes(),
    product: HOROLOGY_LEARNING_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedQuartz2035LearningPack(),
    bytes: createIntegratedQuartz2035LearningPackageBytes(),
    product: QUARTZ_2035_LEARNING_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedMechanicalFoundationsPack(),
    bytes: createIntegratedMechanicalFoundationsPackageBytes(),
    product: MECHANICAL_FOUNDATIONS_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedMiyota8215Pack(),
    bytes: createIntegratedMiyota8215PackageBytes(),
    product: MIYOTA_8215_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedInspectionMetrologyPack(),
    bytes: createIntegratedInspectionMetrologyPackageBytes(),
    product: INSPECTION_METROLOGY_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedAdvancedWatchmakingPack(),
    bytes: createIntegratedAdvancedWatchmakingPackageBytes(),
    product: ADVANCED_WATCHMAKING_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedWatchmakingCapstonePack(),
    bytes: createIntegratedWatchmakingCapstonePackageBytes(),
    product: WATCHMAKING_CAPSTONE_PRODUCT_INDEX,
  },
  {
    pack: createIntegratedWatchmakingEncyclopediaPack(),
    bytes: createIntegratedWatchmakingEncyclopediaPackageBytes(),
    product: WATCHMAKING_ENCYCLOPEDIA_PRODUCT_INDEX,
  },
]

const byKey = new Map(integratedContent.map((entry) => [
  contentKey(entry.pack.manifest.id, entry.pack.manifest.packageVersion),
  entry,
]))

export const INTEGRATED_LEARNING_CONTENT = integratedContent.map((entry) => ({
  pack: structuredClone(entry.pack),
  bytes: entry.bytes.slice(),
  product: structuredClone(entry.product),
}))

export const INTEGRATED_LEARNING_PRODUCT_INDEX = mergeLearningProductIndexes(
  integratedContent.map(({ product }) => product),
)

export function findIntegratedLearningContent(packageId: string, packageVersion: string): IntegratedLearningContent | undefined {
  const entry = byKey.get(contentKey(packageId, packageVersion))
  return entry ? {
    pack: structuredClone(entry.pack),
    bytes: entry.bytes.slice(),
    product: structuredClone(entry.product),
  } : undefined
}

export function findCurrentIntegratedLearningContent(packageId: string): IntegratedLearningContent | undefined {
  const entry = integratedContent.find(({ pack }) => pack.manifest.id === packageId)
  return entry ? {
    pack: structuredClone(entry.pack),
    bytes: entry.bytes.slice(),
    product: structuredClone(entry.product),
  } : undefined
}

export function integratedEvidenceRules(): EvidenceExtractionRule[] {
  return integratedContent.flatMap(({ pack }) =>
    pack.evidenceTemplates.flatMap(({ extraction }) => extraction ? [structuredClone(extraction)] : []))
}

export function assessmentRuleForActivity(packageId: string, packageVersion: string, activityId: string): CompositeAssessmentRule {
  const entry = byKey.get(contentKey(packageId, packageVersion))
  const activity = entry?.pack.activities.find(({ id }) => id === activityId)
  const rubric = entry?.pack.rubrics.find(({ id }) => id === activity?.rubricId)
  if (!rubric?.assessmentRule) throw new Error(`La actividad ${activityId} no tiene una assessmentRule ejecutable.`)
  const rule = structuredClone(rubric.assessmentRule)
  const intent = activity?.authoring?.pedagogicalContract?.assessmentIntent
  if (intent === 'none') {
    return {
      ...rule,
      id: `${rule.id}.exposure`,
      targetState: 'introduced',
    }
  }
  // La transferencia y las comprobaciones de dominio solo pueden culminar en
  // "demostrada". Esto prevalece sobre una etiqueta editorial formativa: la
  // evidencia seguirá requiriendo las condiciones de la rúbrica (incluida la
  // revisión humana), pero nunca quedará degradada a mera práctica por un
  // metadato incoherente.
  if (activity?.authoring?.pedagogicalContract?.purpose === 'transfer') {
    return {
      ...rule,
      id: `${rule.id}.transfer`,
      targetState: 'demonstrated',
    }
  }
  if (intent === 'formative') {
    return {
      ...rule,
      id: `${rule.id}.formative`,
      targetState: 'practising',
    }
  }
  if (intent === 'retention') return { ...rule, targetState: 'retained' }
  return rule
}
