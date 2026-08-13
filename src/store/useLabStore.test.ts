import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultDesign } from '../data/catalog'
import { useLabStore } from './useLabStore'

describe('useLabStore live editing', () => {
  beforeEach(() => {
    useLabStore.setState({
      design: createDefaultDesign(),
      undoStack: [],
      redoStack: [],
      liveEditActive: false,
      activeTool: 'depth',
      snapEnabled: true,
      snapStep: 0.05,
      selectedPart: 'dial',
      activeTab: 'dial',
      workbenchMode: 'dial_lab',
      focusMode: 'workshop',
      lastOpportunityScan: [],
    })
  })

  it('groups a direct 3D drag into one undo checkpoint', () => {
    const initialDepth = useLabStore.getState().design.dial.sunkenDepth

    useLabStore.getState().beginLiveEdit()
    useLabStore.getState().patchDialLive({ sunkenCenter: true, sunkenDepth: 0.25 })
    useLabStore.getState().patchDialLive({ sunkenCenter: true, sunkenDepth: 0.8 })
    useLabStore.getState().endLiveEdit()

    expect(useLabStore.getState().undoStack).toHaveLength(1)
    expect(useLabStore.getState().design.dial.sunkenDepth).toBe(0.8)

    useLabStore.getState().undo()

    expect(useLabStore.getState().design.dial.sunkenDepth).toBe(initialDepth)
    expect(useLabStore.getState().redoStack).toHaveLength(1)
  })

  it('selects a new relief in workshop mode for immediate editing', () => {
    useLabStore.getState().addRelief('circle')

    const state = useLabStore.getState()

    expect(state.selectedPart.startsWith('relief:')).toBe(true)
    expect(state.focusMode).toBe('workshop')
    expect(state.activeTool).toBe('move')
    expect(state.design.viewMode).toBe('section')
    expect(state.activeTab).toBe('dial')
  })

  it('normalizes active tools and stores snap preferences', () => {
    useLabStore.getState().setSelectedPart('minuteHand')
    useLabStore.getState().setActiveTool('depth')

    expect(useLabStore.getState().activeTool).toBe('size')

    useLabStore.getState().setSnapStep(0.1)
    useLabStore.getState().setSnapEnabled(false)

    expect(useLabStore.getState().snapStep).toBe(0.1)
    expect(useLabStore.getState().snapEnabled).toBe(false)
  })

  it('applies a variant as an undoable workshop decision', () => {
    useLabStore.getState().applyVariant('two_hand')

    const state = useLabStore.getState()

    expect(state.design.hands.count).toBe(2)
    expect(state.selectedPart).toBe('minuteHand')
    expect(state.focusMode).toBe('workshop')
    expect(state.undoStack).toHaveLength(1)
  })

  it('opens Dial Lab ready to edit the dial directly', () => {
    useLabStore.getState().setWorkbenchMode('dial_lab')

    const state = useLabStore.getState()

    expect(state.selectedPart).toBe('dial')
    expect(state.activeTool).toBe('depth')
    expect(state.focusMode).toBe('workshop')
    expect(state.design.viewMode).toBe('section')
  })

  it('does not trap focus controls inside the risk heatmap view', () => {
    useLabStore.getState().setWorkbenchMode('risk_lab')

    expect(useLabStore.getState().design.viewMode).toBe('heatmap')

    useLabStore.getState().setFocusMode('isolate')

    expect(useLabStore.getState().focusMode).toBe('isolate')
    expect(useLabStore.getState().design.viewMode).toBe('section')

    useLabStore.getState().setFocusMode('assembly')

    expect(useLabStore.getState().focusMode).toBe('assembly')
    expect(useLabStore.getState().design.viewMode).toBe('free')
  })
})
