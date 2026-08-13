import mechanicalPackInput from '../../../learning-content/mechanical-foundations/dist/pack.json'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

export function createIntegratedMechanicalFoundationsPack(): LearningPack {
  return LearningPackSchema.parse(structuredClone(mechanicalPackInput))
}

export function createIntegratedMechanicalFoundationsPackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedMechanicalFoundationsPack(), [])
}

export const MECHANICAL_FOUNDATIONS_PRODUCT_INDEX = createLearningProductIndex(
  createIntegratedMechanicalFoundationsPack(),
)
