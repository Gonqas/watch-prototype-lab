import { describe, expect, it } from 'vitest'
import academy from './AcademySurfaces.tsx?raw'
import shell from './AcademyShell.tsx?raw'
import activity from './LearningSurfaces.tsx?raw'
import workspace from './LearningActivityWorkspace.tsx?raw'


describe('jerarquía clara de la Academia', () => {
  it('separa orientación, catálogo y detalles en Inicio y rutas', () => {
    expect(academy).toContain('Tres formas de usar la Academia')
    expect(academy).toContain('prácticas disponibles')
    expect(academy).toContain("visibleActivityIds.has(activityId)")
    expect(academy).toContain('Vista rápida de las {routes.length} rutas')
    expect(academy).toContain('Recursos, alcance y fuentes')
    expect(academy).not.toContain('WATCHMAKER_JOURNEY.map')
  })

  it('prioriza la teoría y agrupa la ayuda secundaria', () => {
    expect(academy).toContain("['reading', BookOpen, 'Teoría']")
    expect(academy).toContain('ANTES DE EMPEZAR')
    expect(academy).toContain('La teoría y el modelo de consulta están disponibles desde ahora')
    expect(academy).toContain('Índice · apartado')
    expect(academy).toContain('Fiabilidad y fuentes · alcance, procedencia y descripción accesible')
    expect(academy).toContain("segments.filter(({ role }) => role !== 'reference')")
    expect(academy).toContain('academy-lesson-reference__content')
    expect(academy).toContain('material.glossary.length > 0')
    expect(academy).toContain('TÉRMINOS ENLAZADOS')
  })

  it('no acredita un apartado por el mero hecho de navegar por el índice', () => {
    const start = academy.indexOf('const moveToSegment =')
    const end = academy.indexOf('const completeCurrentAndMove =')
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)
    const moveToSegment = academy.slice(start, end)
    expect(moveToSegment).toContain('actions.recordLessonSegment(descriptor.id, next.id, [...completedSegmentIds], false)')
    expect(moveToSegment).not.toContain('activeSegment.id')
    expect(academy).toContain('Marcar como estudiado y continuar')
  })

  it('mantiene visible la acción principal de una práctica', () => {
    expect(activity).toContain('Qué vas a hacer')
    expect(activity).toContain('Preparación, recursos y límites')
    expect(activity).toContain('Comprobar y continuar')
    expect(activity).toContain('Ayuda disponible antes de empezar')
    expect(activity).toContain('Empezar práctica')
    expect(activity).toContain('Empezar comprobación sin ayuda')
    expect(activity).toContain('COMPROBACIÓN SIN AYUDA')
    expect(activity).toContain('Esta comprobación no crea un intento')
    expect(workspace).toContain('DEMOSTRACIÓN SIN AYUDA')
    expect(workspace).toContain('Demostración sin pistas')
  })

  it('abre los paneles secundarios solo cuando el usuario los pide', () => {
    expect(shell).toContain("readUxSession('wplab.academy.context-open') === 'true'")
    expect(workspace).toContain("readUxSession('wplab.learning.workspace-right-open') === 'true'")
    expect(shell).toContain("role={drawer ? 'dialog' : undefined}")
    expect(shell).toContain('aria-modal={drawer || undefined}')
    expect(shell).toContain("event.key === 'Escape'")
    expect(shell).toContain('academy-context-backdrop')
    expect(workspace).toContain('role="tablist"')
    expect(workspace).toContain('role="tab"')
    expect(workspace).toContain('aria-controls={`learning-context-panel-${id}`}')
    expect(workspace).toContain('role="tabpanel"')
    expect(workspace).toContain('Qué hacer ahora')
    expect(workspace).toContain('Fuentes, límites y fidelidad')
  })

  it('mantiene la navegación móvil completa y cierra Más al cambiar de destino', () => {
    expect(shell).toContain('mobileMoreSurface')
    expect(shell).toContain('aria-expanded={mobileMoreOpen}')
    expect(shell).toContain('setMobileMoreSurface(undefined)')
    expect(shell).toContain('Navegación principal móvil')
  })

  it('reserva los códigos internos para el detalle técnico opcional', () => {
    expect(shell).not.toContain('<code>{recommendation.rule}</code>')
    expect(academy).not.toContain('title={`${fixture.fidelity.geometry}')
    expect(workspace).toContain('{showTechnicalIds && <code>{workspace.activity.fidelity.geometry}')
    expect(workspace).not.toContain('Reconocer límite R2/P0')
    expect(academy).not.toContain("'Modelo R2'")
    expect(academy).not.toContain('Disponible offline')
    expect(academy).not.toContain('Funciona offline')
    expect(activity).not.toContain('resultado evaluable')
    expect(activity).not.toContain('<label>Offline')
    expect(activity).not.toContain('ayuda y feedback')
  })
})
