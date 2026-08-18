import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { ArrowRight, Camera, CheckCircle2, ClipboardCheck, Download, Gauge, ImagePlus, Microscope, Plus, RefreshCcw, Ruler, Save, Scale, ShieldCheck, Wrench } from 'lucide-react'
import {
  calibrateImage,
  compareNominalAndMeasured,
  createCandidatePatch,
  createHorologyMetrologyRepository,
  createMetrologyMetadataBackup,
  createMetrologyId,
  createNativeMetrologyBackup,
  declareMeasurementUncertainty,
  FINDING_TYPES_BY_CATEGORY,
  importNativeMetrologyImage,
  importWebMetrologyImage,
  privateSafeSpecimen,
  previewNativeMetrologyRestore,
  resolveSeriesResult,
  selectMetrologyImagePath,
  serializeMetrologyMetadataBackup,
  restoreNativeMetrologyBackup,
  transitionGeometryProposal,
  validateComponent,
  validateFinding,
  validateInstrument,
  validateInstrumentVerification,
  validateSpecimen,
  type ContentAddressedObject,
  type GeometryCorrectionProposal,
  type HorologyMetrologyRepository,
  type ImageAnnotation,
  type ImageAnnotationKind,
  type ImageAsset,
  type ImageCalibration,
  type ImagePoint,
  type InspectionFinding,
  type FindingCategory,
  type FindingSeverity,
  type FindingType,
  type InspectionObservation,
  type InspectionSession,
  type InstrumentProfile,
  type InstrumentVerification,
  type MeasurementDefinition,
  type MeasurementReading,
  type MeasurementSeries,
  type MetrologyReport,
  type NominalMeasuredComparison,
  type NativeMetrologyBackupSummary,
  type NativeMetrologyRestorePreview,
  type PhysicalComponent,
  type PhysicalSpecimen,
} from '../../core/horology-metrology'
import { quantity } from '../../core/horology-engineering'
import { isNativeApp } from '../../platform/native'
import { useLearning } from './LearningContext'
import { MetrologyImageWorkbench } from './MetrologyImageWorkbench'
import {
  metrologyComparisonLabel,
  metrologyConfidenceLabel,
  metrologyCorrespondenceLabel,
  metrologyFindingCategoryLabel,
  metrologyFindingSeverityLabel,
  metrologyFindingTypeLabel,
  metrologyInstrumentTypeLabel,
  metrologyProposalStatusLabel,
  metrologySeriesStatusLabel,
  metrologySpecimenConditionLabel,
  metrologyTargetParameterLabel,
  metrologyVerificationKindLabel,
  metrologyVerificationStatusLabel,
} from './metrologyUiLanguage'
import './metrology.css'

type MetrologyTab = 'specimens' | 'instruments' | 'inspection' | 'measurement' | 'comparison'

interface MetrologyData {
  specimens: PhysicalSpecimen[]
  components: PhysicalComponent[]
  instruments: InstrumentProfile[]
  verifications: InstrumentVerification[]
  images: ImageAsset[]
  objects: ContentAddressedObject[]
  calibrations: ImageCalibration[]
  annotations: ImageAnnotation[]
  sessions: InspectionSession[]
  observations: InspectionObservation[]
  findings: InspectionFinding[]
  definitions: MeasurementDefinition[]
  series: MeasurementSeries[]
  comparisons: NominalMeasuredComparison[]
  proposals: GeometryCorrectionProposal[]
}

const EMPTY_DATA: MetrologyData = {
  specimens: [], components: [], instruments: [], verifications: [], images: [], objects: [], calibrations: [], annotations: [],
  sessions: [], observations: [], findings: [], definitions: [], series: [], comparisons: [], proposals: [],
}

