import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { invoke } from '@tauri-apps/api/core'
import { z } from 'zod'
import type { SavedPartPreset, WatchProject } from '../vnext/model'

export interface NativeInfo {
  native: true
  appVersion: string
  platform: string
  architecture: string
  databasePath: string
  dataDirectory: string
}

export interface NativeProjectSummary {
  id: string
  name: string
  movement: string
  modifiedAt: string
  schemaVersion: number
}

export interface CadEngineInfo {
  name: string
  engineVersion: string
  protocolVersion: number
  openCascadeVersion: string
  pythonVersion: string
  kernel: string
  capabilities: string[]
}

export interface CadPartReport {
  name: string
  partId: string
  valid: boolean
  volumeMm3: number
  areaMm2: number
  bounds: { min: [number, number, number]; max: [number, number, number] }
  metadata: Record<string, unknown>
}

export interface CadCollision {
  first: string
  second: string
  state: 'clear' | 'contact' | 'collision' | 'indeterminate'
  distanceMm: number | null
  intersectionVolumeMm3: number | null
  exact: boolean
  error?: string
}

export interface CadAnalysis {
  parts: CadPartReport[]
  collisions: CadCollision[]
  minimumClearanceMm: number | null
  invalidParts: string[]
  sweepCollisions?: CadSweepCollision[]
}

export interface CadSweepCollision {
  hand: 'hourHand' | 'minuteHand' | 'secondHand'
  obstacle: string
  state: 'clear' | 'contact' | 'collision' | 'indeterminate'
  minimumDistanceMm: number | null
  intersectionVolumeMm3: number | null
  anglesTested: number | string
  method?: string
  exact: boolean
  error?: string
}

export interface CadArtifact {
  format: 'step' | 'stl' | '3mf' | 'glb'
  partId?: string
  path: string
  bytes: number
}

export interface CadStepInspection {
  fileName: string
  valid: boolean
  volumeMm3: number
  areaMm2: number
  bounds: { min: [number, number, number]; max: [number, number, number] }
  size: [number, number, number]
  center: [number, number, number]
}

export interface CadResponse {
  ok: true
  engine: CadEngineInfo
  projectId?: string
  partCount?: number
  analysis?: CadAnalysis
  artifacts?: CadArtifact[]
  inspection?: CadStepInspection
  durationMs: number
}

export interface WatchPackageManifest {
  format: 'watch-prototype-lab'
  packageVersion: 1
  projectSchemaVersion: 2 | 3 | 4 | 5
  projectId: string
  projectName: string
  movement: string
  createdAt: string
  exportedAt: string
  includes: string[]
}

const projectSchema = z.object({
  schemaVersion: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  id: z.string().min(1),
  name: z.string().min(1),
  movement: z.object({ kind: z.enum(['quartz', 'mechanical']) }).passthrough(),
}).passthrough()

const manifestSchema = z.object({
  format: z.literal('watch-prototype-lab'),
  packageVersion: z.literal(1),
  projectSchemaVersion: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  projectId: z.string(),
  projectName: z.string(),
  movement: z.string(),
  createdAt: z.string(),
  exportedAt: z.string(),
  includes: z.array(z.string()),
})

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__)
}

async function invokeNative<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isNativeApp()) throw new Error('Esta funcion requiere Watch Prototype Lab Desktop.')
  return invoke<T>(command, args)
}

export async function invokeLearningNative<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!command.startsWith('learning_')) throw new Error('El comando no pertenece al subsistema learning.')
  return invokeNative<T>(command, args)
}

export async function getNativeInfo(): Promise<NativeInfo | null> {
  if (!isNativeApp()) return null
  return invokeNative<NativeInfo>('native_info')
}

export async function saveNativeProject(project: WatchProject): Promise<void> {
  await invokeNative<void>('save_project_native', { project })
}

export async function listNativeProjects(): Promise<NativeProjectSummary[]> {
  if (!isNativeApp()) return []
  return invokeNative<NativeProjectSummary[]>('list_projects_native')
}

export async function loadNativeProject(id: string): Promise<WatchProject | null> {
  return invokeNative<WatchProject | null>('load_project_native', { id })
}

export async function deleteNativeProject(id: string): Promise<void> {
  await invokeNative<void>('delete_project_native', { id })
}

export async function saveNativePart(preset: SavedPartPreset): Promise<void> {
  await invokeNative<void>('save_part_native', { preset })
}

export async function listNativeParts(): Promise<SavedPartPreset[]> {
  if (!isNativeApp()) return []
  return invokeNative<SavedPartPreset[]>('list_parts_native')
}

export async function deleteNativePart(id: string): Promise<void> {
  await invokeNative<void>('delete_part_native', { id })
}

