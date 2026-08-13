import { useMemo, useState } from 'react'
import { ArrowRight, BookOpenCheck, GitBranch, ListTree, Search, Share2 } from 'lucide-react'
import { projectConceptKnowledge } from '../academy/academyPedagogy'
import { useAcademyLocalState } from '../academy/useAcademyLocalState'
import { localize } from '../application/i18n'
import type { LearningKnowledgeNode } from '../product/demoPackage'
import { useLearning } from './LearningContext'

type MapMode = 'graph' | 'list'

function dependencyDepth(
  node: LearningKnowledgeNode,
  byId: Map<string, LearningKnowledgeNode>,
  memo: Map<string, number>,
  visiting = new Set<string>(),
): number {
  const cached = memo.get(node.id)
  if (cached !== undefined) return cached
  if (visiting.has(node.id)) return 0
  visiting.add(node.id)
  const depth = node.prerequisiteIds.length === 0
    ? 0
    : 1 + Math.max(0, ...node.prerequisiteIds.map((id) => {
      const prerequisite = byId.get(id)
      return prerequisite ? dependencyDepth(prerequisite, byId, memo, visiting) : 0
    }))
  visiting.delete(node.id)
  memo.set(node.id, depth)
  return depth
}

export function LearningMapSurface() {
  const { snapshot } = useLearning()
  const { state } = useAcademyLocalState(snapshot.profile?.id)
  const [mode, setMode] = useState<MapMode>('graph')
  const [search, setSearch] = useState('')
  const [routeId, setRouteId] = useState('route.horology.orientation')
  const locale = snapshot.profile?.locale
  const routes = snapshot.product.routes.filter(({ demo }) => !demo)
  const nodes = useMemo(() => snapshot.product.knowledgeNodes.filter((node) => {
    const haystack = [
      localize(locale, node.title),
      localize(locale, node.summary),
      node.plainLanguage ? localize(locale, node.plainLanguage) : '',
      node.technicalLanguage ? localize(locale, node.technicalLanguage) : '',
      node.subsystem,
    ].join(' ').toLowerCase()
    return (!routeId || node.routeIds.includes(routeId))
      && (!search || haystack.includes(search.toLowerCase()))
  }), [locale, routeId, search, snapshot.product.knowledgeNodes])
  const columns = useMemo(() => {
    const allById = new Map(snapshot.product.knowledgeNodes.map((node) => [node.id, node]))
    const depthMemo = new Map<string, number>()
    const grouped = new Map<number, LearningKnowledgeNode[]>()
    for (const node of nodes) {
      const depth = dependencyDepth(node, allById, depthMemo)
      grouped.set(depth, [...(grouped.get(depth) ?? []), node])
    }
    return [...grouped.entries()]
      .sort(([left], [right]) => left - right)
      .map(([depth, values]) => ({
        depth,
        nodes: values.sort((left, right) => localize(locale, left.title).localeCompare(localize(locale, right.title), locale)),
      }))
  }, [locale, nodes, snapshot.product.knowledgeNodes])
  const projectionFor = (node: LearningKnowledgeNode) =>
    projectConceptKnowledge(snapshot, node, state?.onboarding)

  const conceptBody = (node: LearningKnowledgeNode) => {
    const projection = projectionFor(node)
    const prerequisites = node.prerequisiteIds.flatMap((id) => {
      const prerequisite = snapshot.product.knowledgeNodes.find((candidate) => candidate.id === id)
      return prerequisite ? [localize(locale, prerequisite.title)] : []
    })
    return (
      <>
        <div className="learning-knowledge-card__heading">
          <span className={`learning-concept-status is-${projection.status}`}>{projection.label}</span>
          <small>{node.kind === 'skill' ? 'Destreza' : node.kind === 'subsystem' ? 'Subsistema' : 'Concepto'}</small>
        </div>
        <h2>{localize(locale, node.title)}</h2>
        <p>{localize(locale, node.plainLanguage ?? node.summary)}</p>
        <details>
          <summary>Definición precisa y cómo comprobar que lo entiendes</summary>
          <p>{localize(locale, node.technicalLanguage ?? node.summary)}</p>
          {node.whyItMatters && <p><strong>Por qué importa:</strong> {localize(locale, node.whyItMatters)}</p>}
          <ul>{node.observableActions.map((action) => <li key={action.es}>{localize(locale, action)}</li>)}</ul>
          <p><strong>Cómo se ha calculado tu progreso:</strong> {projection.explanation}</p>
        </details>
        <dl>
          <div><dt>Necesita antes</dt><dd>{prerequisites.join(', ') || 'Nada: puedes empezar aquí'}</dd></div>
          <div><dt>Área</dt><dd>{node.subsystem.replaceAll('-', ' ')}</dd></div>
        </dl>
        <div className="learning-knowledge-card__actions">
          {node.bridgeLessonId && <a href={`#/learning/lesson/${encodeURIComponent(node.bridgeLessonId)}`}><BookOpenCheck size={14} /> Aprender la base</a>}
          {node.activityIds.slice(0, 1).map((id) => <a key={id} href={`#/learning/activity/${encodeURIComponent(id)}`}>Practicar <ArrowRight size={14} /></a>)}
        </div>
      </>
    )
  }

  return (
    <>
      <header className="learning-page-header">
        <div>
          <span className="learning-eyebrow">MAPA DE CONOCIMIENTO</span>
          <h1>Qué aprender, en qué orden y cómo demostrarlo</h1>
          <p>Lo que recuerdas, lo que estás practicando y lo que ya has demostrado aparecen por separado. Si falta una base, verás dónde estudiarla.</p>
        </div>
        <div className="learning-map-switch" role="group" aria-label="Representación del mapa">
          <button type="button" className={mode === 'graph' ? 'is-active' : undefined} aria-pressed={mode === 'graph'} onClick={() => setMode('graph')}><Share2 size={15} />Dependencias</button>
          <button type="button" className={mode === 'list' ? 'is-active' : undefined} aria-pressed={mode === 'list'} onClick={() => setMode('list')}><ListTree size={15} />Lista accesible</button>
        </div>
      </header>
      <div className="learning-map-toolbar">
        <label><Search size={16} /><span className="sr-only">Buscar conceptos</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Concepto, función o término" /></label>
        <label>
          <span>Ruta</span>
          <select value={routeId} onChange={(event) => setRouteId(event.target.value)}>
            <option value="">Todas las rutas</option>
            {routes.map((route) => <option value={route.id} key={route.id}>{localize(locale, route.title)}</option>)}
          </select>
        </label>
      </div>
      <div className="learning-map-legend" aria-label="Leyenda">
        <span><i className="is-available" />Disponible</span>
        <span><i className="is-self-declared" />Familiaridad declarada</span>
        <span><i className="is-practising" />En práctica</span>
        <span><i className="is-demonstrated" />Demostrado</span>
        <span><i className="is-blocked" />Base pendiente</span>
      </div>
      {mode === 'graph' ? (
        <section className="learning-dependency-map" aria-label="Conceptos ordenados por profundidad de prerrequisitos">
          {columns.map((column) => (
            <section key={column.depth}>
              <header><span>{column.depth + 1}</span><div><strong>{column.depth === 0 ? 'Base' : `Nivel ${column.depth + 1}`}</strong><small>{column.nodes.length} {column.nodes.length === 1 ? 'concepto' : 'conceptos'}</small></div></header>
              <div>
                {column.nodes.map((node) => {
                  const projection = projectionFor(node)
                  return <article className={`learning-knowledge-card is-${projection.status}`} key={node.id}>{conceptBody(node)}</article>
                })}
              </div>
            </section>
          ))}
        </section>
      ) : (
        <section className="learning-knowledge-list" aria-label="Lista jerárquica del mapa de conocimiento">
          <ol>
            {columns.flatMap(({ nodes: items }) => items).map((node) => (
              <li key={node.id}>
                <div className="learning-knowledge-list__index"><GitBranch size={17} /></div>
                <div className="learning-knowledge-card">{conceptBody(node)}</div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {nodes.length === 0 && (
        <section className="learning-map-empty">
          <Search size={22} />
          <h2>No hay conceptos con este filtro</h2>
          <p>Prueba otra ruta o busca una función más general.</p>
        </section>
      )}
    </>
  )
}

export default LearningMapSurface
