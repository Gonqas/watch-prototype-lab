import { createDefaultDesign } from './catalog'
import type { WatchDesign } from '../types'

type PlainRecord = Record<string, unknown>

const isRecord = (value: unknown): value is PlainRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const mergeDefined = <T,>(fallback: T, incoming: unknown): T => {
  if (Array.isArray(fallback)) {
    return (Array.isArray(incoming) ? incoming : fallback) as T
  }

  if (isRecord(fallback)) {
    const incomingRecord = isRecord(incoming) ? incoming : {}
    const merged = Object.entries(fallback).reduce<PlainRecord>((acc, [key, value]) => {
      acc[key] = mergeDefined(value, incomingRecord[key])
      return acc
    }, {})

    Object.entries(incomingRecord).forEach(([key, value]) => {
      if (!(key in merged)) merged[key] = value
    })

    return merged as T
  }

  return (incoming === undefined || incoming === null ? fallback : incoming) as T
}

export const normalizeDesign = (incoming: unknown): WatchDesign => {
  const fallback = createDefaultDesign()
  const merged = mergeDefined(fallback, incoming)

  return {
    ...merged,
    schemaVersion: 1,
    updatedAt: merged.updatedAt || new Date().toISOString(),
  }
}
