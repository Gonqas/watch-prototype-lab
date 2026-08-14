import { ChevronRight } from 'lucide-react'
import { academyPathLocationForLesson } from '../../academy/path/academyLearnerPath'

export function AcademyPathBreadcrumbs({ lessonId }: { lessonId: string }) {
  const location = academyPathLocationForLesson(lessonId)
  if (!location) return null
  return (
    <nav className="academy-path-breadcrumbs" aria-label="Migas de la ruta principal">
      <a href={`#/learning/my-learning?stage=${encodeURIComponent(location.stage.stageId)}`}>{location.stage.shortTitle}</a>
      <ChevronRight size={14} aria-hidden="true" />
      <a href={`#/learning/my-learning?chapter=${encodeURIComponent(location.chapter.chapterId)}`}>{location.chapter.title}</a>
      <ChevronRight size={14} aria-hidden="true" />
      <span aria-current="page">Lección</span>
    </nav>
  )
}
