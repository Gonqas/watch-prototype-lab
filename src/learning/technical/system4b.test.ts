import { describe, expect, it } from 'vitest'
import { EMPTY_LEARNING_OVERLAY } from '../runtime/overlay'
import { ProjectEntityIndex } from '../canonical'
import { SemanticSelectorResolver } from '../runtime/selectors'
import { createQuartzProject } from '../../vnext/presets'
import {
  CONCEPTUAL_MECHANICAL_FIXTURE,
  CONCEPTUAL_QUARTZ_FIXTURE,
  FIRST_MODULE_TECHNICAL_FIXTURE,
  MIYOTA_2035_TECHNICAL_FIXTURE,
  MIYOTA_8215_TECHNICAL_FIXTURE,
  TECHNICAL_MOVEMENT_FIXTURES,
  compileFirstModuleTechnicalFixture,
} from './fixtures'
import { TechnicalFixtureViewportBridge } from './fixtureBridge'
import {
  MIYOTA_OFFICIAL_SOURCE_REGISTRY,
  MIYOTA_OFFICIAL_SOURCE_REGISTRY_FINGERPRINT,
  OfficialSourceRegistrySchema,
  compareOfficialDocumentObservation,
  officialSourceCitation,
} from './officialSources'
import {
  TechnicalDatumSchema,
  TechnicalMovementFixtureSchema,
  deserializeTechnicalFixture,
  functionalRelationshipValues,
  serializeTechnicalFixture,
} from './reconstruction'
import { TechnicalRelationshipIndex } from './relationships'
import { createTechnicalVisualReport } from './visualReport'

