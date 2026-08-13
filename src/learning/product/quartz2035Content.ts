import quartz2035PackInput from '../../../learning-content/quartz-miyota2035/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedQuartz2035LearningPack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(quartz2035PackInput))
}

export function createIntegratedQuartz2035LearningPackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedQuartz2035LearningPack(), [])
}

export const QUARTZ_2035_LEARNING_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedQuartz2035LearningPack(),
)

