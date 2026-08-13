export interface LearningPackSchemaValidationError {
  instancePath: string
  keyword: string
  params: Record<string, unknown>
  message?: string
}

declare function validateLearningPackJsonSchema(value: unknown): boolean

declare namespace validateLearningPackJsonSchema {
  let errors: LearningPackSchemaValidationError[] | null
}

export default validateLearningPackJsonSchema
