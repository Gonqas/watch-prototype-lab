import type { LearningProfile } from './models'
import type { LearningRepository } from './repository'

export class LearningProfileService {
  private readonly repository: LearningRepository
  private readonly now: () => string

  constructor(repository: LearningRepository, now: () => string = () => new Date().toISOString()) {
    this.repository = repository
    this.now = now
  }

  async ensureDefaultProfile(locale = 'es-ES'): Promise<LearningProfile> {
    const existing = await this.repository.getProfile('profile.local-default')
    if (existing) return existing
    return this.createProfile('Perfil local', locale, 'profile.local-default')
  }

  async createProfile(displayName: string, locale = 'es-ES', profileId: string = crypto.randomUUID()): Promise<LearningProfile> {
    const timestamp = this.now()
    const profile: LearningProfile = {
      schemaVersion: 1,
      id: profileId,
      displayName,
      locale,
      accessibility: {
        reducedMotion: false,
        textScale: 1,
        contrast: 'system',
        interactionMode: 'adaptive',
        extendedTime: false,
        readLabels: false,
        adaptations: [],
      },
      educationalPreferences: {},
      createdAt: timestamp,
      modifiedAt: timestamp,
      archived: false,
      recordVersion: 1,
    }
    await this.repository.putProfile(profile)
    return structuredClone(profile)
  }

  async update(profileId: string, changes: Partial<Pick<LearningProfile, 'displayName' | 'locale' | 'accessibility' | 'educationalPreferences'>>): Promise<LearningProfile> {
    const current = await this.required(profileId)
    const updated: LearningProfile = {
      ...current,
      ...structuredClone(changes),
      id: current.id,
      schemaVersion: 1,
      createdAt: current.createdAt,
      modifiedAt: this.now(),
      recordVersion: current.recordVersion + 1,
    }
    await this.repository.putProfile(updated)
    return updated
  }

  async archive(profileId: string, archived = true): Promise<LearningProfile> {
    const current = await this.required(profileId)
    const updated = { ...current, archived, modifiedAt: this.now(), recordVersion: current.recordVersion + 1 }
    await this.repository.putProfile(updated)
    return updated
  }

  async softDelete(profileId: string): Promise<LearningProfile> {
    const current = await this.required(profileId)
    const updated = {
      ...current,
      deletedAt: this.now(),
      modifiedAt: this.now(),
      recordVersion: current.recordVersion + 1,
    }
    await this.repository.putProfile(updated)
    return updated
  }

  private async required(profileId: string): Promise<LearningProfile> {
    const profile = await this.repository.getProfile(profileId)
    if (!profile) throw new Error(`Perfil inexistente: ${profileId}.`)
    return profile
  }
}
