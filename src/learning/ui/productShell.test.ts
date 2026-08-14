import { describe, expect, it } from 'vitest'
import { WORKSPACE_NAV_COLUMNS } from '../../appLayout'
import app from '../../App.tsx?raw'
import area from './LearningArea.tsx?raw'
import academy from './AcademyShell.tsx?raw'
import primaryNavigation from './library/AcademyPrimaryNavigation.tsx?raw'
import boundary from './AcademySurfaceBoundary.tsx?raw'
import surfaces from './LearningSurfaces.tsx?raw'
import map from './LearningMapSurface.tsx?raw'
import workspace from './LearningActivityWorkspace.tsx?raw'
import engineeringLab from './EngineeringLabSurface.tsx?raw'
import packageLoader from '../runtime/packageLoader.ts?raw'
import schemaValidator from '../content/schemas/learning-pack-v1.validator.js?raw'

describe('contrato estructural y accesible de la UI de Aprender', () => {
  it('entra desde producción y mantiene el área en chunks diferidos', () => {
    expect(app).toContain("{ id: 'learning', label: 'Aprender'")
    expect(app).toContain("return import('./learning/ui/LearningArea')")
    expect(app).not.toMatch(/^import .*LearningArea/m)
  })

  it('presenta carga y error útiles incluso si falla el chunk de entrada', () => {
    expect(app).toContain('class LearningEntryBoundary')
    expect(app).toContain('Preparando la Academia')
    expect(app).toContain('Volver a Estudio')
    expect(app).toContain('Abrir diagnóstico técnico')
    expect(app).toContain('shouldReloadLearningChunkOnce')
    expect(area).toContain('El proyecto técnico, el progreso, las evidencias, las sesiones y las notas se conservan.')
    expect(area).toContain('onRetry')
  })

  it('precompila JSON Schema sin unsafe-eval para respetar la CSP Desktop', () => {
    expect(packageLoader).toContain("learning-pack-v1.validator.js")
    expect(packageLoader).not.toContain('new Ajv2020')
    expect(schemaValidator).not.toContain('new Function')
    expect(schemaValidator).not.toContain('eval(')
    expect(schemaValidator).toContain('export default')
  })

  it('aísla portada, Atlas, lecciones, workspace y viewport sin derribar AcademyShell', () => {
    expect(academy).toContain('scope={snapshot.location.surface}')
    expect(academy).toContain('scope="workspace"')
    expect(academy).toContain('scope="navigation"')
    expect(workspace).toContain('scope="viewport"')
    expect(workspace).toContain('Continuar en modo textual')
    expect(boundary).toContain('componentDidCatch')
    expect(boundary).toContain('La sesión, el progreso, las evidencias y el proyecto técnico permanecen a salvo.')
  })

  it('mantiene siete áreas alineadas sin posicionar Aprender de forma absoluta', () => {
    expect(WORKSPACE_NAV_COLUMNS).toBe(7)
    expect(app).toContain("'--workspace-nav-columns': WORKSPACE_NAV_COLUMNS")
    expect(app).toContain("workspace === item.id ? 'is-active' : undefined")
    expect(app).not.toMatch(/position:\s*['"]absolute['"]/)
  })

  it('mantiene React separado de SQL, IndexedDB, rúbricas y compilación', () => {
    const ui = [area, academy, surfaces, map, workspace].join('\n')

    expect(ui).not.toMatch(/SqliteLearningRepository|IndexedDbLearningRepository|indexedDB\./)
    expect(ui).not.toMatch(/AssessmentEngine|SceneCompiler|EvidenceProjectionEngine/)
  })

  it('incluye la alternativa al grafo, landmarks, skip link, live region y paneles ajustables por teclado', () => {
    expect(area).toContain('learning-skip-link')
    expect(area).toContain('aria-live="polite"')
    expect(primaryNavigation).toContain('aria-label={compact ? \'Ampliar navegación\' : \'Compactar navegación\'}')
    expect(academy).toContain('ref={mainRef}')
    expect(map).toContain('Lista accesible')
    expect(map).toContain('aria-label="Lista jerárquica del mapa de conocimiento"')
    expect(workspace).toContain('aria-label="Lista accesible de piezas del modelo"')
    expect(workspace).toContain('aria-label="Alternativa textual completa"')
    expect(workspace).toContain('aria-label="Reducir panel izquierdo"')
    expect(workspace).toContain('type="range"')
    expect(area).toContain("import './learning.css'")
  })

  it('no depende solo de color para dominio ni disponibilidad', () => {
    for (const state of ['No iniciado', 'Introducido', 'En práctica', 'Demostrado', 'Consolidado']) {
      expect(surfaces).toContain(state)
    }
    expect(map).toContain('Base pendiente')
    expect(map).toContain('Cómo se ha calculado tu progreso')
    expect(map).toContain('Familiaridad declarada')
  })

  it('separa exploración de ingeniería, trazabilidad y acreditación', () => {
    expect(engineeringLab).toContain('TU RECORRIDO POR LOS CÁLCULOS')
    expect(engineeringLab).toContain('Qué puedes concluir')
    expect(engineeringLab).toContain('Guardar en cuaderno')
    expect(engineeringLab).toContain('Cuándo sirve este cálculo')
    expect(engineeringLab).toContain('se comprueba después con una actividad independiente')
  })
})
