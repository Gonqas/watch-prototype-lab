import horologyPackInput from '../../../learning-content/horology-foundations/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedHorologyLearningPack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(horologyPackInput))
}

export function createIntegratedHorologyLearningPackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedHorologyLearningPack(), [])
}

export const HOROLOGY_LEARNING_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedHorologyLearningPack(),
)
