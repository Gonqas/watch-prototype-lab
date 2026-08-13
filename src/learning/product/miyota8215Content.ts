import miyota8215PackInput from '../../../learning-content/miyota8215/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedMiyota8215Pack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(miyota8215PackInput))
}

export function createIntegratedMiyota8215PackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedMiyota8215Pack(), [])
}

export const MIYOTA_8215_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedMiyota8215Pack(),
)