describe('Sistema 4B · fuentes, reconstrucción y fixtures técnicos', () => {
  it('conserva un registro curado completo para 2035/8215 y contratos vacíos para futuros calibres', () => {
    expect(OfficialSourceRegistrySchema.parse(MIYOTA_OFFICIAL_SOURCE_REGISTRY))
      .toEqual(MIYOTA_OFFICIAL_SOURCE_REGISTRY)
    const curated = MIYOTA_OFFICIAL_SOURCE_REGISTRY.entries.filter(({ status }) => status === 'curated')
    expect(curated.map(({ calibre }) => calibre)).toEqual(['2035', '8215'])
    curated.forEach((entry) => {
      expect(entry.documents).toHaveLength(5)
      expect(new Set(entry.documents.map(({ documentType }) => documentType)).size).toBe(5)
      entry.documents.forEach((document) => {
        expect(new URL(document.url).hostname).toBe('miyotamovement.com')
        expect(document.localCopy).toEqual({ stored: false })
        expect(document.rights).toEqual({
          license: 'unknown',
          redistribution: 'requires-review',
          repositoryStorage: 'prohibited-until-reviewed',
          verificationCache: 'private-local-only',
        })
        expect(document.remoteIntegrity).toMatchObject({
          hashMode: document.documentType === 'product-page' ? 'html-csrf-normalized' : 'raw-response-body',
          mediaType: document.documentType === 'product-page' ? 'text/html' : 'application/pdf',
        })
      })
    })
    const planned = MIYOTA_OFFICIAL_SOURCE_REGISTRY.entries.filter(({ status }) => status === 'planned')
    expect(planned.map(({ calibre }) => calibre)).toEqual(['82S0', '8N24', '9015', '9039', '9100', '9120'])
    planned.forEach((entry) => {
      expect(entry.documents).toEqual([])
      expect(entry.facts).toEqual([])
    })
  })

  it('protege con una prueba dorada los datos oficiales curados', () => {
    expect(MIYOTA_OFFICIAL_SOURCE_REGISTRY_FINGERPRINT).toBe('fnv1a64:2xds5ay6xbfo7')
    expect(MIYOTA_OFFICIAL_SOURCE_REGISTRY.entries
      .filter(({ status }) => status === 'curated')
      .flatMap(({ documents }) => documents)
      .map(({ id, url, remoteIntegrity }) => ({
        id,
        url,
        mediaType: remoteIntegrity?.mediaType,
        sizeBytes: remoteIntegrity?.sizeBytes,
        sha256: remoteIntegrity?.sha256,
      }))).toEqual([
        {
          id: 'source.miyota.2035.product-page',
          url: 'https://miyotamovement.com/product/2035/',
          mediaType: 'text/html',
          sizeBytes: 48532,
          sha256: 'fe722a335daa118d55d5a8772a1a6976e4f4d89602db92afcabf9b8df6edac4a',
        },
        {
          id: 'source.miyota.2035.specification',
          url: 'https://miyotamovement.com/uploads/product/product_pgSIG6yWb0akqcUhDf.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 81827,
          sha256: 'f57a9cf11e8c93a20f7dd8b6dcb9315d404bab4ae014a90d3f80ec9839f7cf9e',
        },
        {
          id: 'source.miyota.2035.drawing',
          url: 'https://miyotamovement.com/uploads/product/product_4tdsbpNVQi1WcE5lUw.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 134421,
          sha256: '60fe3a52b4457bbb213a1989b8891e8d9420d4debbf6837a046873312d823cea',
        },
        {
          id: 'source.miyota.2035.instruction-manual',
          url: 'https://miyotamovement.com/uploads/product/product_cKAJDxu3CLoa18GHXO.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 42370,
          sha256: '646812b5d9977904ec74f0733e1155e65b1218f796d0bf80fcf05b6cfd2af2c3',
        },
        {
          id: 'source.miyota.2035.parts-list-exploded-view',
          url: 'https://miyotamovement.com/uploads/product/product_j6P3s1O5naNRxHZWMK.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 15799,
          sha256: '8b7705b787c041d2f2224e8e1502f5c5f01a69b1dbddac42db44de74d2a7c4f7',
        },
        {
          id: 'source.miyota.8215.product-page',
          url: 'https://miyotamovement.com/product/8215/',
          mediaType: 'text/html',
          sizeBytes: 53456,
          sha256: '42abce52fa872351b448151ca7b79c0905b41ad33b2a0f2a2edef781686423db',
        },
        {
          id: 'source.miyota.8215.specification',
          url: 'https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 100856,
          sha256: 'bcb22d8e921b06165e67ffbbecfbcc444b8a67ccb4319d598c14bda6216418dc',
        },
        {
          id: 'source.miyota.8215.drawing',
          url: 'https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 263227,
          sha256: '95db183473b7372aad4f80665c23cdff32d5f64fdfe63b1cc3828811ef132c54',
        },
        {
          id: 'source.miyota.8215.instruction-manual',
          url: 'https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 44260,
          sha256: '6286b8431619f825b6bfd2715be78891dd2cd7ba3dfbead3959d570b08e2afb9',
        },
        {
          id: 'source.miyota.8215.parts-list-exploded-view',
          url: 'https://miyotamovement.com/uploads/product/product_x2MOZCosd7iH59wu0K.pdf',
          mediaType: 'application/pdf',
          sizeBytes: 16640,
          sha256: 'ea5f619949fba80737c7d0db6dbef128d302ec23625ec77aca25d5ee63012e0d',
        },
      ])
  })

  it('bloquea cualquier cambio remoto hasta revisión humana y propaga la huella a la cita', () => {
    const specification = MIYOTA_OFFICIAL_SOURCE_REGISTRY.entries[0].documents
      .find(({ documentType }) => documentType === 'specification')!
    const baseline = specification.remoteIntegrity!
    const verified = compareOfficialDocumentObservation(specification, {
      hashMode: baseline.hashMode,
      verifiedAt: '2026-07-28T12:00:00.000Z',
      requestedUrl: specification.url,
      finalUrl: specification.url,
      mediaType: baseline.mediaType,
      sizeBytes: baseline.sizeBytes,
      sha256: baseline.sha256,
    })
    expect(verified).toEqual({ status: 'verified', differences: [], requiresReview: false })

    const drift = compareOfficialDocumentObservation(specification, {
      hashMode: baseline.hashMode,
      verifiedAt: '2026-07-28T12:00:00.000Z',
      requestedUrl: specification.url,
      finalUrl: specification.url,
      mediaType: baseline.mediaType,
      sizeBytes: baseline.sizeBytes + 1,
      sha256: '0'.repeat(64),
    })
    expect(drift).toMatchObject({ status: 'drift', requiresReview: true })
    expect(drift.differences).toHaveLength(2)
    expect(officialSourceCitation(specification.id, 'Dato nominal de prueba').resource.sha256)
      .toBe(baseline.sha256)
  })

  it('valida los cuatro fixtures y separa los modelos conceptuales de los calibres reales', () => {
    expect(TECHNICAL_MOVEMENT_FIXTURES).toHaveLength(4)
    TECHNICAL_MOVEMENT_FIXTURES.forEach((fixture) => {
      expect(TechnicalMovementFixtureSchema.parse(fixture)).toEqual(fixture)
      expect(fixture.assembly.schemaVersion).toBe(6)
      expect(fixture.assembly.instances.length).toBeGreaterThan(0)
    })
    expect(CONCEPTUAL_QUARTZ_FIXTURE.calibre).toBeUndefined()
    expect(CONCEPTUAL_MECHANICAL_FIXTURE.calibre).toBeUndefined()
    expect(CONCEPTUAL_MECHANICAL_FIXTURE.fidelity).toMatchObject({
      geometry: 'G1',
      kinematics: 'K2',
      physics: 'P0',
    })
    expect(CONCEPTUAL_MECHANICAL_FIXTURE.limitations.join(' ')).toContain('No se etiqueta')
    expect(MIYOTA_2035_TECHNICAL_FIXTURE.calibre).toBe('2035')
    expect(MIYOTA_8215_TECHNICAL_FIXTURE.calibre).toBe('8215')
  })

  it('mantiene un ensamblaje canónico único para cada calibre y vistas como estado reversible', async () => {
    for (const fixture of [MIYOTA_2035_TECHNICAL_FIXTURE, MIYOTA_8215_TECHNICAL_FIXTURE]) {
      const bridge = new TechnicalFixtureViewportBridge(fixture, () => '2026-07-23T00:00:00.000Z')
      const initial = await bridge.capturePresentation()
      const first = fixture.assembly.instances[0].id
      const second = fixture.assembly.instances[1].id
      await bridge.applyOverlay({
        ...structuredClone(EMPTY_LEARNING_OVERLAY),
        selectedEntityIds: [first],
        hiddenEntityIds: [second],
        isolatedEntityIds: [first],
        highlightedEntityIds: [first],
        transparency: { [second]: 0.25 },
        explode: 0.6,
        simulatedErrors: fixture.visualErrorScenarios.slice(0, 1).map(({ id }) => id),
      })
      expect(bridge.entitySupport([first, 'missing']).supportedEntityIds).toEqual([first])
      expect(bridge.entitySupport([first, 'missing']).unsupportedEntityIds).toEqual(['missing'])
      expect(bridge.currentOverlay()).toMatchObject({
        selectedEntityIds: [first],
        hiddenEntityIds: [second],
        isolatedEntityIds: [first],
        highlightedEntityIds: [first],
        explode: 0.6,
      })
      await bridge.restorePresentation(initial)
      await bridge.restorePresentation(initial)
      expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
    }
  })

  it('mantiene los errores visuales como simulaciones controladas y reversibles', () => {
    expect(MIYOTA_2035_TECHNICAL_FIXTURE.visualErrorScenarios.length).toBeGreaterThan(0)
    expect(MIYOTA_8215_TECHNICAL_FIXTURE.visualErrorScenarios.length).toBeGreaterThan(0)
    for (const scenario of [
      ...MIYOTA_2035_TECHNICAL_FIXTURE.visualErrorScenarios,
      ...MIYOTA_8215_TECHNICAL_FIXTURE.visualErrorScenarios,
    ]) {
      expect(scenario).toMatchObject({
        layer: 'educational-simulation',
        reversible: true,
        engineeringValidated: false,
      })
      expect(scenario.affectedInstanceIds.length).toBeGreaterThan(0)
      expect(scenario.limitations.length).toBeGreaterThan(0)
    }
  })

  it('no transforma estimaciones normalizadas en dimensiones oficiales ni inventa mediciones', () => {
    for (const fixture of TECHNICAL_MOVEMENT_FIXTURES) {
      fixture.geometry.forEach((primitive) => {
        if (primitive.coordinateSpace === 'normalized-educational') {
          expect(primitive.layer).not.toBe('official-nominal')
        }
      })
      fixture.ledger.forEach((record) => {
        expect(record.sourceIds.length).toBeGreaterThan(0)
        record.officialDimensions.forEach((datum) => {
          expect(datum.layer).toBe('official-nominal')
          expect(datum.sourceIds.length).toBeGreaterThan(0)
          expect(datum.unit).not.toBe('normalized')
        })
        expect(record.measuredDimensions).toEqual([])
        record.estimatedDimensions.forEach((datum) => {
          expect(datum.layer).toBe('visual-reconstruction-estimate')
        })
      })
    }
    expect(TechnicalDatumSchema.safeParse({
      id: 'datum.invalid.normalized-official',
      label: 'Inválido',
      kind: 'dimension',
      value: 1,
      unit: 'normalized',
      layer: 'official-nominal',
      sourceIds: ['source.miyota.2035.specification'],
      method: 'No permitido.',
      limitations: [],
    }).success).toBe(false)
  })

  it('resuelve todos los selectores con cardinalidad comprobable', () => {
    for (const fixture of TECHNICAL_MOVEMENT_FIXTURES) {
      const resolver = new SemanticSelectorResolver(new ProjectEntityIndex(fixture.assembly))
      const ids = fixture.selectors.map(({ id }) => id)
      expect(new Set(ids).size).toBe(ids.length)
      fixture.selectors.forEach((contract) => {
        const resolution = resolver.resolve(contract.selector, contract.cardinality)
        expect(resolution.cardinalitySatisfied, `${fixture.id}:${contract.id}`).toBe(true)
      })
    }
    expect(compileFirstModuleTechnicalFixture()).toMatchObject({ success: true })
  })

  it('expone las quince relaciones funcionales y permite consultarlas', () => {
    const implemented = new Set(TECHNICAL_MOVEMENT_FIXTURES.flatMap(({ relations }) => relations.map(({ type }) => type)))
    functionalRelationshipValues.forEach((type) => expect(implemented.has(type), type).toBe(true))
    const index = new TechnicalRelationshipIndex(MIYOTA_8215_TECHNICAL_FIXTURE)
    expect(index.list({ type: 'meshes-with' }).length).toBeGreaterThan(0)
    expect(index.list({ type: 'remove-before' }).length).toBeGreaterThan(0)
    expect(index.list({ subsystem: 'calendar' }).length).toBeGreaterThan(0)
  })

  it('serializa sin pérdida y no muta un WatchProject existente', () => {
    const serialized = serializeTechnicalFixture(MIYOTA_8215_TECHNICAL_FIXTURE)
    expect(deserializeTechnicalFixture(serialized)).toEqual(MIYOTA_8215_TECHNICAL_FIXTURE)

    const project = createQuartzProject('miyota_2035')
    const before = structuredClone(project)
    compileFirstModuleTechnicalFixture()
    createTechnicalVisualReport(TECHNICAL_MOVEMENT_FIXTURES.map((fixture) => structuredClone(fixture)), '2026-07-23T00:00:00.000Z')
    expect(project).toEqual(before)
  })

  it('mantiene el contrato técnico abierto a otros fabricantes', () => {
    const multiBrandFixture = structuredClone(CONCEPTUAL_MECHANICAL_FIXTURE)
    multiBrandFixture.id = 'fixture.test.multibrand-mechanical'
    multiBrandFixture.kind = 'official-calibre-mechanical'
    multiBrandFixture.manufacturer = 'Fabricante de prueba'
    multiBrandFixture.calibre = 'X1'
    multiBrandFixture.family = 'Familia X'
    multiBrandFixture.variant = 'X1'
    multiBrandFixture.assembly.movementReferences[0].manufacturer = 'Fabricante de prueba'
    multiBrandFixture.assembly.movementReferences[0].calibre = 'X1'
    multiBrandFixture.assembly.movementReferences[0].classification = 'known'
    expect(TechnicalMovementFixtureSchema.safeParse(multiBrandFixture).success).toBe(true)
  })

  it('declara reduced motion y confirma que Sistema 4C cerró los bloqueos visuales', () => {
    expect(FIRST_MODULE_TECHNICAL_FIXTURE.reducedMotion).toEqual({
      discreteStates: true,
      staticNumberedArrows: true,
      automaticCameraMotion: false,
      stepwiseScrubbing: true,
    })
    const compiled = compileFirstModuleTechnicalFixture()
    expect(compiled.success).toBe(true)
    expect(compiled.viewportBlockers).toEqual([])
    expect(FIRST_MODULE_TECHNICAL_FIXTURE.viewportNeeds.every(({ status }) => status === 'available')).toBe(true)
    const report = createTechnicalVisualReport(undefined, '2026-07-23T00:00:00.000Z')
    expect(report.moduleFixtureCompiled).toBe(true)
    expect(report.fixtures).toHaveLength(4)
    expect(report.fixtures.find(({ fixtureId }) => fixtureId === MIYOTA_8215_TECHNICAL_FIXTURE.id))
      .toMatchObject({ reconstructionLevel: 'R2', measuredDataCount: 0 })
  })
})
