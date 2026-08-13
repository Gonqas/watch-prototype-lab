import type { EducationalVisualPrimitive, Vec3 } from '../visual/model'

export function mechanismPrimitiveRotation(primitive: EducationalVisualPrimitive): Vec3 | undefined {
  if (
    primitive.shape === 'wheel'
    || primitive.visualProfile === 'barrel-cover'
    || primitive.visualProfile === 'pallet-fork'
    || primitive.shape === 'ring'
    || primitive.shape === 'coil'
  ) {
    return [Math.PI / 2, 0, 0]
  }
  return undefined
}
