import capstonePackInput from '../../../learning-content/watchmaking-capstone/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedWatchmakingCapstonePack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(capstonePackInput))
}

export function createIntegratedWatchmakingCapstonePackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedWatchmakingCapstonePack(), [])
}

export const WATCHMAKING_CAPSTONE_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedWatchmakingCapstonePack(),
)
