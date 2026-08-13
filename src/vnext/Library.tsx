import { useEffect } from 'react'
import { BookOpenCheck, Box, Clock3, CopyPlus, Database, Disc3, ExternalLink, FileText, FolderOpen, Microscope, PackagePlus, Save, ShieldCheck, Trash2, Wrench, Zap } from 'lucide-react'
import { PROJECT_TEMPLATES } from './presets'
import { MIYOTA_OFFICIAL_MOVEMENTS } from './miyotaCatalog'
import { analyzeComponentCompatibility, mechanicalComponentLabels } from '../core/componentCompatibility'
import { openRegisteredExternalSource } from '../platform/externalSources'
import { useStudioStore } from './store'

async function openOfficialSource(url: string): Promise<void> {
  await openRegisteredExternalSource(url, 'miyota-official')
}

export function StudioLibrary() {
  const project = useStudioStore((state) => state.project)
  const savedProjects = useStudioStore((state) => state.savedProjects)
  const savedParts = useStudioStore((state) => state.savedParts)
  const nativeInfo = useStudioStore((state) => state.nativeInfo)
  const nativeProjects = useStudioStore((state) => state.nativeProjects)
  const refreshNativeLibrary = useStudioStore((state) => state.refreshNativeLibrary)
  const loadNativeSavedProject = useStudioStore((state) => state.loadNativeSavedProject)
  const deleteNativeSavedProject = useStudioStore((state) => state.deleteNativeSavedProject)
  const loadTemplate = useStudioStore((state) => state.loadTemplate)
  const saveToLibrary = useStudioStore((state) => state.saveToLibrary)
  const saveSelectedPartToLibrary = useStudioStore((state) => state.saveSelectedPartToLibrary)
  const applySavedPart = useStudioStore((state) => state.applySavedPart)
  const deleteSavedPart = useStudioStore((state) => state.deleteSavedPart)
  const loadSavedProject = useStudioStore((state) => state.loadSavedProject)
  const deleteSavedProject = useStudioStore((state) => state.deleteSavedProject)
  const setWorkspace = useStudioStore((state) => state.setWorkspace)

  useEffect(() => {
    if (nativeInfo) void refreshNativeLibrary()
  }, [nativeInfo, refreshNativeLibrary])

  const projectCount = nativeInfo ? nativeProjects.length : savedProjects.length
  return (
    <main className="library-workspace">
      <header className="library-header">
        <div>
          <span>{nativeInfo ? 'Biblioteca local SQLite' : 'Biblioteca del navegador'}</span>
          <h1>Proyectos y bases de estudio</h1>
        </div>
        <button type="button" className="primary-action" onClick={saveToLibrary}><Save size={16} />Guardar proyecto actual</button>
      </header>

      <section className="library-band">
        <div className="library-band__heading"><h2>Bases de ingeniería</h2><span>{PROJECT_TEMPLATES.length}</span></div>
        <div className="template-grid">
          {PROJECT_TEMPLATES.map((template) => {
            const mechanical = template.id.includes('mechanical')
            const Icon = mechanical ? Clock3 : Zap
            return (
              <article className="template-card" key={template.id}>
                <div className={`template-visual template-visual--${template.id}`}><Icon size={24} /><Disc3 size={54} strokeWidth={1.1} /></div>
                <div className="template-card__body"><span>{template.quality}</span><h3>{template.name}</h3><p>{template.description}</p></div>
                <button
                  type="button"
                  aria-label={`Abrir base ${template.name}`}
                  onClick={() => { loadTemplate(template.id); setWorkspace(mechanical ? 'movement' : 'assembly') }}
                >
                  <FolderOpen size={15} />Abrir base
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="library-band">
        <div className="library-band__heading">
          <div><h2>Unidades físicas vinculadas</h2><small>Registro metrológico privado y separado del proyecto técnico</small></div>
          <Microscope size={22} />
        </div>
        <div className="library-empty">
          <Microscope size={24} />
          <span>Crea, consulta o mide unidades físicas relacionadas con «{project.name}» sin modificar este proyecto.</span>
          <a className="primary-action" href={`#/learning/metrology?project=${encodeURIComponent(project.id)}`}>Abrir unidades físicas</a>
        </div>
      </section>

      <section className="library-band">
        <div className="library-band__heading">
          <div><h2>Catálogo oficial MIYOTA</h2><small>Ficha, plano, manual y despiece enlazados a su fuente; verificados el 15/07/2026</small></div>
          <div className="official-source-legend"><ShieldCheck size={15} /><span>Dato oficial ≠ compatibilidad confirmada</span></div>
        </div>
        <div className="official-source-grid">
          {MIYOTA_OFFICIAL_MOVEMENTS.map((reference) => {
            const documents = Object.entries(reference.documents).filter((entry): entry is [string, string] => Boolean(entry[1]))
            return (
              <article className="official-source-card" key={reference.calibre}>
                <header>
                  <div className="official-source-card__mark"><BookOpenCheck size={18} /></div>
                  <div><span>{reference.family}</span><h3>MIYOTA {reference.calibre}</h3></div>
                  <b>{reference.mechanism === 'mechanical' ? 'Mecánico' : 'Cuarzo'}</b>
                </header>
                <dl>
                  <div><dt>Tamaño</dt><dd>{reference.diameterMm ? `Ø ${reference.diameterMm.toFixed(2)} mm` : `${reference.widthMm} × ${reference.lengthMm} mm`}</dd></div>
                  <div><dt>Altura</dt><dd>{reference.heightMm.toFixed(2)} mm</dd></div>
                  <div><dt>Precisión</dt><dd>{reference.accuracy}</dd></div>
                  <div><dt>Documentos</dt><dd>{documents.length || 'en ficha'}</dd></div>
                </dl>
                <p>{reference.functions.join(' · ')}</p>
                <div className="official-source-card__documents">
                  {documents.map(([kind, url]) => (
                    <button type="button" key={kind} title={`Abrir ${kind}`} onClick={() => void openOfficialSource(url)}>
                      <FileText size={14} /><span>{kind === 'specification' ? 'Ficha' : kind === 'drawing' ? 'Plano' : kind === 'instruction' ? 'Manual' : 'Despiece'}</span>
                    </button>
                  ))}
                </div>
                <footer>
                  <button type="button" onClick={() => void openOfficialSource(reference.productUrl)}><ExternalLink size={14} />Fuente oficial</button>
                  <button type="button" className="primary-action" onClick={() => { loadTemplate(reference.studyTemplateId); setWorkspace(reference.mechanism === 'mechanical' ? 'movement' : 'assembly') }}><FolderOpen size={14} />Abrir estudio</button>
                </footer>
              </article>
            )
          })}
        </div>
      </section>

      <section className="library-band">
        <div className="library-band__heading">
          <div><h2>Biblioteca de piezas</h2><small>Cotas, tolerancias y procedencia reutilizables</small></div>
          <div className="library-band__actions"><span>{savedParts.length}</span><button type="button" onClick={saveSelectedPartToLibrary}><PackagePlus size={15} />Guardar pieza activa</button></div>
        </div>
        {savedParts.length === 0 ? (
          <div className="library-empty"><Wrench size={24} /><span>Aun no hay piezas propias</span><button type="button" onClick={saveSelectedPartToLibrary}><PackagePlus size={15} />Guardar la pieza seleccionada</button></div>
        ) : (
          <div className="saved-grid saved-grid--parts">
            {savedParts.map((preset) => {
              const compatibility = preset.kind === 'movement-component' ? analyzeComponentCompatibility(project, preset) : null
              return <article className="saved-card saved-card--part" key={preset.id}>
                <div className="saved-card__icon"><Wrench size={20} /></div>
                <div><span>{preset.kind === 'case' ? 'Caja' : preset.kind === 'dial' ? 'Dial' : preset.kind === 'crystal' ? 'Cristal' : preset.kind === 'hands' ? 'Agujas' : preset.kind === 'movement-component' ? mechanicalComponentLabels[preset.componentType] : 'Movimiento'}{compatibility ? ` · ${compatibility.score}/100` : ''}</span><h3>{preset.name}</h3><small>{preset.sourceProjectName}{compatibility ? ` · ${compatibility.state}` : ''}</small></div>
                <div className="saved-card__actions">
                  <button type="button" aria-label={`Aplicar ${preset.name}`} onClick={() => applySavedPart(preset.id)}><CopyPlus size={15} /></button>
                  <button type="button" aria-label={`Eliminar pieza ${preset.name}`} onClick={() => deleteSavedPart(preset.id)}><Trash2 size={15} /></button>
                </div>
              </article>
            })}
          </div>
        )}
      </section>

      <section className="library-band">
        <div className="library-band__heading"><h2>Mis proyectos</h2><span>{projectCount}</span></div>
        {projectCount === 0 ? (
          <div className="library-empty"><Box size={24} /><span>{project.name}</span><button type="button" onClick={saveToLibrary}><CopyPlus size={15} />Añadir a biblioteca</button></div>
        ) : nativeInfo ? (
          <div className="saved-grid">
            {nativeProjects.map((saved) => (
              <article className="saved-card" key={saved.id}>
                <div className="saved-card__icon"><Database size={21} /></div>
                <div><span>{saved.movement}</span><h3>{saved.name}</h3><small>{new Date(saved.modifiedAt).toLocaleString('es-ES')}</small></div>
                <div className="saved-card__actions">
                  <button type="button" aria-label={`Abrir ${saved.name}`} onClick={() => void loadNativeSavedProject(saved.id)}><FolderOpen size={15} /></button>
                  <button type="button" aria-label={`Eliminar ${saved.name}`} onClick={() => void deleteNativeSavedProject(saved.id)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="saved-grid">
            {savedProjects.map((saved) => (
              <article className="saved-card" key={saved.id}>
                <div className="saved-card__icon">{saved.movement.kind === 'mechanical' ? <Clock3 size={22} /> : <Zap size={22} />}</div>
                <div><span>{saved.movement.name}</span><h3>{saved.name}</h3><small>{new Date(saved.modifiedAt).toLocaleString('es-ES')}</small></div>
                <div className="saved-card__actions">
                  <button type="button" aria-label={`Abrir ${saved.name}`} onClick={() => { loadSavedProject(saved.id); setWorkspace('assembly') }}><FolderOpen size={15} /></button>
                  <button type="button" aria-label={`Eliminar ${saved.name}`} onClick={() => deleteSavedProject(saved.id)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
