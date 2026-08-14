export function academyModuleEntryHref(moduleId: string, lessonIds: readonly string[]): string {
  return lessonIds.length === 1
    ? `#/learning/lesson/${encodeURIComponent(lessonIds[0])}`
    : `#/learning/module/${encodeURIComponent(moduleId)}`
}

export function academyChapterHref(chapterId: string): string {
  return `#/learning/my-learning?chapter=${encodeURIComponent(chapterId)}`
}
