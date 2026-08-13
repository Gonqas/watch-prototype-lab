import encyclopediaPackInput from '../../../learning-content/watchmaking-encyclopedia/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedWatchmakingEncyclopediaPack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(encyclopediaPackInput))
}

export function createIntegratedWatchmakingEncyclopediaPackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedWatchmakingEncyclopediaPack(), [])
}

export const WATCHMAKING_ENCYCLOPEDIA_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedWatchmakingEncyclopediaPack(),
)
