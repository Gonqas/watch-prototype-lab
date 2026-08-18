import { ArrowRight, BookOpen, Clock3, RotateCcw, ShieldCheck, Wrench } from 'lucide-react'
import type { AcademyNextAction } from '../../academy/path/academyNextAction'

const actionLabels: Record<AcademyNextAction['type'], string> = {
  read: 'LEER',
  practice: 'PRACTICAR',
  demonstrate: 'DEMOSTRAR',
  review: 'REPASAR',
  'retention-content-missing': 'REPASO PENDIENTE',
  resume: 'RETOMAR',
  chapter: 'SIGUIENTE CAPÍTULO',
  'available-path-complete': 'COBERTURA DEL RECORRIDO',
}

export function AcademyNextActionCard({ action }: { action: AcademyNextAction }) {
  const Icon = action.type === 'resume' || action.type === 'review' || action.type === 'retention-content-missing'
    ? RotateCcw
    : action.type === 'practice'
      ? Wrench
      : action.type === 'demonstrate'
        ? ShieldCheck
        : BookOpen
  return (
    <article className="academy-path-next" aria-labelledby="academy-path-next-title" data-next-action-id={action.actionId}>
      <header>
        <span>{action.stageId ? `${action.stageTitle} · ${action.chapterTitle}` : action.stageTitle}</span>
        <strong><Icon size={16} /> {actionLabels[action.type]}</strong>
      </header>
      <h2 id="academy-path-next-title">{action.title}</h2>
      <p>{action.reason}</p>
      <dl>
        <div><dt>Ahora</dt><dd>{actionLabels[action.type].toLocaleLowerCase('es-ES')}</dd></div>
        {action.durationMinutes !== undefined && <div><dt>Duración real</dt><dd><Clock3 size={14} /> {action.durationMinutes} min</dd></div>}
        <div><dt>Contenido principal pendiente</dt><dd>{action.remainingCoreItems} {action.remainingCoreItems === 1 ? 'elemento' : 'elementos'}</dd></div>
        {action.plannedCurriculumItems !== undefined && <div><dt>Currículo planificado</dt><dd>{action.plannedCurriculumItems} {action.plannedCurriculumItems === 1 ? 'referencia' : 'referencias'}</dd></div>}
        <div><dt>Después</dt><dd>{action.after}</dd></div>
      </dl>
      <a className="academy-button is-primary" href={action.href}>{action.ctaLabel} <ArrowRight size={16} /></a>
      {action.secondaryAction && <a className="academy-path-next__secondary" href={action.secondaryAction.href}>{action.secondaryAction.ctaLabel}</a>}
    </article>
  )
}
