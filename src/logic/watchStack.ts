import { MOVEMENTS } from '../data/catalog'
import type { DataQuality, SelectablePart, WatchDesign } from '../types'

export interface StackReferencePlane {
  id: string
  label: string
  z: number
  part: SelectablePart
  dataQuality: DataQuality
}

export interface StackInterval {
  id: string
  label: string
  from: number
  to: number
  part: SelectablePart
  dataQuality: DataQuality
}

export interface WatchStack {
  movementBottom: number
  movementTop: number
  dialBottom: number
  baseDialTop: number
  outerDialSurface: number
  centerDialSurface: number
  crystalInnerTop: number
  handReferenceSurface: number
  planes: StackReferencePlane[]
  intervals: StackInterval[]
  assumptions: string[]
}

const mm = (value: number) => Number(value.toFixed(3))

const plane = (
  id: string,
  label: string,
  z: number,
  part: SelectablePart,
  dataQuality: DataQuality,
): StackReferencePlane => ({
  id,
  label,
  z: mm(z),
  part,
  dataQuality,
})

const interval = (
  id: string,
  label: string,
  from: number,
  to: number,
  part: SelectablePart,
  dataQuality: DataQuality,
): StackInterval => ({
  id,
  label,
  from: mm(from),
  to: mm(to),
  part,
  dataQuality,
})

export const calculateWatchStack = (design: WatchDesign): WatchStack => {
  const movement = MOVEMENTS[design.movementId]
  const movementBottom = design.case.backThickness + design.case.holderHeight
  const movementTop = movementBottom + movement.height
  const dialBottom = movementTop + 0.05
  const baseDialTop = dialBottom + design.dial.thickness
  const outerDialSurface = baseDialTop + design.dial.outerRingHeight
  const centerDialSurface = design.dial.sunkenCenter ? baseDialTop - design.dial.sunkenDepth : baseDialTop
  const crystalInnerTop = Math.min(
    design.case.backThickness + design.crystal.usableInteriorHeight,
    design.case.totalHeight - design.crystal.thickness,
  )
  const handReferenceSurface = baseDialTop
  const planes: StackReferencePlane[] = [
    plane('case-back-datum', 'Datum fondo de caja', 0, 'case', design.case.dataQuality),
    plane('movement-seat', 'Asiento movimiento/holder', movementBottom, 'movement', design.case.dataQuality),
    plane('movement-top', 'Cara superior movimiento', movementTop, 'movement', movement.dataQuality),
    plane('dial-seat', 'Asiento inferior dial', dialBottom, 'dial', design.dial.dataQuality),
    plane('dial-base-top', 'Cara superior dial base', baseDialTop, 'dial', design.dial.dataQuality),
    plane('outer-dial-surface', 'Superficie anillo exterior', outerDialSurface, 'dial', design.dial.dataQuality),
    plane('center-dial-surface', 'Superficie centro dial', centerDialSurface, 'dial', design.dial.dataQuality),
    plane('hand-reference', 'Plano referencia agujas', handReferenceSurface, 'minuteHand', design.hands.dataQuality),
    plane('crystal-inner', 'Cara interior cristal', crystalInnerTop, 'crystal', design.crystal.dataQuality),
    plane('case-top', 'Altura total caja', design.case.totalHeight, 'case', design.case.dataQuality),
  ]
  const intervals: StackInterval[] = [
    interval('case-back', 'Fondo', 0, design.case.backThickness, 'case', design.case.dataQuality),
    interval('holder', 'Holder/junta', design.case.backThickness, movementBottom, 'case', design.case.dataQuality),
    interval('movement', movement.calibre, movementBottom, movementTop, 'movement', movement.dataQuality),
    interval('dial-base', 'Dial base', dialBottom, baseDialTop, 'dial', design.dial.dataQuality),
    interval(
      'dial-profile',
      design.dial.sunkenCenter ? 'Centro hundido/anillo' : 'Superficie dial',
      Math.min(centerDialSurface, outerDialSurface),
      Math.max(centerDialSurface, outerDialSurface),
      'dial',
      design.dial.dataQuality,
    ),
    interval('air-under-crystal', 'Aire bajo cristal', outerDialSurface, crystalInnerTop, 'crystal', design.crystal.dataQuality),
    interval('crystal', 'Cristal', Math.max(crystalInnerTop, design.case.totalHeight - design.crystal.thickness), design.case.totalHeight, 'crystal', design.crystal.dataQuality),
  ]
  const assumptions = [
    'Dial situado 0,05 mm sobre cara superior de movimiento hasta medir asiento real.',
    'Plano de referencia de agujas tomado sobre cara superior del dial base; el dial no eleva automaticamente las agujas.',
    'Cara interior del cristal usa el mínimo entre altura interior útil y altura total menos grosor de cristal.',
  ]

  return {
    movementBottom,
    movementTop,
    dialBottom,
    baseDialTop,
    outerDialSurface,
    centerDialSurface,
    crystalInnerTop,
    handReferenceSurface,
    planes,
    intervals,
    assumptions,
  }
}
