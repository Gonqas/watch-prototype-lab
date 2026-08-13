export type ExecutableResponseKind =
  | 'single-choice'
  | 'multiple-choice'
  | 'ordered-list'
  | 'entity-selection'
  | 'short-text'
  | 'structured-response'
  | 'unknown'

export interface ExecutableStructuredField {
  id: string
  kind: 'choice' | 'entity' | 'short-text' | 'confidence'
  required: boolean
  optionIds: string[]
}

export interface ExecutableHint {
  id: string
  level: number
  kind:
    | 'orientation'
    | 'subsystem'
    | 'functional-property'
    | 'comparison'
    | 'near-answer'
    | 'post-attempt-explanation'
  content: string
  availableAfterAttempts: number
  countsAsHint: boolean
}

export interface ExecutableQuestion {
  id: string
  responseKind: string
  optionIds: string[]
  structuredFields: ExecutableStructuredField[]
  hints: ExecutableHint[]
  humanReviewRequired: boolean
}

export interface AnswerExpectation {
  criterionId: string
  expectedOptionIds: string[]
}

export interface StructuredAnswerExpectation {
  criterionId: string
  requiredFieldIds: string[]
  pendingHumanReview: boolean
}

export type NormalizedStructuredValue = string | string[] | number | null

export interface NormalizedAnswerEvaluation {
  questionId: string
  responseKind: ExecutableResponseKind
  normalizedAnswerIds: string[]
  normalizedText: string | null
  normalizedStructuredFields: Record<string, NormalizedStructuredValue>
  complete: boolean
  correct: boolean | null
  pendingReview: boolean
  satisfiedComponentIds: string[]
  unsatisfiedComponentIds: string[]
  unexpectedAnswerIds: string[]
  unexpectedFieldIds: string[]
}

function executableResponseKind(value: string): ExecutableResponseKind {
  if (
    value === 'single-choice'
    || value === 'multiple-choice'
    || value === 'ordered-list'
    || value === 'entity-selection'
    || value === 'short-text'
    || value === 'structured-response'
  ) return value
  return 'unknown'
}

function normalizedString(value: unknown): string {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/g, ' ')
    : ''
}

function answerIdValues(answer: unknown): unknown[] {
  if (Array.isArray(answer)) return answer
  if (typeof answer === 'string') return [answer]
  if (!answer || typeof answer !== 'object') return []
  const record = answer as Record<string, unknown>
  if (Array.isArray(record.optionIds)) return record.optionIds
  if (Array.isArray(record.orderedIds)) return record.orderedIds
  if (Array.isArray(record.entityIds)) return record.entityIds
  if (typeof record.optionId === 'string') return [record.optionId]
  if (typeof record.entityId === 'string') return [record.entityId]
  return []
}

