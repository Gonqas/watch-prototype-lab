import type { EngineeringCalculationRun } from './model'

export interface EngineeringNotebook {
  schemaVersion: 1
  projectId: string
  updatedAt: string
  runs: EngineeringCalculationRun[]
}

export const ENGINEERING_NOTEBOOK_PREFIX = 'wplab.engineering-notebook.v1'

function storageKey(projectId: string): string {
  return `${ENGINEERING_NOTEBOOK_PREFIX}:${projectId}`
}

function emptyNotebook(projectId: string): EngineeringNotebook {
  return { schemaVersion: 1, projectId, updatedAt: new Date(0).toISOString(), runs: [] }
}

export function readEngineeringNotebook(
  projectId: string,
  storage: Pick<Storage, 'getItem'> = localStorage,
): EngineeringNotebook {
  const raw = storage.getItem(storageKey(projectId))
  if (!raw) return emptyNotebook(projectId)
  try {
    const parsed = JSON.parse(raw) as Partial<EngineeringNotebook>
    if (
      parsed.schemaVersion !== 1
      || parsed.projectId !== projectId
      || !Array.isArray(parsed.runs)
      || typeof parsed.updatedAt !== 'string'
    ) return emptyNotebook(projectId)
    return parsed as EngineeringNotebook
  } catch {
    return emptyNotebook(projectId)
  }
}

export function writeEngineeringNotebook(
  notebook: EngineeringNotebook,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(storageKey(notebook.projectId), JSON.stringify(notebook))
}

export function saveEngineeringRun(
  projectId: string,
  run: EngineeringCalculationRun,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): EngineeringNotebook {
  const current = readEngineeringNotebook(projectId, storage)
  const runs = [run, ...current.runs.filter(({ id }) => id !== run.id)].slice(0, 250)
  const next: EngineeringNotebook = {
    ...current,
    updatedAt: new Date().toISOString(),
    runs,
  }
  writeEngineeringNotebook(next, storage)
  return next
}

export function removeEngineeringRun(
  projectId: string,
  runId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): EngineeringNotebook {
  const current = readEngineeringNotebook(projectId, storage)
  const next: EngineeringNotebook = {
    ...current,
    updatedAt: new Date().toISOString(),
    runs: current.runs.filter(({ id }) => id !== runId),
  }
  writeEngineeringNotebook(next, storage)
  return next
}

