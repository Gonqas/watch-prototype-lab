import type { LearningProfile } from './models'
import type { LearningRepository } from './repository'
import {
  profileMutationCoordinatorFor,
  type ProfileMutation,
  type ProfileMutationCoordinator,
  type ProfileMutationDiagnostic,
  type ProfileMutationKind,
} from './profileMutationCoordinator'

export class LearningProfileService {
  private readonly repository: LearningRepository
  private readonly now: () => string
  private readonly mutations: ProfileMutationCoordinator

  constructor(
    repository: LearningRepository,
    now: () => string = () => new Date().toISOString(),
    mutations: ProfileMutationCoordinator = profileMutationCoordinatorFor(repository),
  ) {
    this.repository = repository
    this.now = now
    this.mutations = mutations
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
    return this.mutateProfile(profileId, (current) => ({
      ...current,
      ...structuredClone(changes),
      ...(changes.accessibility
        ? { accessibility: { ...current.accessibility, ...structuredClone(changes.accessibility) } }
        : {}),
      ...(changes.educationalPreferences
        ? { educationalPreferences: { ...current.educationalPreferences, ...structuredClone(changes.educationalPreferences) } }
        : {}),
    }), changes.educationalPreferences ? 'educational-preferences' : changes.accessibility ? 'accessibility' : 'profile-update')
  }

  mutateProfile(profileId: string, mutation: ProfileMutation, kind: ProfileMutationKind = 'profile-update'): Promise<LearningProfile> {
    return this.mutations.enqueue(profileId, kind, mutation)
  }

  updateEducationalPreferences(
    profileId: string,
    mutation: (current: Readonly<LearningProfile['educationalPreferences']>) => LearningProfile['educationalPreferences'],
    kind: ProfileMutationKind = 'educational-preferences',
  ): Promise<LearningProfile> {
    return this.mutateProfile(profileId, (current) => ({
      ...current,
      educationalPreferences: structuredClone(mutation(structuredClone(current.educationalPreferences))),
    }), kind)
  }

  async archive(profileId: string, archived = true): Promise<LearningProfile> {
    return this.mutateProfile(profileId, (current) => ({ ...current, archived }), 'profile-archive')
  }

  async softDelete(profileId: string): Promise<LearningProfile> {
    return this.mutateProfile(profileId, (current) => ({ ...current, deletedAt: this.now() }), 'profile-delete')
  }

  flush(profileId: string): Promise<void> {
    return this.mutations.flush(profileId)
  }

  flushAll(): Promise<void> {
    return this.mutations.flushAll()
  }

  pending(profileId: string): number {
    return this.mutations.pending(profileId)
  }

  diagnostics(): ProfileMutationDiagnostic[] {
    return this.mutations.diagnostics()
  }

  exportDiagnostics(): string {
    return this.mutations.exportDiagnostics()
  }

  clearDiagnostics(): void {
    this.mutations.clearDiagnostics()
  }

}
