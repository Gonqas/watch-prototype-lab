import { createContext, useContext } from 'react'
import type {
  LearningApplicationService,
  LearningApplicationSnapshot,
} from '../application/service'

export interface LearningContextValue {
  service: LearningApplicationService
  snapshot: LearningApplicationSnapshot
}

export const LearningContext = createContext<LearningContextValue | null>(null)

export function useLearning(): LearningContextValue {
  const value = useContext(LearningContext)
  if (!value) throw new Error('LearningContext no está disponible.')
  return value
}