function now(): string { return new Date().toISOString() }
function uniquePart(): string { return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` }

function downloadText(fileName: string, content: string, mediaType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mediaType }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function DataBoundary({ children }: { children: ReactNode }) {
  return <div className="metrology-boundary"><ShieldCheck size={18} /><div><strong>Unidad concreta, evidencia concreta</strong><span>Una observación o medida pertenece primero a esta unidad. No se generaliza al calibre, la marca ni el modelo virtual sin revisión.</span></div>{children}</div>
}

export function MetrologySurface() {
  const { snapshot } = useLearning()
  const profileId = snapshot.profile?.id ?? 'profile.local'
  const [repository, setRepository] = useState<HorologyMetrologyRepository>()
  const [data, setData] = useState<MetrologyData>(EMPTY_DATA)
  const requestedTab = snapshot.location.query.tab
  const [tab, setTab] = useState<MetrologyTab>(['specimens', 'instruments', 'inspection', 'measurement', 'comparison'].includes(requestedTab ?? '') ? requestedTab as MetrologyTab : 'specimens')
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>()
  const [selectedImageId, setSelectedImageId] = useState<string>()
  const [status, setStatus] = useState('Preparando registro local…')
  const [error, setError] = useState<string>()
  const [lastBackup, setLastBackup] = useState<NativeMetrologyBackupSummary>()
  const [restorePreview, setRestorePreview] = useState<NativeMetrologyRestorePreview>()
  const fileInput = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async (activeRepository: HorologyMetrologyRepository) => {
    const query = { profileId, limit: 250 }
    const [specimens, components, instruments, verifications, images, objects, calibrations, annotations, sessions, observations, findings, definitions, series, comparisons, proposals] = await Promise.all([
      activeRepository.list('physical_specimens', query),
      activeRepository.list('physical_components', query),
      activeRepository.list('instrument_profiles', query),
      activeRepository.list('instrument_verifications', query),
      activeRepository.list('image_assets', query),
      activeRepository.list('object_store_objects', { limit: 250 }),
      activeRepository.list('image_calibrations', query),
      activeRepository.list('image_annotations', query),
      activeRepository.list('inspection_sessions', query),
      activeRepository.list('inspection_observations', query),
      activeRepository.list('inspection_findings', query),
      activeRepository.list('measurement_definitions', query),
      activeRepository.list('measurement_series', query),
      activeRepository.list('nominal_measured_comparisons', query),
      activeRepository.list('geometry_correction_proposals', query),
    ])
    setData({
      specimens: specimens.items,
      components: components.items,
      instruments: instruments.items,
      verifications: verifications.items,
      images: images.items,
      objects: objects.items,
      calibrations: calibrations.items,
      annotations: annotations.items,
      sessions: sessions.items,
      observations: observations.items,
      findings: findings.items,
      definitions: definitions.items,
      series: series.items,
      comparisons: comparisons.items,
      proposals: proposals.items,
    })
    setSelectedSpecimenId((current) => current && specimens.items.some(({ id }) => id === current) ? current : specimens.items[0]?.id)
    setSelectedImageId((current) => current && images.items.some(({ id }) => id === current) ? current : images.items[0]?.id)
    setStatus(`${specimens.total} unidades · ${instruments.total} instrumentos · ${series.total} series`)
  }, [profileId])

  useEffect(() => {
    let cancelled = false
    let active: HorologyMetrologyRepository | undefined
    void createHorologyMetrologyRepository().then(async (next) => {
      active = next
      if (cancelled) { await next.close(); return }
      setRepository(next)
      await refresh(next)
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No se pudo abrir metrología.'))
    return () => { cancelled = true; if (active) void active.close() }
  }, [refresh])

  const run = async (operation: () => Promise<void>, success: string) => {
    if (!repository) return
    setError(undefined)
    try {
      await operation()
      await refresh(repository)
      setStatus(success)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La operación no se pudo completar.')
    }
  }

  const selectedSpecimen = data.specimens.find(({ id }) => id === selectedSpecimenId)
  const specimenImages = data.images.filter(({ specimenId }) => specimenId === selectedSpecimenId)
  const selectedImage = specimenImages.find(({ id }) => id === selectedImageId) ?? specimenImages[0]
  const selectedOriginal = data.objects.find(({ id }) => id === selectedImage?.originalObjectId)
  const selectedThumbnail = data.objects.find(({ id }) => id === selectedImage?.thumbnailObjectId)
  const selectedCalibration = data.calibrations.filter(({ imageAssetId }) => imageAssetId === selectedImage?.id).toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
  const selectedAnnotations = data.annotations.filter(({ imageAssetId }) => imageAssetId === selectedImage?.id)
  const specimenSeries = data.series.filter(({ specimenId }) => specimenId === selectedSpecimenId)
  const specimenComparisons = data.comparisons.filter(({ specimenId }) => specimenId === selectedSpecimenId)
  const specimenProposals = data.proposals.filter(({ specimenId }) => specimenId === selectedSpecimenId)

  const createMetadataBackup = async () => {
    if (!repository) return
    setError(undefined)
    try {
      if (isNativeApp()) {
        const result = await createNativeMetrologyBackup(false)
        setLastBackup(result); setRestorePreview(undefined)
        setStatus(`Copia de metadatos creada; ${result.omittedObjectCount} objetos declarados y no incluidos.`)
      } else {
        const backup = await createMetrologyMetadataBackup(repository, profileId)
        downloadText(`metrologia-${profileId}-metadata.json`, serializeMetrologyMetadataBackup(backup), 'application/json')
        setStatus(`Copia de metadatos exportada; ${backup.objects.length} objetos binarios declarados y no incluidos.`)
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear la copia de seguridad.') }
  }

  const createFullBackup = async () => {
    setError(undefined)
    try {
      const result = await createNativeMetrologyBackup(true)
      setLastBackup(result); setRestorePreview(undefined)
      setStatus(`Copia completa verificada: ${result.objectCount - result.omittedObjectCount}/${result.objectCount} objetos.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear la copia de seguridad completa.') }
  }

  const previewLastRestore = async () => {
    if (!lastBackup) return
    setError(undefined)
    try { const result = await previewNativeMetrologyRestore(lastBackup.backup.id); setRestorePreview(result); setStatus('Restauración previsualizada; revisa conflictos antes de confirmar.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo previsualizar la restauración.') }
  }

  const confirmLastRestore = async () => {
    if (!restorePreview) return
    setError(undefined)
    try { await restoreNativeMetrologyBackup(restorePreview.backupId, restorePreview.manifestHash); if (repository) await refresh(repository); setRestorePreview(undefined); setStatus('Copia restaurada con una copia de seguridad previa y huellas digitales verificadas.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo restaurar la copia de seguridad.') }
  }

  const importImage = async (file?: File) => {
    if (!repository || !selectedSpecimen) throw new Error('Selecciona primero una unidad física.')
    if (isNativeApp()) {
      const path = await selectMetrologyImagePath()
      if (!path) return
      await importNativeMetrologyImage({ path, jobId: createMetrologyId('object', [profileId, uniquePart()]), profileId, specimenId: selectedSpecimen.id })
    } else {
      if (!file) return
      await importWebMetrologyImage({ file, profileId, specimenId: selectedSpecimen.id, repository })
    }
  }

  const createCalibration = async (pixelDistance: number, physicalDistance: number) => {
    if (!repository || !selectedImage) return
    const timestamp = now()
    const value = calibrateImage({
      schemaVersion: 1,
      id: createMetrologyId('image-calibration', [selectedImage.id, uniquePart()]),
      profileId,
      ...(selectedImage.specimenId ? { specimenId: selectedImage.specimenId } : {}),
      imageAssetId: selectedImage.id,
      method: 'known-distance',
      pixelDistance,
      physicalDistance,
      physicalUnit: 'mm',
      referencePlane: 'plano de la referencia visible',
      perspective: 'orthogonal-assumed',
      confidence: 'medium',
      effectiveResolution: 1 / (pixelDistance / physicalDistance),
      assumptions: ['La referencia y el objetivo están en el mismo plano óptico.'],
      limitations: ['Calibración 2D; no permite deducir profundidad ni corregir perspectiva por sí sola.'],
      calibratedAt: timestamp,
      operator: snapshot.profile?.displayName ?? 'Perfil local',
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    })
    await run(() => repository.put('image_calibrations', value), 'Escala 2D calibrada y trazable.')
  }

  const createAnnotation = async (kind: ImageAnnotationKind, points: ImagePoint[], value?: number, unit?: ImageAnnotation['unit']) => {
    if (!repository || !selectedImage) return
    const timestamp = now()
    const annotation: ImageAnnotation = {
      schemaVersion: 1,
      id: createMetrologyId('image-annotation', [selectedImage.id, kind, uniquePart()]),
      profileId,
      ...(selectedImage.specimenId ? { specimenId: selectedImage.specimenId } : {}),
      imageAssetId: selectedImage.id,
      ...(selectedCalibration ? { calibrationId: selectedCalibration.id } : {}),
      kind,
      points,
      label: `${kind} ${selectedAnnotations.length + 1}`,
      ...(value === undefined ? {} : { value }),
      ...(unit ? { unit } : {}),
      method: selectedCalibration ? 'anotación manual sobre imagen calibrada' : 'anotación manual en píxeles',
      operator: snapshot.profile?.displayName ?? 'Perfil local',
      confidence: selectedCalibration ? 'medium' : 'low',
      source: 'manual',
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    }
    await run(() => repository.put('image_annotations', annotation), 'Anotación guardada sin alterar el original.')
  }

  const exportDossier = async (format: 'json' | 'html', includeOriginals: boolean) => {
    if (!repository || !selectedSpecimen) return
    const timestamp = now()
    const report: MetrologyReport = {
      schemaVersion: 1,
      id: createMetrologyId('report', [selectedSpecimen.id, timestamp]),
      profileId,
      specimenId: selectedSpecimen.id,
      title: `Dossier metrológico · ${selectedSpecimen.displayName}`,
      generatedAt: timestamp,
      formatVersion: 1,
      specimen: privateSafeSpecimen(selectedSpecimen),
      sessions: data.sessions.filter(({ specimenId }) => specimenId === selectedSpecimen.id),
      observations: data.observations.filter(({ specimenId }) => specimenId === selectedSpecimen.id),
      findings: data.findings.filter(({ specimenId }) => specimenId === selectedSpecimen.id),
      instruments: data.instruments,
      verifications: data.verifications,
      measurementSeries: specimenSeries,
      comparisons: specimenComparisons,
      proposals: specimenProposals,
      includedObjectIds: specimenImages.flatMap((image) => includeOriginals ? [image.originalObjectId, image.thumbnailObjectId].filter((id): id is string => Boolean(id)) : [image.thumbnailObjectId].filter((id): id is string => Boolean(id))),
      excludedPrivateFields: ['serialNumber', 'acquisitionSource', 'storageLocation'],
      limitations: ['Informe local no acreditado.', 'Las medidas se aplican a la unidad identificada.'],
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    }
    await repository.put('metrology_reports', report)
    const baseName = selectedSpecimen.stableIdentifier.replace(/[^a-z0-9-_]+/giu, '-')
    if (format === 'json') downloadText(`${baseName}-metrology.json`, JSON.stringify(report, null, 2), 'application/json')
    else downloadText(`${baseName}-metrology.html`, `<!doctype html><html lang="es"><meta charset="utf-8"><title>${escapeHtml(report.title)}</title><style>body{font:16px system-ui;max-width:980px;margin:40px auto;padding:0 24px;color:#172122}section{border:1px solid #ccd6d5;padding:20px;margin:16px 0}code{word-break:break-all}</style><h1>${escapeHtml(report.title)}</h1><p>Generado ${escapeHtml(report.generatedAt)}. Unidad concreta; informe no acreditado.</p><section><h2>Unidad</h2><pre>${escapeHtml(JSON.stringify(report.specimen, null, 2))}</pre></section><section><h2>Mediciones (${report.measurementSeries.length})</h2><pre>${escapeHtml(JSON.stringify(report.measurementSeries, null, 2))}</pre></section><section><h2>Comparaciones (${report.comparisons.length})</h2><pre>${escapeHtml(JSON.stringify(report.comparisons, null, 2))}</pre></section></html>`, 'text/html')
    await refresh(repository)
  }

  return (
    <div className="academy-page metrology-page">
      <header className="academy-page-header metrology-hero"><div><span className="academy-kicker">MEDIR UNA PIEZA REAL</span><h1>Inspección y metrología relojera</h1><p>Fotografía una pieza, anota cómo la has medido y compara el resultado sin confundir una observación con un dato oficial.</p><a className="academy-text-link" href={`#/learning/notebook?${new URLSearchParams({ ...(selectedSpecimenId ? { specimen: selectedSpecimenId } : {}), ...(selectedImage?.id ? { image: selectedImage.id } : {}), ...(specimenSeries[0]?.id ? { series: specimenSeries[0].id } : {}), ...(specimenProposals[0]?.id ? { proposal: specimenProposals[0].id } : {}) }).toString()}`}>Añadir una nota</a></div><div className="metrology-hero-status"><i /><strong>Guardado en este equipo</strong><span>{status}</span><button type="button" onClick={() => repository && void refresh(repository)}><RefreshCcw size={15} />Actualizar</button><details><summary>Detalles de almacenamiento</summary><span>{isNativeApp() ? 'Aplicación de escritorio · base de datos y archivos locales' : 'Navegador · almacenamiento local'}</span></details></div></header>
      <DataBoundary>{error && <p className="metrology-error" role="alert">{error}</p>}</DataBoundary>
      <details className="metrology-data-safety"><summary>Protección, copia de seguridad y restauración</summary><div><p>La copia de metadatos informa expresamente de las fotos omitidas. En la aplicación de escritorio, la copia completa incluye la base de datos, el manifiesto y los objetos con su huella digital.</p><div className="metrology-actions"><button type="button" onClick={() => void createMetadataBackup()}><Save size={15} />Copiar metadatos</button>{isNativeApp() && <button type="button" onClick={() => void createFullBackup()}><ShieldCheck size={15} />Copia completa</button>}{lastBackup && <button type="button" onClick={() => void previewLastRestore()}><RefreshCcw size={15} />Previsualizar restauración</button>}{restorePreview && <button type="button" disabled={restorePreview.missingOrCorruptObjectIds.length > 0 || restorePreview.conflictingObjectIds.length > 0} onClick={() => void confirmLastRestore()}><ClipboardCheck size={15} />Confirmar restauración</button>}</div>{lastBackup && <small>{lastBackup.objectsIncluded ? 'Copia completa con fotografías.' : 'Copia de metadatos sin fotografías.'}</small>}{restorePreview && <p role="status">Restaurables: {restorePreview.restorableObjectIds.length}. Ausentes o corruptos: {restorePreview.missingOrCorruptObjectIds.length}. Conflictos: {restorePreview.conflictingObjectIds.length}. No se sobrescribirá ningún objeto distinto.</p>}</div></details>
      <nav className="metrology-tabs" aria-label="Áreas de metrología">{([
        ['specimens', 'Unidades físicas', Microscope], ['instruments', 'Instrumentos', Gauge], ['inspection', 'Inspección', Camera], ['measurement', 'Medición', Ruler], ['comparison', 'Comparar y proponer', Scale],
      ] as const).map(([id, label, Icon]) => <button type="button" key={id} className={tab === id ? 'is-active' : undefined} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}</nav>
      {tab === 'specimens' && <SpecimensPanel repository={repository} profileId={profileId} linkedProjectId={snapshot.location.query.project} data={data} selectedSpecimenId={selectedSpecimenId} setSelectedSpecimenId={setSelectedSpecimenId} run={run} onImport={() => void run(() => importImage(), 'Fotografía importada y deduplicada.')} fileInput={fileInput} onWebFile={(file) => void run(() => importImage(file), 'Fotografía importada y deduplicada.')} onExport={exportDossier} />}
      {tab === 'instruments' && <InstrumentsPanel repository={repository} profileId={profileId} instruments={data.instruments} verifications={data.verifications} run={run} />}
      {tab === 'inspection' && <section className="metrology-split"><div><InspectionPanel repository={repository} profileId={profileId} specimen={selectedSpecimen} sessions={data.sessions} observations={data.observations} findings={data.findings} run={run} /></div><div><div className="metrology-image-picker">{specimenImages.map((image,index) => <button type="button" className={selectedImage?.id === image.id ? 'is-active' : undefined} key={image.id} onClick={() => setSelectedImageId(image.id)}>Fotografía {index+1}</button>)}</div><MetrologyImageWorkbench image={selectedImage} original={selectedOriginal} thumbnail={selectedThumbnail} calibration={selectedCalibration} annotations={selectedAnnotations} onCreateCalibration={createCalibration} onCreateAnnotation={createAnnotation} /></div></section>}
      {tab === 'measurement' && <MeasurementPanel repository={repository} profileId={profileId} specimen={selectedSpecimen} instruments={data.instruments} verifications={data.verifications} series={specimenSeries} run={run} />}
      {tab === 'comparison' && <ComparisonPanel repository={repository} profileId={profileId} specimen={selectedSpecimen} series={specimenSeries} comparisons={specimenComparisons} proposals={specimenProposals} run={run} />}
    </div>
  )
}

