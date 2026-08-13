import type {
  LearningProfile,
  PersistedLearningEvent,
  PersistentEvidenceRecord,
  PersistentLearningSession,
} from './models'

export const FIXED_NOW = '2026-07-23T09:00:00.000Z'
export const PROJECT_HASH = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

export function profileFixture(id = 'profile.local-default'): LearningProfile {
  return {
    schemaVersion: 1,
    id,
    displayName: 'Perfil local',
    locale: 'es-ES',
    accessibility: {
      reducedMotion: false,
      textScale: 1,
      contrast: 'system',
      interactionMode: 'adaptive',
      extendedTime: false,
      readLabels: false,
      adaptations: [],
    },
    educationalPreferences: {},
    createdAt: FIXED_NOW,
    modifiedAt: FIXED_NOW,
    archived: false,
    recordVersion: 1,
  }
}

export function sessionFixture(id = 'session.test', profileId = 'profile.local-default'): PersistentLearningSession {
  return {
    schemaVersion: 1,
    id,
    profileId,
    packageId: 'test.contract-pack',
    packageVersion: '1.0.0',
    lessonId: 'lesson.test',
    activityId: 'activity.test',
    activityVersion: '1.0.0',
    rubricId: 'rubric.test',
    rubricVersion: '1.0.0',
    reference: { kind: 'project', projectId: 'project.test' },
    initialProjectFingerprint: PROJECT_HASH,
    currentProjectFingerprint: PROJECT_HASH,
    initialCapabilities: ['learning.scene-runtime@1.0.0'],
    state: 'created',
    startedAt: FIXED_NOW,
    attempt: 1,
    runtimeVersion: '1.0.0',
    updatedAt: FIXED_NOW,
  }
}

export function eventFixture(sequence = 0, sessionId = 'session.test'): PersistedLearningEvent {
  return {
    schemaVersion: 1,
    id: `event.${sequence}`,
    sessionId,
    sequence,
    timestamp: FIXED_NOW,
    runtimeEventVersion: 1,
    type: sequence === 0 ? 'scene-started' : 'answer-submitted',
    origin: 'runtime',
    actor: 'learner',
    payload: sequence === 0 ? { sceneId: 'scene.test' } : { questionId: 'q1' },
    idempotencyKey: `${sessionId}:1:${sequence}`,
    persistedAt: FIXED_NOW,
    compatibility: 'supported',
  }
}

export function evidenceFixture(id = 'evidence.test', sessionId = 'session.test'): PersistentEvidenceRecord {
  return {
    schemaVersion: 1,
    id,
    profileId: 'profile.local-default',
    sessionId,
    competencyId: 'competency.test',
    evidenceType: 'written-response',
    sourceEventIds: ['event.1'],
    packageId: 'test.contract-pack',
    packageVersion: '1.0.0',
    activityId: 'activity.test',
    activityVersion: '1.0.0',
    extractionRuleId: 'rule.answer',
    extractionRuleVersion: '1.0.0',
    content: { questionId: 'q1', accepted: true },
    confidence: 1,
    accessibilityAccommodations: [],
    observedAt: FIXED_NOW,
    createdAt: FIXED_NOW,
    status: 'active',
    provenance: [{ kind: 'runtime-event', reference: 'event.1' }],
    hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  }
}