function normalizedIds(answer: unknown): string[] {
  return answerIdValues(answer)
    .filter((value): value is string => typeof value === 'string')
    .map(normalizedString)
    .filter(Boolean)
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function sameSet(left: string[], right: string[]): boolean {
  const a = unique(left).sort()
  const b = unique(right).sort()
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function normalizeStructuredField(
  field: ExecutableStructuredField,
  value: unknown,
): NormalizedStructuredValue {
  if (field.kind === 'confidence') {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(1, Math.max(0, value))
      : null
  }
  if (field.kind === 'short-text' || field.kind === 'choice') {
    const normalized = normalizedString(value)
    return normalized || null
  }
  const ids = unique(normalizedIds(value)).sort()
  return ids
}

function hasStructuredValue(value: NormalizedStructuredValue): boolean {
  if (value === null) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  return Number.isFinite(value)
}

function isStructuredFieldValid(
  field: ExecutableStructuredField,
  value: NormalizedStructuredValue,
): boolean {
  if (!hasStructuredValue(value)) return false
  if (field.optionIds.length === 0) return true
  if (typeof value === 'string') return field.optionIds.includes(value)
  if (Array.isArray(value)) return value.every((id) => field.optionIds.includes(id))
  return true
}

export function normalizeAndEvaluateAnswer(
  question: ExecutableQuestion,
  answer: unknown,
  expectations: AnswerExpectation[],
  structuredExpectations: StructuredAnswerExpectation[] = [],
): NormalizedAnswerEvaluation {
  const kind = executableResponseKind(question.responseKind)
  const optionIds = new Set(question.optionIds)
  const rawAnswerIds = normalizedIds(answer)
  const normalizedAnswerIds = kind === 'multiple-choice' || kind === 'entity-selection'
    ? unique(rawAnswerIds).sort()
    : rawAnswerIds
  const normalizedText = kind === 'short-text' ? normalizedString(answer) : null
  const unexpectedAnswerIds = normalizedAnswerIds.filter((id) => optionIds.size > 0 && !optionIds.has(id))
  const satisfiedComponentIds: string[] = []
  const unsatisfiedComponentIds: string[] = []
  const structuredInput = answer && typeof answer === 'object' && !Array.isArray(answer)
    ? answer as Record<string, unknown>
    : {}
  const fieldIds = new Set(question.structuredFields.map(({ id }) => id))
  const normalizedStructuredFields = kind === 'structured-response'
    ? Object.fromEntries(question.structuredFields.map((field) => [
      field.id,
      normalizeStructuredField(field, structuredInput[field.id]),
    ]))
    : {}
  const unexpectedFieldIds = kind === 'structured-response'
    ? Object.keys(structuredInput).filter((id) => !fieldIds.has(id)).sort()
    : []

  if (kind === 'structured-response') {
    const required = new Map<string, string>()
    for (const field of question.structuredFields.filter(({ required: value }) => value)) {
      required.set(field.id, `${question.id}:required-field:${field.id}`)
    }
    for (const expectation of structuredExpectations) {
      for (const fieldId of expectation.requiredFieldIds) {
        required.set(fieldId, `${expectation.criterionId}:required-field:${fieldId}`)
      }
    }
    for (const [fieldId, componentId] of required) {
      const field = question.structuredFields.find(({ id }) => id === fieldId)
      const passed = Boolean(field && isStructuredFieldValid(field, normalizedStructuredFields[fieldId]))
      if (passed) satisfiedComponentIds.push(componentId)
      else unsatisfiedComponentIds.push(componentId)
    }
    for (const field of question.structuredFields) {
      const value = normalizedStructuredFields[field.id]
      if (!hasStructuredValue(value) || field.optionIds.length === 0) continue
      const componentId = `${question.id}:valid-field:${field.id}`
      if (isStructuredFieldValid(field, value)) satisfiedComponentIds.push(componentId)
      else unsatisfiedComponentIds.push(componentId)
    }
    if (unexpectedFieldIds.length > 0) unsatisfiedComponentIds.push(`${question.id}:unexpected-fields`)
    const complete = unsatisfiedComponentIds.length === 0
    const pendingReview = question.humanReviewRequired
      || structuredExpectations.some(({ pendingHumanReview }) => pendingHumanReview)
    return {
      questionId: question.id,
      responseKind: kind,
      normalizedAnswerIds: [],
      normalizedText: null,
      normalizedStructuredFields,
      complete,
      correct: pendingReview ? null : complete,
      pendingReview,
      satisfiedComponentIds,
      unsatisfiedComponentIds,
      unexpectedAnswerIds: [],
      unexpectedFieldIds,
    }
  }

  if (kind === 'short-text' || kind === 'unknown' || expectations.length === 0 || question.humanReviewRequired) {
    const complete = kind === 'short-text'
      ? Boolean(normalizedText)
      : normalizedAnswerIds.length > 0
    const componentId = `${question.id}:review-required`
    if (complete) satisfiedComponentIds.push(`${question.id}:response-complete`)
    else unsatisfiedComponentIds.push(`${question.id}:response-complete`)
    unsatisfiedComponentIds.push(componentId)
    return {
      questionId: question.id,
      responseKind: kind,
      normalizedAnswerIds,
      normalizedText,
      normalizedStructuredFields,
      complete,
      correct: null,
      pendingReview: true,
      satisfiedComponentIds,
      unsatisfiedComponentIds,
      unexpectedAnswerIds,
      unexpectedFieldIds,
    }
  }

  for (const expectation of expectations) {
    const expected = expectation.expectedOptionIds
    if (kind === 'single-choice') {
      const passed = normalizedAnswerIds.length === 1
        && expected.includes(normalizedAnswerIds[0])
        && unexpectedAnswerIds.length === 0
      const componentId = `${expectation.criterionId}:accepted-option`
      if (passed) satisfiedComponentIds.push(componentId)
      else unsatisfiedComponentIds.push(componentId)
    } else if (kind === 'ordered-list') {
      expected.forEach((id, index) => {
        const componentId = `${expectation.criterionId}:position:${index}:${id}`
        if (normalizedAnswerIds[index] === id) satisfiedComponentIds.push(componentId)
        else unsatisfiedComponentIds.push(componentId)
      })
      const exactLength = normalizedAnswerIds.length === expected.length && unexpectedAnswerIds.length === 0
      if (exactLength) satisfiedComponentIds.push(`${expectation.criterionId}:exact-length`)
      else unsatisfiedComponentIds.push(`${expectation.criterionId}:exact-length`)
    } else {
      expected.forEach((id) => {
        const componentId = `${expectation.criterionId}:contains:${id}`
        if (normalizedAnswerIds.includes(id)) satisfiedComponentIds.push(componentId)
        else unsatisfiedComponentIds.push(componentId)
      })
      const exactSet = sameSet(normalizedAnswerIds, expected)
        && normalizedAnswerIds.length === unique(expected).length
        && unexpectedAnswerIds.length === 0
      if (exactSet) satisfiedComponentIds.push(`${expectation.criterionId}:exact-set`)
      else unsatisfiedComponentIds.push(`${expectation.criterionId}:exact-set`)
    }
  }

  const complete = normalizedAnswerIds.length > 0
  return {
    questionId: question.id,
    responseKind: kind,
    normalizedAnswerIds,
    normalizedText,
    normalizedStructuredFields,
    complete,
    correct: complete && unsatisfiedComponentIds.length === 0,
    pendingReview: false,
    satisfiedComponentIds,
    unsatisfiedComponentIds,
    unexpectedAnswerIds,
    unexpectedFieldIds,
  }
}