function SpecimensPanel({ repository, profileId, linkedProjectId, data, selectedSpecimenId, setSelectedSpecimenId, run, onImport, fileInput, onWebFile, onExport }: {
  repository?: HorologyMetrologyRepository; profileId: string; linkedProjectId?: string; data: MetrologyData; selectedSpecimenId?: string; setSelectedSpecimenId: (id: string) => void; run: (operation: () => Promise<void>, success: string) => Promise<void>; onImport: () => void; fileInput: RefObject<HTMLInputElement | null>; onWebFile: (file: File) => void; onExport: (format: 'json' | 'html', includeOriginals: boolean) => Promise<void>
}) {
  const [name, setName] = useState('Movimiento de práctica')
  const [identifier, setIdentifier] = useState('unidad-001')
  const [manufacturer, setManufacturer] = useState('')
  const [calibre, setCalibre] = useState('')
  const [componentName, setComponentName] = useState('')
  const [correspondence, setCorrespondence] = useState<PhysicalComponent['correspondence']>('unknown')
  const [includeOriginals, setIncludeOriginals] = useState(false)
  const selected = data.specimens.find(({ id }) => id === selectedSpecimenId)
  const components = data.components.filter(({ specimenId }) => specimenId === selectedSpecimenId)
  const images = data.images.filter(({ specimenId }) => specimenId === selectedSpecimenId)
  const create = (event: FormEvent) => {
    event.preventDefault(); if (!repository) return
    const timestamp = now()
    const specimen = validateSpecimen({ schemaVersion: 1, id: createMetrologyId('specimen', [profileId, identifier]), profileId, reality: 'physical', stableIdentifier: identifier, displayName: name, kind: 'movement', ...(manufacturer ? { manufacturer } : {}), ...(calibre ? { calibreOrReference: calibre } : {}), completeness: 'unknown', declaredProvenance: { kind: 'owned', description: 'Declarada por el perfil local.' }, identificationConfidence: calibre ? 'possible' : 'unknown', ownership: 'owned', condition: 'as-received', notes: '', tags: [], linkedProjectIds: linkedProjectId ? [linkedProjectId] : [], linkedFixtureIds: [], linkedFixtureVersions: {}, humanReview: { state: 'pending' }, privacy: 'private', createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 })
    void run(() => repository.put('physical_specimens', specimen), 'Unidad física registrada.')
  }
  const createComponent = (event: FormEvent) => {
    event.preventDefault(); if (!repository || !selected || !componentName.trim()) return
    const timestamp = now()
    const component = validateComponent({ schemaVersion: 1, id: createMetrologyId('component', [selected.id, componentName, uniquePart()]), profileId, specimenId: selected.id, stableIdentifier: `${selected.stableIdentifier}-${components.length + 1}`, displayName: componentName, componentKind: 'watch-component', correspondence, correspondenceReason: correspondence === 'unknown' ? 'No se ha establecido correspondencia.' : 'Correspondencia declarada por la persona usuaria; pendiente de evidencia adicional.', condition: 'disassembled', notes: '', tags: [], createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 })
    void run(() => repository.put('physical_components', component), 'Componente añadido sin forzar correspondencia.')
  }
  return <section className="metrology-registry"><aside><form onSubmit={create} className="metrology-form"><span className="academy-kicker">NUEVA UNIDAD</span><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Identificador estable<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required /></label><label>Fabricante, si se conoce<input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} /></label><label>Calibre o referencia, si se conoce<input value={calibre} onChange={(event) => setCalibre(event.target.value)} /></label><button className="academy-button is-primary" type="submit"><Plus size={15} />Registrar unidad</button></form><div className="metrology-record-list">{data.specimens.map((specimen) => <button type="button" key={specimen.id} className={selectedSpecimenId === specimen.id ? 'is-active' : undefined} onClick={() => setSelectedSpecimenId(specimen.id)}><Microscope size={17} /><span><strong>{specimen.displayName}</strong><small>{specimen.stableIdentifier} · {specimen.calibreOrReference ?? 'sin calibre atribuido'}</small></span></button>)}</div></aside><article className="metrology-detail">{selected ? <><header><div><span className="academy-kicker">UNIDAD FÍSICA</span><h2>{selected.displayName}</h2><p>{selected.manufacturer || 'Fabricante no declarado'} · {selected.calibreOrReference || 'Referencia no declarada'} · {metrologySpecimenConditionLabel(selected.condition)}</p></div><span className="metrology-private">Privado por defecto</span></header><dl className="metrology-facts"><div><dt>Identificador</dt><dd>{selected.stableIdentifier}</dd></div><div><dt>Componentes</dt><dd>{components.length}</dd></div><div><dt>Fotografías</dt><dd>{images.length}</dd></div><div><dt>Correspondencia</dt><dd>{components.filter(({ correspondence: value }) => value === 'confirmed').length} confirmadas</dd></div></dl><section><h3>Componentes físicos</h3><form onSubmit={createComponent} className="metrology-inline-form"><input value={componentName} onChange={(event) => setComponentName(event.target.value)} placeholder="Nombre observable de la pieza" /><select value={correspondence} onChange={(event) => setCorrespondence(event.target.value as PhysicalComponent['correspondence'])}><option value="unknown">Sin mapear</option><option value="possible">Posible</option><option value="probable">Probable</option><option value="confirmed">Confirmada</option><option value="not-mappable">No mapeable</option></select><button type="submit"><Plus size={14} />Añadir</button></form><div className="metrology-component-grid">{components.map((component) => <article key={component.id}><Wrench size={16} /><strong>{component.displayName}</strong><span>{metrologyCorrespondenceLabel(component.correspondence)}</span><small>{component.correspondenceReason}</small></article>)}</div></section><section><h3>Fotografías y dossier</h3><div className="metrology-actions"><input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onWebFile(file); event.currentTarget.value = '' }} /><button type="button" onClick={() => isNativeApp() ? onImport() : fileInput.current?.click()}><ImagePlus size={15} />Importar fotografía</button><label><input type="checkbox" checked={includeOriginals} onChange={(event) => setIncludeOriginals(event.target.checked)} />Incluir originales en selección del dossier</label><button type="button" onClick={() => void onExport('json', includeOriginals)}><Download size={15} />JSON</button><button type="button" onClick={() => void onExport('html', includeOriginals)}><Download size={15} />HTML</button></div></section></> : <div className="metrology-empty">Registra una unidad física para comenzar.</div>}</article></section>
}

