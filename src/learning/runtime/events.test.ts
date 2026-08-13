import { describe, expect, it } from 'vitest'
import { diagnostic } from './diagnostics'
import { RuntimeEventEmitter } from './events'

describe('runtime diagnostics and events', () => {
  it('creates structured stable diagnostics rather than free strings', () => {
    const issue = diagnostic({
      code: 'LR-TEST-STABLE', category: 'content-error', message: 'Contenido inválido.', technicalDetail: 'fixture',
      source: 'compiler', packageId: 'pack.test', sceneId: 'scene.test', suggestedRecovery: 'Corregir fixture.',
      blocking: true, retrySafe: true,
    })
    expect(issue).toMatchObject({ code: 'LR-TEST-STABLE', severity: 'error', blocking: true, retrySafe: true })
    expect(() => JSON.stringify(issue)).not.toThrow()
  })

  it('orders serializable events and keeps a stable session ID without project copies', () => {
    const emitter = new RuntimeEventEmitter('session-test', () => '2026-07-22T12:00:00.000Z')
    emitter.emit({ type: 'scene-started', sceneId: 'scene.test' })
    emitter.emit({ type: 'entity-selected', sceneId: 'scene.test', entityIds: ['pi_test_123456'] })
    const events = emitter.history()
    expect(events.map(({ sequence }) => sequence)).toEqual([0, 1])
    expect(events.every(({ sessionId, eventVersion }) => sessionId === 'session-test' && eventVersion === 1)).toBe(true)
    expect(JSON.stringify(events)).not.toContain('technicalProject')
  })
})
