import { describe, expect, it } from 'vitest'
import { MIYOTA_2035_TECHNICAL_FIXTURE } from '../technical/fixtures'
import { createV5ProjectFixture } from '../fixtures/canonicalFixtures'
import { restoreVirtualWorkbench, VirtualWorkbench } from './workbench'

function deterministicWorkbench(mode: 'guided' | 'assisted' | 'free' = 'guided') {
  return new VirtualWorkbench(MIYOTA_2035_TECHNICAL_FIXTURE, mode, () => '2026-07-27T10:00:00.000Z')
}

function partByReference(workbench: VirtualWorkbench, reference: string, occurrence = 0) {
  const part = workbench.parts().filter(({ officialReference }) => officialReference === reference)[occurrence]
  if (!part) throw new Error(`Referencia ausente: ${reference}`)
  return part
}

describe('Sistema 4D · banco virtual MIYOTA 2035', () => {
  it('crea zonas, herramientas, bandejas, alternativa de teclado y 33 identidades', () => {
    const workbench = deterministicWorkbench()
    expect(workbench.zones).toHaveLength(5)
    expect(workbench.tools).toHaveLength(9)
    expect(workbench.trayZones()).toHaveLength(8)
    expect(workbench.parts()).toHaveLength(33)
    expect(new Set(workbench.parts().map(({ instanceId }) => instanceId)).size).toBe(33)
    expect(workbench.accessibilityModel().actionMenu.every(({ requiresDrag }) => !requiresDrag)).toBe(true)
    expect(workbench.accessibilityModel().reducedMotion.sameEvaluation).toBe(true)
  })

  it('conserva identidad individual de tornillos con la misma referencia', () => {
    const workbench = deterministicWorkbench()
    const repeated = workbench.parts().filter(({ officialReference }) => officialReference === '922-183')
    expect(repeated).toHaveLength(2)
    expect(repeated[0].instanceId).not.toBe(repeated[1].instanceId)
    expect(repeated[0].accessibleLabel).not.toBe(repeated[1].accessibleLabel)
  })

  it('rechaza herramienta incorrecta, ausencia de aislamiento y dependencias', async () => {
    const workbench = deterministicWorkbench('assisted')
    const screw = partByReference(workbench, '922-154', 1)
    const bridge = partByReference(workbench, '701-K14')
    await workbench.dispatch({ id: 'prepare', type: 'prepare-workbench' })
    const wrongTool = await workbench.dispatch({
      id: 'loosen-wrong',
      type: 'loosen-fastener',
      instanceId: screw.instanceId,
      toolId: 'tool.tweezers',
      fitConfirmed: true,
    })
    expect(wrongTool.accepted).toBe(false)
    expect(wrongTool.diagnostics[0].code).toBe('WB-WRONG-TOOL')
    const noEnergy = await workbench.dispatch({
      id: 'remove-bridge',
      type: 'remove-part',
      instanceId: bridge.instanceId,
      toolId: 'tool.tweezers',
    })
    expect(noEnergy.diagnostics[0].code).toBe('WB-ENERGY-NOT-ISOLATED')
    await workbench.dispatch({ id: 'energy', type: 'isolate-energy' })
    const dependency = await workbench.dispatch({
      id: 'remove-bridge-2',
      type: 'remove-part',
      instanceId: bridge.instanceId,
      toolId: 'tool.tweezers',
    })
    expect(dependency.diagnostics.map(({ code }) => code)).toContain('WB-DISASSEMBLY-DEPENDENCY')
  })

  it('desmonta un tornillo, lo coloca en bandeja, guarda y recupera sin perder eventos', async () => {
    const workbench = deterministicWorkbench('free')
    const screw = partByReference(workbench, '934-440')
    await workbench.dispatch({ id: 'prepare', type: 'prepare-workbench' })
    await workbench.dispatch({ id: 'energy', type: 'isolate-energy' })
    const loosened = await workbench.dispatch({
      id: 'loosen',
      type: 'loosen-fastener',
      instanceId: screw.instanceId,
      toolId: 'tool.screwdriver',
      fitConfirmed: true,
    })
    expect(loosened.accepted).toBe(true)
    const removed = await workbench.dispatch({
      id: 'remove',
      type: 'remove-part',
      instanceId: screw.instanceId,
      toolId: 'tool.screwdriver',
    })
    expect(removed.accepted).toBe(true)
    const placed = await workbench.dispatch({
      id: 'tray',
      type: 'place-in-tray',
      instanceId: screw.instanceId,
      toolId: 'tool.tweezers',
      trayZoneId: 'tray.zone.2',
      note: 'Puente de tren · posición posterior',
    })
    expect(placed.accepted).toBe(true)
    const eventCount = workbench.events().length
    const recovered = restoreVirtualWorkbench(MIYOTA_2035_TECHNICAL_FIXTURE, workbench.serialize(), () => '2026-07-27T10:00:00.000Z')
    expect(recovered.part(screw.instanceId)?.state).toBe('placed-in-tray')
    expect(recovered.part(screw.instanceId)?.trayZoneId).toBe('tray.zone.2')
    expect(recovered.events()).toHaveLength(eventCount)
  })

  it('restaura un snapshot y mantiene inmutables fixture y WatchProject', async () => {
    const fixtureBefore = JSON.stringify(MIYOTA_2035_TECHNICAL_FIXTURE)
    const project = createV5ProjectFixture()
    const projectBefore = JSON.stringify(project)
    const workbench = deterministicWorkbench()
    const snapshot = workbench.snapshot()
    await workbench.dispatch({ id: 'prepare', type: 'prepare-workbench' })
    await workbench.dispatch({ id: 'energy', type: 'isolate-energy' })
    await workbench.dispatch({ id: 'restore', type: 'restore-snapshot', snapshot })
    expect(workbench.prepared()).toBe(false)
    expect(JSON.stringify(MIYOTA_2035_TECHNICAL_FIXTURE)).toBe(fixtureBefore)
    expect(JSON.stringify(project)).toBe(projectBefore)
  })

  it('separa grafos y no presenta ciclos de dependencias', () => {
    const workbench = deterministicWorkbench()
    expect(workbench.disassembly.dependencies().every(({ phase }) => phase === 'disassembly')).toBe(true)
    expect(workbench.assembly.dependencies().every(({ phase }) => phase === 'assembly')).toBe(true)
    expect(workbench.disassembly.diagnoseCycles()).toEqual([])
    expect(workbench.assembly.diagnoseCycles()).toEqual([])
  })

  it('bloquea un puente sin soporte presente y permite reinstalar el tornillo correcto', async () => {
    const workbench = deterministicWorkbench('guided')
    const bridge = partByReference(workbench, '701-K14')
    const thirdWheel = partByReference(workbench, '017-A14')
    const snapshot = workbench.snapshot()
    snapshot.prepared = true
    snapshot.energyIsolated = true
    snapshot.parts.find(({ instanceId }) => instanceId === bridge.instanceId)!.state = 'aligned'
    snapshot.parts.find(({ instanceId }) => instanceId === thirdWheel.instanceId)!.state = 'placed-in-tray'
    workbench.restore(snapshot)
    const blocked = await workbench.dispatch({
      id: 'install-bridge-without-third',
      type: 'install-part',
      instanceId: bridge.instanceId,
      toolId: 'tool.tweezers',
    })
    expect(blocked.accepted).toBe(false)
    expect(blocked.diagnostics[0].code).toBe('WB-ASSEMBLY-DEPENDENCY')

    const screw = partByReference(workbench, '934-440')
    const ready = workbench.snapshot()
    ready.parts.find(({ instanceId }) => instanceId === bridge.instanceId)!.state = 'installed'
    ready.parts.find(({ instanceId }) => instanceId === screw.instanceId)!.state = 'aligned'
    workbench.restore(ready)
    const installed = await workbench.dispatch({
      id: 'install-correct-screw',
      type: 'tighten-fastener',
      instanceId: screw.instanceId,
      toolId: 'tool.screwdriver',
      fitConfirmed: true,
    })
    expect(installed.accepted).toBe(true)
    expect(workbench.part(screw.instanceId)?.state).toBe('installed-unverified')
    expect((await workbench.dispatch({ id: 'verify-screw', type: 'verify-part', instanceId: screw.instanceId })).accepted).toBe(true)
  })

  it('cancela una operación sin mutar piezas y conserva el evento', async () => {
    const workbench = deterministicWorkbench()
    const before = workbench.parts()
    const cancelled = await workbench.dispatch({ id: 'cancel', type: 'cancel-operation', reason: 'Usuario cancela' })
    expect(cancelled.accepted).toBe(true)
    expect(cancelled.event.type).toBe('operation-cancelled')
    expect(workbench.parts()).toEqual(before)
  })

  it('admite guiado, asistido y libre sobre el mismo fixture', () => {
    const fixtureIds = (['guided', 'assisted', 'free'] as const)
      .map((mode) => deterministicWorkbench(mode).fixtureId)
    expect(new Set(fixtureIds)).toEqual(new Set(['fixture.miyota.2035.structural']))
  })
})
