import { invokeLearningNative } from '../../platform/native'
import { LearningBackupRecordSchema, type LearningBackupRecord } from './models'

interface NativeBackupGateway {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>
}

export class NativeLearningBackupManager {
  private readonly gateway: NativeBackupGateway

  constructor(gateway: NativeBackupGateway = { invoke: invokeLearningNative }) {
    this.gateway = gateway
  }

  async create(
    kind: LearningBackupRecord['kind'],
    protectedBackup = false,
  ): Promise<LearningBackupRecord> {
    const value = await this.gateway.invoke<unknown>('learning_create_backup_native', {
      kind,
      protected: protectedBackup,
    })
    return LearningBackupRecordSchema.parse(value)
  }

  async list(): Promise<LearningBackupRecord[]> {
    const values = await this.gateway.invoke<unknown[]>('learning_list_backups_native')
    return values.map((value) => LearningBackupRecordSchema.parse(value))
  }

  async restore(id: string): Promise<LearningBackupRecord> {
    const safetyBackup = await this.gateway.invoke<unknown>('learning_restore_backup_native', { id })
    return LearningBackupRecordSchema.parse(safetyBackup)
  }

  async remove(id: string): Promise<void> {
    await this.gateway.invoke<void>('learning_delete_backup_native', { id })
  }
}

