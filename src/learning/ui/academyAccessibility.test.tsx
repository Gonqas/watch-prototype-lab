import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RestrictedMarkdown } from './AcademySurfaces'
import area from './LearningArea.tsx?raw'
import shell from './AcademyShell.tsx?raw'
import surfaces from './AcademySurfaces.tsx?raw'

describe('presentación accesible de la teoría', () => {
  it('convierte listas editoriales en listas semánticas sin saltos decorativos', () => {
    const markup = renderToStaticMarkup(
      <RestrictedMarkdown markdown={'## Antes de empezar\n- Comprueba la energía\n- Sigue la transmisión\n\n1. Observa\n2. Explica'} />,
    )

    expect(markup).toContain('<h3>Antes de empezar</h3>')
    expect(markup).toContain('<ul>')
    expect(markup).toContain('<li>Comprueba la energía</li>')
    expect(markup).toContain('<ol>')
    expect(markup).toContain('<li>Explica</li>')
    expect(markup).not.toContain('<br')
  })

  it('mantiene los enlaces internos y externos como enlaces reales', () => {
    const markup = renderToStaticMarkup(
      <RestrictedMarkdown markdown={'Consulta [la lección](#/learning/lesson/base) y [la fuente](https://example.test/source).'} />,
    )

    expect(markup).toContain('href="#/learning/lesson/base"')
    expect(markup).toContain('href="https://example.test/source"')
  })

  it('conecta las preferencias de contraste, movimiento y lectura con la presentación real', () => {
    expect(area).toContain('is-high-contrast')
    expect(area).toContain('is-reduced-motion')
    expect(area).toContain('is-label-priority')
    expect(area).toContain("import './learning.css'")
    expect(shell).toContain("import './academy.css'")
    expect(surfaces).toContain("import './academy-surfaces.css'")
  })

  it('evita que el enlace de salto interfiera con la navegación por hash y mueve el foco al contenido', () => {
    expect(area).toContain('event.preventDefault()')
    expect(area).toContain("document.getElementById('learning-main')?.focus()")
  })
})
