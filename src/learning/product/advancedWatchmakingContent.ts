import advancedPackInput from '../../../learning-content/advanced-watchmaking/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedAdvancedWatchmakingPack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(advancedPackInput))
}

export function createIntegratedAdvancedWatchmakingPackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedAdvancedWatchmakingPack(), [])
}

export const ADVANCED_WATCHMAKING_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedAdvancedWatchmakingPack(),
)
