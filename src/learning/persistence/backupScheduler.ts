import type { LearningBackupRecord } from './models'

export interface ScheduledBackupOperations {
  create(kind: LearningBackupRecord['kind'], protectedBackup?: boolean): Promise<LearningBackupRecord>
  list(): Promise<LearningBackupRecord[]>
  remove(id: string): Promise<void>
}

export class LearningBackupScheduler {
  private readonly operations: ScheduledBackupOperations
  private readonly now: () => string

  constructor(
    operations: ScheduledBackupOperations,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.operations = operations
    this.now = now
  }

  async runStartup(): Promise<{ created: string[]; removed: string[] }> {
    const current = this.now()
    const records = await this.operations.list()
    const created: string[] = []
    if (!records.some(({ kind, createdAt }) =>
      kind === 'scheduled-daily' && createdAt.slice(0, 10) === current.slice(0, 10))) {
      created.push((await this.operations.create('scheduled-daily')).id)
    }
    if (!records.some(({ kind, createdAt }) =>
      kind === 'scheduled-weekly' && isoWeek(createdAt) === isoWeek(current))) {
      created.push((await this.operations.create('scheduled-weekly')).id)
    }
    const all = await this.operations.list()
    const keep = new Set([
      ...newestBuckets(all.filter(({ kind }) => kind === 'scheduled-daily'), (record) => record.createdAt.slice(0, 10), 7),
      ...newestBuckets(all.filter(({ kind }) => kind === 'scheduled-weekly'), (record) => isoWeek(record.createdAt), 4),
    ].map(({ id }) => id))
    const removed: string[] = []
    for (const record of all) {
      if (record.protected || !['scheduled-daily', 'scheduled-weekly'].includes(record.kind) || keep.has(record.id)) continue
      await this.operations.remove(record.id)
      removed.push(record.id)
    }
    return { created, removed }
  }
}

function newestBuckets(
  records: LearningBackupRecord[],
  bucket: (record: LearningBackupRecord) => string,
  limit: number,
): LearningBackupRecord[] {
  const seen = new Set<string>()
  return [...records]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .filter((record) => {
      const key = bucket(record)
      if (seen.has(key) || seen.size >= limit) return false
      seen.add(key)
      return true
    })
}

function isoWeek(value: string): string {
  const date = new Date(value)
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`
}

