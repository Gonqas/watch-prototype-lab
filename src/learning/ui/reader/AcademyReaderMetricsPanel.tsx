import { Download, Trash2 } from 'lucide-react'
import { academyReaderEventsCsv, summarizeAcademyReaderEvents } from '../../academy/reader/academyReaderMetrics'
import { useAcademyLocalState } from '../../academy/useAcademyLocalState'

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function AcademyReaderMetricsPanel({ profileId }: { profileId?: string }) {
  const { state, actions } = useAcademyLocalState(profileId)
  const events = state?.readerEvents ?? []
  const summaries = summarizeAcademyReaderEvents(events)
  return (
    <section className="academy-reader-metrics-panel" aria-labelledby="academy-reader-metrics-title">
      <span className="academy-kicker">MÉTRICAS DEL LECTOR</span>
      <h2 id="academy-reader-metrics-title">Registro local para validación humana</h2>
      <p>Guarda hasta 2.500 eventos FIFO con IDs de lección, apartado y cue, modo, viewport, transición, duración aproximada y metadatos tipados. No guarda texto de notas, contenido, nombres, URLs externas ni envía datos por red.</p>
      <dl>
        <div><dt>Eventos</dt><dd>{events.length}</dd></div>
        <div><dt>Sesiones</dt><dd>{new Set(events.map(({ sessionId }) => sessionId)).size}</dd></div>
        <div><dt>Tipos observados</dt><dd>{summaries.length}</dd></div>
      </dl>
      <div className="academy-button-row">
        <button className="academy-button is-secondary" type="button" disabled={!events.length} onClick={() => downloadText(
          'watch-prototype-lab-reader-events.json',
          JSON.stringify({ format: 'wplab-reader-events', version: '0.14D', exportedAt: new Date().toISOString(), events }, null, 2),
          'application/json',
        )}><Download size={15} /> Exportar JSON</button>
        <button className="academy-button is-secondary" type="button" disabled={!events.length} onClick={() => downloadText(
          'watch-prototype-lab-reader-summary.csv', academyReaderEventsCsv(events), 'text/csv;charset=utf-8',
        )}><Download size={15} /> Exportar CSV resumen</button>
        <button className="academy-button is-secondary" type="button" disabled={!events.length} onClick={() => {
          if (window.confirm('¿Eliminar el registro local de eventos del lector? El progreso y las notas no se modificarán.')) actions.clearReaderEvents()
        }}><Trash2 size={15} /> Eliminar eventos</button>
      </div>
    </section>
  )
}
