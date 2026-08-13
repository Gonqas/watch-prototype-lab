import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

describe('watch viewer layout guards', () => {
  it('keeps decorative viewer overlays from covering the 3D canvas', () => {
    expect(appCss).not.toMatch(/\.studio-canvas-wrap\s*>\s*div\s*\{/)
    expect(appCss).toMatch(/\.studio-canvas-wrap canvas\s*\{[\s\S]*width:\s*100%\s*!important;[\s\S]*height:\s*100%\s*!important;/)
    expect(appCss).toMatch(/\.scene-label,\s*\n\.scene-corner-label\s*\{[\s\S]*pointer-events:\s*none;/)
  })
})
