import { Download, ExternalLink, Play, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { AcademyUsabilityParticipantType, AcademyUsabilitySession, AcademyUsabilityTaskResult } from '../../academy/reader/academyReaderModel'
import { ACADEMY_USABILITY_TASKS, academyUsabilitySessionJson } from '../../academy/reader/academyUsabilityHarness'
import { useAcademyLocalState } from '../../academy/useAcademyLocalState'
import { useLearning } from '../LearningContext'
import './academy-usability-harness.css'

function defaultTaskResult(taskId: string): AcademyUsabilityTaskResult {
  return { taskId, success: 'pending', difficulty: 3, confidence: 3, comment: '', approximateSeconds: 0, backtrackCount: 0 }
}

function downloadSession(session: AcademyUsabilitySession) {
  const url = URL.createObjectURL(new Blob([academyUsabilitySessionJson(session)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `watch-prototype-lab-usability-${session.sessionId}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function AcademyUsabilityHarnessSurface() {
  const { snapshot } = useLearning()
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const [participantType, setParticipantType] = useState<AcademyUsabilityParticipantType>('owner')
  const existingActive = state?.usabilitySessions.find(({ status }) => status === 'active' || status === 'draft')
  const [working, setWorking] = useState<AcademyUsabilitySession | undefined>(existingActive)
  const begin = () => {
    const sessionId = `usability.0.14D.${crypto.randomUUID()}`
    const event = actions.recordReaderEvent({ sessionId, eventType: 'session-start', source: 'usability-harness', metadata: { participantType } })
    const session: AcademyUsabilitySession = {
      sessionId,
      startedAt: new Date().toISOString(),
      participantType,
      taskIds: ACADEMY_USABILITY_TASKS.map(([taskId]) => taskId),
      eventIds: [event.eventId],
      observations: '',
      status: 'active',
      taskResults: ACADEMY_USABILITY_TASKS.map(([taskId]) => defaultTaskResult(taskId)),
    }
    actions.saveUsabilitySession(session)
    setWorking(session)
  }
  const updateTask = (taskId: string, patch: Partial<AcademyUsabilityTaskResult>) => setWorking((current) => current ? {
    ...current,
    taskResults: current.taskResults.map((result) => result.taskId === taskId ? { ...result, ...patch } : result),
  } : current)
  const save = (status: AcademyUsabilitySession['status'] = working?.status ?? 'draft') => {
    if (!working) return
    const currentEventIds = state?.readerEvents.filter((event) => event.sessionId === working.sessionId).map(({ eventId }) => eventId) ?? []
    const session = { ...working, status, eventIds: [...new Set([...working.eventIds, ...currentEventIds])] }
    actions.saveUsabilitySession(session)
    setWorking(session)
  }
  const finish = () => {
    if (!working) return
    const endEvent = actions.recordReaderEvent({ sessionId: working.sessionId, eventType: 'session-end', source: 'usability-harness', completed: true, metadata: { tasks: working.taskResults.length } })
    const completed: AcademyUsabilitySession = { ...working, status: 'completed', finishedAt: new Date().toISOString(), eventIds: [...new Set([...working.eventIds, endEvent.eventId])] }
    actions.saveUsabilitySession(completed)
    setWorking(completed)
  }
  const discard = () => {
    if (!working || !window.confirm('¿Eliminar esta sesión de uso y sus eventos locales asociados?')) return
    actions.deleteUsabilitySession(working.sessionId)
    setWorking(undefined)
  }

  return (
    <main className="academy-usability-harness">
      <header><span>GESTIONAR · PRUEBA DE USO</span><h1>Sesión guiada 0.14D</h1><p>Registra observaciones locales de navegación y comprensión. Las respuestas no modifican progreso, mastery ni evaluaciones.</p></header>
      {!working ? <section className="academy-usability-harness__start"><h2>Iniciar una sesión</h2><label>Tipo de participante<select value={participantType} onChange={(event) => setParticipantType(event.target.value as AcademyUsabilityParticipantType)}><option value="owner">Propietario</option><option value="beginner">Principiante</option><option value="enthusiast">Aficionado</option><option value="watchmaker">Relojero</option></select></label><button className="academy-button is-primary" type="button" onClick={begin}><Play size={15} /> Iniciar las 12 tareas</button></section> : (
        <>
          <section className="academy-usability-harness__session"><strong>{working.status === 'completed' ? 'Sesión completada' : 'Sesión activa'}</strong><span>{working.participantType}</span><code>{working.sessionId}</code><span>Inicio: {working.startedAt}</span></section>
          <ol className="academy-usability-harness__tasks">{ACADEMY_USABILITY_TASKS.map(([taskId, title, href], index) => {
            const result = working.taskResults.find((item) => item.taskId === taskId) ?? defaultTaskResult(taskId)
            return <li key={taskId}><article><header><span>TAREA {index + 1}</span><h2>{title}</h2><a className="academy-button is-secondary" href={href}>Abrir destino <ExternalLink size={14} /></a></header><div className="academy-usability-harness__fields"><label>Resultado<select value={result.success} onChange={(event) => updateTask(taskId, { success: event.target.value as AcademyUsabilityTaskResult['success'] })}><option value="pending">Pendiente</option><option value="yes">Éxito</option><option value="partial">Parcial</option><option value="no">No completada</option></select></label><label>Dificultad (1–5)<input type="number" min="1" max="5" value={result.difficulty} onChange={(event) => updateTask(taskId, { difficulty: Number(event.target.value) as AcademyUsabilityTaskResult['difficulty'] })} /></label><label>Confianza (1–5)<input type="number" min="1" max="5" value={result.confidence} onChange={(event) => updateTask(taskId, { confidence: Number(event.target.value) as AcademyUsabilityTaskResult['confidence'] })} /></label><label>Tiempo aproximado (s)<input type="number" min="0" value={result.approximateSeconds} onChange={(event) => updateTask(taskId, { approximateSeconds: Number(event.target.value) })} /></label><label>Retrocesos<input type="number" min="0" value={result.backtrackCount} onChange={(event) => updateTask(taskId, { backtrackCount: Number(event.target.value) })} /></label><label className="is-wide">Comentario<textarea value={result.comment} onChange={(event) => updateTask(taskId, { comment: event.target.value })} placeholder="Qué ocurrió, sin datos personales…" /></label></div></article></li>
          })}</ol>
          <label className="academy-usability-harness__observations">Observaciones generales<textarea value={working.observations} onChange={(event) => setWorking({ ...working, observations: event.target.value })} /></label>
          <footer><button className="academy-button is-secondary" type="button" onClick={() => save()}><Save size={15} /> Guardar borrador</button><button className="academy-button is-primary" type="button" disabled={working.status === 'completed'} onClick={finish}>Finalizar sesión</button><button className="academy-button is-secondary" type="button" onClick={() => downloadSession(working)}><Download size={15} /> Exportar sesión</button><button className="academy-button is-secondary" type="button" onClick={discard}><Trash2 size={15} /> Eliminar sesión</button></footer>
        </>
      )}
      <aside><h2>Privacidad y alcance</h2><p>La sesión permanece en el perfil local. Registra resultados, tiempos aproximados, retrocesos, comentarios y los IDs de eventos asociados. No demuestra claridad humana por sí sola y no se sincroniza.</p></aside>
    </main>
  )
}
