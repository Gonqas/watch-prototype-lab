import authoringExamplePackText from '../../../learning-content/example/dist/pack.json?raw'
import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { encodeLearningPackage } from '../runtime/packageEncoder'
import { createLearningProductIndex } from './demoPackage'

const parsedAuthoringExamplePack = LearningPackSchema.parse(JSON.parse(authoringExamplePackText) as unknown)

export function createIntegratedAuthoringExamplePack(): LearningPack {
  return structuredClone(parsedAuthoringExamplePack)
}

export function createIntegratedAuthoringExamplePackageBytes(): Uint8Array {
  return encodeLearningPackage(createIntegratedAuthoringExamplePack())
}

export const AUTHORING_EXAMPLE_PRODUCT_INDEX = createLearningProductIndex(parsedAuthoringExamplePack)
