import { ArrowRight, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { academyRouteProgress, realAcademyRoutes } from '../../academy/academyCatalog'
import { ACADEMY_LIBRARY_ROUTE_GROUPS } from '../../academy/path/academyLibrary'
import { localize } from '../../application/i18n'
import { useLearning } from '../LearningContext'

export function AcademyLibrarySurface() {
  const { service, snapshot } = useLearning()
  const [query, setQuery] = useState(snapshot.location.query.q ?? '')
  const normalizedQuery = query.trim().toLocaleLowerCase('es-ES')
  const routes = realAcademyRoutes(snapshot.product)
  const routeById = new Map(routes.map((route) => [route.id, route]))
  const visibleGroups = ACADEMY_LIBRARY_ROUTE_GROUPS.map((group) => ({
    ...group,
    routes: group.routeIds.flatMap((routeId) => {
      const route = routeById.get(routeId)
      if (!route) return []
      const haystack = `${localize(snapshot.profile?.locale, route.title)} ${localize(snapshot.profile?.locale, route.purpose)} ${route.id} ${route.movementIds.join(' ')}`.toLocaleLowerCase('es-ES')
      return !normalizedQuery || haystack.includes(normalizedQuery) ? [route] : []
    }),
  })).filter(({ routes: groupRoutes }) => groupRoutes.length > 0)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    service.navigate({ surface: 'explore', query: query.trim() ? { q: query.trim() } : {} }, true)
  }
  return (
    <div className="academy-page academy-library-surface">
      <header className="academy-page-header"><div><span className="academy-kicker">BIBLIOTECA</span><h1>Las 24 rutas, agrupadas por función</h1><p>La ruta principal decide qué toca ahora. Aquí puedes localizar especializaciones, ampliaciones, casos y referencias sin alterar su progreso.</p></div></header>
      <form className="academy-library-search" role="search" onSubmit={submit}>
        <Search size={17} />
        <label className="sr-only" htmlFor="academy-library-search">Buscar en las rutas</label>
        <input id="academy-library-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ruta, calibre o tema" />
        <button type="submit">Buscar</button>
      </form>
      <div className="academy-library-route-groups">
        {visibleGroups.map((group) => (
          <section key={group.groupId}>
            <header><div><span>{group.title.toLocaleUpperCase('es-ES')}</span><h2>{group.title}</h2><p>{group.description}</p></div><strong>{group.routes.length} {group.routes.length === 1 ? 'ruta' : 'rutas'}</strong></header>
            <div>
              {group.routes.map((route) => {
                const progress = academyRouteProgress(snapshot, route.id)
                return (
                  <article key={route.id}>
                    <div><h3>{localize(snapshot.profile?.locale, route.title)}</h3><p>{localize(snapshot.profile?.locale, route.purpose)}</p></div>
                    <small>{progress.completedActivities}/{progress.totalActivities} prácticas históricas · {route.moduleIds.length} módulos</small>
                    <a href={`#/learning/route/${encodeURIComponent(route.id)}`}>Abrir ruta <ArrowRight size={15} /></a>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      {visibleGroups.length === 0 && <section className="academy-empty-state"><Search size={26} /><div><h2>No hay rutas con ese término</h2><p>Prueba con un calibre, función o palabra más general.</p></div></section>}
    </div>
  )
}