function InstrumentsPanel({ repository, profileId, instruments, verifications, run }: { repository?: HorologyMetrologyRepository; profileId: string; instruments: InstrumentProfile[]; verifications: InstrumentVerification[]; run: (operation: () => Promise<void>, success: string) => Promise<void> }) {
  const [name, setName] = useState('Calibre digital')
  const [type, setType] = useState<InstrumentProfile['type']>('caliper')
  const [resolution, setResolution] = useState('0.01')
  const [selectedId, setSelectedId] = useState<string>()
  const selected = instruments.find(({ id }) => id === selectedId) ?? instruments[0]
  const create = (event: FormEvent) => { event.preventDefault(); if (!repository) return; const timestamp = now(); const instrument = validateInstrument({ schemaVersion: 1, id: createMetrologyId('instrument', [profileId, name, uniquePart()]), profileId, displayName: name, type, resolution: quantity(Number(resolution), 'mm', 'official'), measurementDimensions: ['length'], lastKnownCondition: 'unknown', privacy: 'private', notes: 'La resolución no se interpreta como exactitud.', createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }); void run(() => repository.put('instrument_profiles', instrument), 'Instrumento registrado sin inferir exactitud.') }
  const verify = () => { if (!repository || !selected) return; const timestamp = now(); const verification = validateInstrumentVerification({ schemaVersion: 1, id: createMetrologyId('verification', [selected.id, timestamp]), profileId, instrumentId: selected.id, kind: 'zero-check', status: 'limited', performedAt: timestamp, referenceDescription: 'Comprobación de cero funcional; no equivale a calibración.', operator: 'Perfil local', evidenceObjectIds: [], limitations: ['No demuestra exactitud a lo largo del rango.'], createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }); void run(() => repository.put('instrument_verifications', verification), 'Comprobación registrada como limitada, no como calibración.') }
  return <section className="metrology-registry"><aside><form className="metrology-form" onSubmit={create}><span className="academy-kicker">INSTRUMENTO</span><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Tipo<select value={type} onChange={(event) => setType(event.target.value as InstrumentProfile['type'])}><option value="caliper">Calibre</option><option value="micrometer">Micrómetro</option><option value="indicator">Comparador</option><option value="optical-microscope">Microscopio</option><option value="camera">Cámara</option><option value="custom">Otro</option></select></label><label>Resolución (mm)<input inputMode="decimal" value={resolution} onChange={(event) => setResolution(event.target.value)} /></label><button type="submit"><Plus size={15} />Registrar</button></form><div className="metrology-record-list">{instruments.map((instrument) => <button type="button" key={instrument.id} className={selected?.id === instrument.id ? 'is-active' : undefined} onClick={() => setSelectedId(instrument.id)}><Gauge size={17} /><span><strong>{instrument.displayName}</strong><small>{metrologyInstrumentTypeLabel(instrument.type)} · resolución {instrument.resolution.value} {instrument.resolution.unit}</small></span></button>)}</div></aside><article className="metrology-detail">{selected ? <><header><div><span className="academy-kicker">PERFIL DE INSTRUMENTO</span><h2>{selected.displayName}</h2><p>Resolución declarada: {selected.resolution.value} {selected.resolution.unit}. Exactitud: {selected.statedAccuracy ? `${selected.statedAccuracy.value} ${selected.statedAccuracy.unit}` : 'no declarada'}.</p></div><button type="button" onClick={verify}><ClipboardCheck size={15} />Comprobar cero</button></header><h3>Verificaciones</h3>{verifications.filter(({ instrumentId }) => instrumentId === selected.id).map((verification) => <article className="metrology-verification" key={verification.id}><CheckCircle2 size={16} /><div><strong>{metrologyVerificationKindLabel(verification.kind)} · {metrologyVerificationStatusLabel(verification.status)}</strong><p>{verification.referenceDescription}</p><small>{new Date(verification.performedAt).toLocaleString('es-ES')} · {verification.limitations.join(' ')}</small></div></article>)}</> : <div className="metrology-empty">Registra el instrumento real antes de medir.</div>}</article></section>
}