export async function runCadRequest(request: {
  command: 'health' | 'analyze' | 'build' | 'export' | 'inspect-step'
  project?: WatchProject
  outputDir?: string
  inputPath?: string
  formats?: Array<'step' | 'stl' | '3mf' | 'glb'>
  contactToleranceMm?: number
}): Promise<CadResponse> {
  return invokeNative<CadResponse>('run_cad_native', {
    request: {
      protocolVersion: 1,
      ...request,
    },
  })
}

export async function inspectStepFile(): Promise<CadStepInspection | null> {
  if (!isNativeApp()) return null
  const { open } = await import('@tauri-apps/plugin-dialog')
  const path = await open({
    title: 'Importar componente mecanico STEP',
    multiple: false,
    directory: false,
    filters: [{ name: 'STEP', extensions: ['step', 'stp'] }],
  })
  if (typeof path !== 'string') return null
  const response = await runCadRequest({ command: 'inspect-step', inputPath: path })
  if (!response.inspection) throw new Error('OpenCascade no devolvio datos de la pieza STEP.')
  return response.inspection
}

export async function cancelCadRequest(): Promise<boolean> {
  if (!isNativeApp()) return false
  return invokeNative<boolean>('cancel_cad_native')
}

export async function chooseExportDirectory(): Promise<string | null> {
  if (!isNativeApp()) return null
  const { open } = await import('@tauri-apps/plugin-dialog')
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Carpeta para archivos CAD',
  })
  return typeof selected === 'string' ? selected : null
}

export async function exportCadProject(
  project: WatchProject,
  formats: Array<'step' | 'stl' | '3mf' | 'glb'>,
): Promise<CadResponse | null> {
  const outputDir = await chooseExportDirectory()
  if (!outputDir) return null
  return runCadRequest({ command: 'export', project, outputDir, formats })
}

export function encodeWatchPackage(project: WatchProject, cadAnalysis?: CadAnalysis): Uint8Array {
  const exportedAt = new Date().toISOString()
  const includes = ['project.json']
  const entries: Record<string, Uint8Array> = {
    'project.json': strToU8(JSON.stringify(project, null, 2)),
  }
  if (cadAnalysis) {
    entries['reports/cad-analysis.json'] = strToU8(JSON.stringify(cadAnalysis, null, 2))
    includes.push('reports/cad-analysis.json')
  }
  const manifest: WatchPackageManifest = {
    format: 'watch-prototype-lab',
    packageVersion: 1,
    projectSchemaVersion: project.schemaVersion,
    projectId: project.id,
    projectName: project.name,
    movement: project.movement.name,
    createdAt: project.createdAt,
    exportedAt,
    includes,
  }
  entries['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2))
  return zipSync(entries, { level: 6 })
}

export function decodeWatchPackage(bytes: Uint8Array): {
  manifest: WatchPackageManifest
  project: WatchProject
  cadAnalysis?: CadAnalysis
} {
  const files = unzipSync(bytes)
  const manifestBytes = files['manifest.json']
  const projectBytes = files['project.json']
  if (!manifestBytes || !projectBytes) throw new Error('El paquete no contiene manifest.json y project.json.')
  const manifest = manifestSchema.parse(JSON.parse(strFromU8(manifestBytes)))
  const project = projectSchema.parse(JSON.parse(strFromU8(projectBytes))) as unknown as WatchProject
  const reportBytes = files['reports/cad-analysis.json']
  return {
    manifest,
    project,
    cadAnalysis: reportBytes ? JSON.parse(strFromU8(reportBytes)) as CadAnalysis : undefined,
  }
}

function safeFileName(name: string): string {
  return name.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'watch-project'
}

function browserDownload(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
    type: 'application/vnd.watch-prototype-lab+zip',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

export async function saveWatchPackage(project: WatchProject, cadAnalysis?: CadAnalysis): Promise<string | null> {
  const bytes = encodeWatchPackage(project, cadAnalysis)
  const fileName = `${safeFileName(project.name)}.wplab`
  if (!isNativeApp()) {
    browserDownload(bytes, fileName)
    return fileName
  }
  const [{ save }, { writeFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ])
  const path = await save({
    title: 'Guardar proyecto Watch Prototype Lab',
    defaultPath: fileName,
    filters: [{ name: 'Watch Prototype Lab', extensions: ['wplab'] }],
  })
  if (!path) return null
  await writeFile(path, bytes)
  return path
}

export async function openWatchPackage(): Promise<ReturnType<typeof decodeWatchPackage> | null> {
  if (!isNativeApp()) return null
  const [{ open }, { readFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ])
  const path = await open({
    title: 'Abrir proyecto Watch Prototype Lab',
    multiple: false,
    directory: false,
    filters: [{ name: 'Watch Prototype Lab', extensions: ['wplab'] }],
  })
  if (typeof path !== 'string') return null
  return decodeWatchPackage(await readFile(path))
}
