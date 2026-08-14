import type { AcademyReaderEvent } from './academyReaderModel'

export interface AcademyReaderEventSummary {
  eventType: AcademyReaderEvent['eventType']
  count: number
  completedCount: number
  lessonCount: number
}

export function summarizeAcademyReaderEvents(events: readonly AcademyReaderEvent[]): AcademyReaderEventSummary[] {
  const byType = new Map<AcademyReaderEvent['eventType'], AcademyReaderEvent[]>()
  for (const event of events) byType.set(event.eventType, [...(byType.get(event.eventType) ?? []), event])
  return [...byType.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([eventType, items]) => ({
    eventType,
    count: items.length,
    completedCount: items.filter(({ completed }) => completed === true).length,
    lessonCount: new Set(items.flatMap(({ lessonId }) => lessonId ? [lessonId] : [])).size,
  }))
}

export function academyReaderEventsCsv(events: readonly AcademyReaderEvent[]): string {
  return ['eventType,count,completedCount,lessonCount', ...summarizeAcademyReaderEvents(events)
    .map(({ eventType, count, completedCount, lessonCount }) => `${eventType},${count},${completedCount},${lessonCount}`)].join('\n')
}