function InspectionPanel({ repository, profileId, specimen, sessions, observations, findings, run }: { repository?: HorologyMetrologyRepository; profileId: string; specimen?: PhysicalSpecimen; sessions: InspectionSession[]; observations: InspectionObservation[]; findings: InspectionFinding[]; run: (operation: () => Promise<void>, success: string) => Promise<void> }) {
  const [observationText, setObservationText] = useState('')
  const [findingText, setFindingText] = useState('')
  const [findingCategory, setFindingCategory] = useState<FindingCategory>('surface')
  const [findingType, setFindingType] = useState<FindingType>('mark')
  const [findingSeverity, setFindingSeverity] = useState<FindingSeverity>('note')
  const [findingConfidence, setFindingConfidence] = useState<InspectionFinding['confidence']>('medium')
  const [hypothesis, setHypothesis] = useState('')
  const activeSession = sessions.filter(({ specimenId }) => specimenId === specimen?.id).toSorted((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
  const createSession = () => { if (!repository || !specimen) return; const timestamp = now(); const session: InspectionSession = { schemaVersion: 1, id: createMetrologyId('inspection-session', [specimen.id, timestamp]), profileId, specimenId: specimen.id, state: 'active', startedAt: timestamp, operator: 'Perfil local', instrumentIds: [], imageAssetIds: [], observationIds: [], findingIds: [], measurementSeriesIds: [], accessibility: { keyboardOnly: true, pointerOptional: true, coordinateEntry: true, fineAdjustment: true, textualAnnotationList: true, zoomIndependentText: true, screenReaderSummary: true, nonColorEncoding: true, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, chartTableAlternative: true }, restorationCheckpoint: { view: 'initial', nonDestructive: true }, notes: '', createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }; void run(() => repository.put('inspection_sessions', session), 'Sesión de inspección iniciada con restauración.') }
  const addObservation = (event: FormEvent) => { event.preventDefault(); if (!repository || !specimen || !activeSession || !observationText.trim()) return; const timestamp = now(); const observation: InspectionObservation = { schemaVersion: 1, id: createMetrologyId('observation', [activeSession.id, timestamp]), profileId, sessionId: activeSession.id, specimenId: specimen.id, observedAt: timestamp, operator: 'Perfil local', description: observationText, method: 'observación visual', confidence: 'medium', evidenceObjectIds: [], createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }; void run(() => repository.put('inspection_observations', observation), 'Observación descriptiva guardada.') }
  const changeCategory = (category: FindingCategory) => { setFindingCategory(category); setFindingType(FINDING_TYPES_BY_CATEGORY[category][0]) }
  const addFinding = (event: FormEvent) => { event.preventDefault(); if (!repository || !specimen || !activeSession || !findingText.trim()) return; const latestObservation = observations.filter(({ sessionId }) => sessionId === activeSession.id)[0]; if (!latestObservation) return; const timestamp = now(); const finding = validateFinding({ schemaVersion: 1, id: createMetrologyId('finding', [activeSession.id, timestamp]), profileId, sessionId: activeSession.id, observationId: latestObservation.id, specimenId: specimen.id, category: findingCategory, type: findingType, severity: findingSeverity, finding: findingText, confidence: findingConfidence, ...(hypothesis.trim() ? { hypothesis: hypothesis.trim(), hypothesisConfidence: 'low' as const } : {}), measurementSeriesIds: [], evidenceObjectIds: [], status: 'open', createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }); void run(() => repository.put('inspection_findings', finding), 'Hallazgo separado de cualquier hipótesis.') }
  return <section className="metrology-inspection-card"><span className="academy-kicker">SESIÓN DE INSPECCIÓN</span><h2>{specimen?.displayName ?? 'Selecciona una unidad'}</h2>{!activeSession ? <button type="button" disabled={!specimen} onClick={createSession}><Plus size={15} />Iniciar sesión</button> : <><p>Sesión activa desde {new Date(activeSession.startedAt).toLocaleString('es-ES')}. Todas las operaciones visuales pueden restaurarse.</p><form onSubmit={addObservation} className="metrology-form"><label>Qué observas<textarea value={observationText} onChange={(event) => setObservationText(event.target.value)} placeholder="Describe solo lo visible, sin diagnosticar." /></label><button type="submit"><Save size={14} />Guardar observación</button></form><form onSubmit={addFinding} className="metrology-form"><label>Hallazgo asociado<textarea value={findingText} onChange={(event) => setFindingText(event.target.value)} placeholder="Clasifica lo visible; el sistema no emitirá un diagnóstico." /></label><div className="metrology-form-grid"><label>Categoría<select value={findingCategory} onChange={(event) => changeCategory(event.target.value as FindingCategory)}>{Object.keys(FINDING_TYPES_BY_CATEGORY).map((value) => <option value={value} key={value}>{metrologyFindingCategoryLabel(value as FindingCategory)}</option>)}</select></label><label>Tipo<select value={findingType} onChange={(event) => setFindingType(event.target.value as FindingType)}>{FINDING_TYPES_BY_CATEGORY[findingCategory].map((value) => <option value={value} key={value}>{metrologyFindingTypeLabel(value)}</option>)}</select></label><label>Gravedad observacional<select value={findingSeverity} onChange={(event) => setFindingSeverity(event.target.value as FindingSeverity)}><option value="note">Observación</option><option value="minor">Leve</option><option value="significant">Significativo</option><option value="critical-unknown">Posible criticidad pendiente de confirmar</option></select></label><label>Confianza<select value={findingConfidence} onChange={(event) => setFindingConfidence(event.target.value as InspectionFinding['confidence'])}><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option><option value="unknown">Pendiente</option></select></label></div><label>Hipótesis opcional<textarea value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} placeholder="Se guarda separada y con confianza baja; no es un diagnóstico." /></label><button type="submit" disabled={!observations.some(({ sessionId }) => sessionId === activeSession.id)}><ClipboardCheck size={14} />Guardar hallazgo</button></form><div className="metrology-timeline">{observations.filter(({ sessionId }) => sessionId === activeSession.id).map((observation) => <article key={observation.id}><strong>Observación</strong><p>{observation.description}</p></article>)}{findings.filter(({ sessionId }) => sessionId === activeSession.id).map((finding) => <article key={finding.id}><strong>{metrologyFindingCategoryLabel(finding.category)} · {metrologyFindingTypeLabel(finding.type)} · {metrologyFindingSeverityLabel(finding.severity)}</strong><p>{finding.finding}</p>{finding.hypothesis && <small>Hipótesis (confianza {metrologyConfidenceLabel(finding.hypothesisConfidence ?? 'unknown').toLocaleLowerCase('es-ES')}): {finding.hypothesis}</small>}</article>)}</div></>}</section>
}

function MeasurementPanel({ repository, profileId, specimen, instruments, verifications, series, run }: { repository?: HorologyMetrologyRepository; profileId: string; specimen?: PhysicalSpecimen; instruments: InstrumentProfile[]; verifications: InstrumentVerification[]; series: MeasurementSeries[]; run: (operation: () => Promise<void>, success: string) => Promise<void> }) {
  const [feature, setFeature] = useState('diámetro exterior')
  const [readingsText, setReadingsText] = useState('10.00, 10.01, 10.00')
  const [instrumentId, setInstrumentId] = useState('')
  const create = (event: FormEvent) => { event.preventDefault(); if (!repository || !specimen) return; void run(async () => { const instrument = instruments.find(({ id }) => id === instrumentId) ?? instruments[0]; if (!instrument) throw new Error('Registra y selecciona un instrumento.'); const values = readingsText.split(/[,;\n]/u).map((value) => Number(value.trim())).filter(Number.isFinite); if (values.length === 0) throw new Error('Añade al menos una lectura.'); const timestamp = now(); const definition: MeasurementDefinition = { schemaVersion: 1, id: createMetrologyId('measurement-definition', [specimen.id, feature]), profileId, displayName: feature, target: { specimenId: specimen.id, feature: 'diameter', featureDescription: feature, datumIds: [], referenceFrame: 'plano A', orientation: 'plano A', scope: 'two-point' }, method: 'direct', preferredUnit: 'mm', instrumentType: instrument.type, procedure: ['Comprobar el instrumento.', 'Orientar la pieza en el plano A.', 'Registrar cada lectura sin sobrescribirla.'], requiredReadingCount: 3, environmentalRequirements: [], assumptions: [], limitations: [], createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }; const seriesId = createMetrologyId('measurement-series', [specimen.id, feature, timestamp]); const readings: MeasurementReading[] = values.map((value, index) => ({ schemaVersion: 1, id: createMetrologyId('measurement-reading', [seriesId, String(index + 1)]), profileId, specimenId: specimen.id, seriesId, sequence: index + 1, value: quantity(value, 'mm', 'measured'), capturedAt: timestamp, operator: 'Perfil local', orientation: 'plano A', conditions: {}, discarded: false, createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 })); const statisticsResult = resolveSeriesResult(readings, declareMeasurementUncertainty({ unit: 'mm', resolution: instrument.resolution, repeatability: readings.length > 1 ? quantity(Math.max(...values) - Math.min(...values), 'mm', 'measured') : undefined, assumptions: ['Componente de repetibilidad conservadora basada en el rango observado.'] }), 'Media aritmética de todas las lecturas no descartadas.'); const latestVerification = verifications.filter(({ instrumentId: id }) => id === instrument.id).toSorted((left, right) => right.performedAt.localeCompare(left.performedAt))[0]; const measurementSeries: MeasurementSeries = { schemaVersion: 1, id: seriesId, profileId, definitionId: definition.id, specimenId: specimen.id, instrumentId: instrument.id, ...(latestVerification ? { instrumentVerificationId: latestVerification.id } : {}), operator: 'Perfil local', startedAt: timestamp, completedAt: timestamp, orientation: 'plano A', conditions: {}, readingIds: readings.map(({ id }) => id), result: statisticsResult, status: 'complete', createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }; await repository.put('measurement_definitions', definition); for (const reading of readings) await repository.put('measurement_readings', reading); await repository.put('measurement_series', measurementSeries) }, 'Serie completa con lecturas originales e incertidumbre declarada.') }
  return <section className="metrology-measurement"><form onSubmit={create} className="metrology-form metrology-measurement-form"><span className="academy-kicker">SERIE FÍSICA</span><h2>Registrar lecturas sin perder ninguna</h2><label>Característica<input value={feature} onChange={(event) => setFeature(event.target.value)} /></label><label>Instrumento<select value={instrumentId} onChange={(event) => setInstrumentId(event.target.value)}><option value="">Seleccionar</option>{instruments.map((instrument) => <option value={instrument.id} key={instrument.id}>{instrument.displayName}</option>)}</select></label><label>Lecturas en mm<textarea value={readingsText} onChange={(event) => setReadingsText(event.target.value)} /></label><p>Separadas por coma. Una lectura atípica se conserva; para descartarla debe existir una decisión y un motivo explícitos.</p><button type="submit" disabled={!specimen}><Ruler size={15} />Calcular y guardar serie</button></form><div className="metrology-series-list">{series.map((item) => <article key={item.id}><header><strong>{item.result?.adoptedValue.value.toFixed(4)} {item.result?.adoptedValue.unit}</strong><span>{metrologySeriesStatusLabel(item.status)}</span></header><p>{item.result?.adoptionReason}</p><dl><div><dt>Lecturas</dt><dd>{item.result?.statistics.count}</dd></div><div><dt>Rango</dt><dd>{item.result?.statistics.range?.value.toFixed(4)} mm</dd></div><div><dt>Incertidumbre expandida</dt><dd>{item.result?.uncertainty?.expandedUncertainty.value.toFixed(4)} mm</dd></div><div><dt>Verificación</dt><dd>{item.instrumentVerificationId ? 'referenciada' : 'no declarada'}</dd></div></dl></article>)}</div></section>
}

function ComparisonPanel({ repository, profileId, specimen, series, comparisons, proposals, run }: { repository?: HorologyMetrologyRepository; profileId: string; specimen?: PhysicalSpecimen; series: MeasurementSeries[]; comparisons: NominalMeasuredComparison[]; proposals: GeometryCorrectionProposal[]; run: (operation: () => Promise<void>, success: string) => Promise<void> }) {
  const [nominal, setNominal] = useState('10.00')
  const [lower, setLower] = useState('9.98')
  const [upper, setUpper] = useState('10.02')
  const latest = series[0]
  const createComparison = () => { if (!repository || !specimen || !latest) return; const timestamp = now(); const comparison = compareNominalAndMeasured({ base: { schemaVersion: 1, id: createMetrologyId('comparison', [specimen.id, latest.id, timestamp]), profileId, specimenId: specimen.id, measurementSeriesId: latest.id, fixtureRevision: 'sin aplicar', reconstructionLevel: 'R2', fidelity: { geometry: 'G1', kinematics: 'K0', physics: 'P0' }, limitations: ['Comparación de una unidad; no generaliza al calibre.'], createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }, series: latest, nominal: { value: quantity(Number(nominal), 'mm', 'designed', 'user-declared-nominal'), sourceId: 'user-declared-nominal', sourceKind: 'design', tolerance: { lower: quantity(Number(lower), 'mm', 'designed'), upper: quantity(Number(upper), 'mm', 'designed') }, referenceFrame: latest.orientation, scope: 'característica declarada en la serie' } }); void run(() => repository.put('nominal_measured_comparisons', comparison), `Comparación guardada: ${metrologyComparisonLabel(comparison.interpretation)}.`) }
  const propose = (comparison: NominalMeasuredComparison) => { if (!repository || !specimen || !comparison.measured) return; const timestamp = now(); const proposal: GeometryCorrectionProposal = { schemaVersion: 1, id: createMetrologyId('geometry-proposal', [comparison.id, timestamp]), profileId, specimenId: specimen.id, fixtureId: 'fixture.pending-selection', fixtureVersion: 'unknown', fixtureEntityId: comparison.fixtureEntityId ?? 'entity.pending-selection', targetParameter: 'dimension.pending-selection', currentValue: comparison.nominal?.value, proposedValue: comparison.measured, delta: comparison.delta, measurementSeriesIds: comparison.measurementSeriesId ? [comparison.measurementSeriesId] : [], comparisonIds: [comparison.id], imageAnnotationIds: [], rationale: 'Candidato local generado desde una comparación explícita; requiere seleccionar el modelo didáctico, la pieza y el parámetro.', assumptions: [], limitations: ['No modifica el modelo didáctico ni el diseño asistido por ordenador.', 'No eleva automáticamente los niveles de fidelidad ni de reconstrucción.'], status: 'needs-more-evidence', validationEvidenceIds: [], createdAt: timestamp, updatedAt: timestamp, recordVersion: 1 }; void run(() => repository.put('geometry_correction_proposals', proposal), 'Propuesta creada sin modificar el modelo de referencia.') }
  const approve = (proposal: GeometryCorrectionProposal) => { if (!repository) return; const ready = proposal.status === 'needs-more-evidence' ? { ...proposal, status: 'ready-for-review' as const, updatedAt: now(), recordVersion: proposal.recordVersion + 1 } : proposal; const approved = transitionGeometryProposal(ready, 'approved', 'Revisión local explícita', 'Aprobada solo como parche candidato reversible'); const patch = createCandidatePatch(approved); void run(() => repository.put('geometry_correction_proposals', { ...approved, candidatePatch: patch }), 'Parche candidato aprobado; el modelo didáctico y el diseño asistido por ordenador siguen intactos.') }
  return <section className="metrology-comparison"><div className="metrology-form"><span className="academy-kicker">NOMINAL ↔ MEDIDO</span><h2>Comparación neutral</h2><label>Nominal (mm)<input value={nominal} onChange={(event) => setNominal(event.target.value)} /></label><label>Límite inferior<input value={lower} onChange={(event) => setLower(event.target.value)} /></label><label>Límite superior<input value={upper} onChange={(event) => setUpper(event.target.value)} /></label><button type="button" disabled={!latest} onClick={createComparison}><Scale size={15} />Comparar última serie</button><p>Una discrepancia aparente no declara una pieza defectuosa.</p></div><div className="metrology-comparison-list"><h2>Comparaciones</h2>{comparisons.map((comparison) => <article key={comparison.id} className={`is-${comparison.interpretation}`}><header><strong>{metrologyComparisonLabel(comparison.interpretation)}</strong><span>Δ {comparison.delta?.value.toFixed(4) ?? '—'} {comparison.delta?.unit}</span></header><p>{comparison.reasons.join(' ')}</p><small>{comparison.limitations.join(' ')}</small><button type="button" disabled={!comparison.measured} onClick={() => propose(comparison)}>Crear propuesta <ArrowRight size={14} /></button></article>)}<h2>Propuestas</h2>{proposals.map((proposal) => <article key={proposal.id}><header><strong>{metrologyProposalStatusLabel(proposal.status)}</strong><span>{metrologyTargetParameterLabel(proposal.targetParameter)}</span></header><p>{proposal.rationale}</p><small>{proposal.limitations.join(' ')}</small>{['needs-more-evidence', 'ready-for-review'].includes(proposal.status) && <button type="button" onClick={() => approve(proposal)}><ClipboardCheck size={14} />Aprobar parche candidato</button>}</article>)}</div></section>
}

export default MetrologySurface
