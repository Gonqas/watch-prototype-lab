import { describe, expect, it } from 'vitest'
import tauriConfig from '../../src-tauri/tauri.conf.json'

describe('desktop security configuration', () => {
  it('allows the packaged frontend to fetch its own HDRI and texture assets', () => {
    const csp = tauriConfig.app.security.csp
    expect(csp).toMatch(/connect-src[^;]*'self'/)
    expect(csp).toContain('ipc:')
    expect(csp).toContain('http://ipc.localhost')
  })
})
