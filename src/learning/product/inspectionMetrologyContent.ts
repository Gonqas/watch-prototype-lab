import inspectionMetrologyPackInput from '../../../learning-content/inspection-metrology/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedInspectionMetrologyPack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(inspectionMetrologyPackInput))
}

export function createIntegratedInspectionMetrologyPackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedInspectionMetrologyPack(), [])
}

export const INSPECTION_METROLOGY_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedInspectionMetrologyPack(),
)
