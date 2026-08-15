import type { AcademyDiagramData, AcademyVisualCue } from '../../academy/reader/academyReaderModel'

interface Point { x: number; y: number }

function coordinates(data: AcademyDiagramData): Map<string, Point> {
  const hasExplicitLane = data.nodes.some(({ lane }) => Boolean(lane))
  const lanes = hasExplicitLane ? [...new Set(data.nodes.map(({ lane }) => lane ?? 'general'))] : []
  if (lanes.length > 0) {
    const points = new Map<string, Point>()
    for (const [laneIndex, lane] of lanes.entries()) {
      const laneNodes = data.nodes.filter((item) => (item.lane ?? 'general') === lane)
      laneNodes.forEach((item, index) => points.set(item.id, {
        x: laneNodes.length === 1 ? 320 : 110 + index * (440 / (laneNodes.length - 1)),
        y: lanes.length === 1 ? 150 : 54 + laneIndex * (212 / Math.max(1, lanes.length - 1)),
      }))
    }
    return points
  }
  const columns = data.nodes.length <= 4 ? data.nodes.length : data.nodes.length <= 8 ? 4 : 5
  const rows = Math.ceil(data.nodes.length / Math.max(1, columns))
  return new Map(data.nodes.map((item, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    return [item.id, {
      x: 80 + column * (480 / Math.max(1, columns - 1)),
      y: 72 + row * (160 / Math.max(1, rows - 1)),
    }]
  }))
}

function lines(label: string): [string, string?] {
  if (label.length <= 22) return [label]
  const words = label.split(' ')
  let first = ''
  while (words.length && `${first} ${words[0]}`.trim().length <= 21) first = `${first} ${words.shift()}`.trim()
  return [first || label.slice(0, 21), words.join(' ') || undefined]
}

export function AcademySpecificDiagram({ cue }: { cue: AcademyVisualCue }) {
  const data = cue.diagramData
  if (!data) return null
  const points = coordinates(data)
  const markerId = `${cue.cueId.replace(/[^a-z0-9_-]/gi, '-')}-arrow`
  const phaseY = data.phases?.length ? 278 : 0
  return (
    <svg className="academy-reader-diagram is-content-specific" viewBox="0 0 640 320" role="img" aria-labelledby={`${markerId}-title ${markerId}-desc`}>
      <title id={`${markerId}-title`}>{data.title}</title>
      <desc id={`${markerId}-desc`}>{cue.altText}</desc>
      <defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker></defs>
      {data.edges.map((item, index) => {
        const from = points.get(item.from)
        const to = points.get(item.to)
        if (!from || !to) return null
        const middleX = (from.x + to.x) / 2
        const middleY = (from.y + to.y) / 2
        const reverseIndex = data.edges.findIndex((candidate) => candidate.from === item.to && candidate.to === item.from)
        const reciprocal = reverseIndex >= 0
        const deltaX = to.x - from.x
        const deltaY = to.y - from.y
        const length = Math.max(1, Math.hypot(deltaX, deltaY))
        const normalX = -deltaY / length
        const normalY = deltaX / length
        const controlX = middleX + normalX * 45
        const controlY = middleY + normalY * 45
        const labelX = reciprocal ? middleX + normalX * 30 : middleX
        const labelY = reciprocal ? middleY + normalY * 30 : middleY - 7
        return (
          <g className={`academy-reader-diagram__edge is-${item.kind ?? 'mechanical'}`} key={`${item.from}-${item.to}-${index}`}>
            {reciprocal
              ? <path d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`} markerEnd={`url(#${markerId})`} />
              : <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd={`url(#${markerId})`} />}
            {item.label && <text x={labelX} y={labelY}>{item.label}</text>}
          </g>
        )
      })}
      {data.nodes.map((item) => {
        const point = points.get(item.id)!
        const [first, second] = lines(item.label)
        return (
          <g className={`academy-reader-diagram__semantic-node is-${item.emphasis ?? 'normal'}`} transform={`translate(${point.x} ${point.y})`} key={item.id}>
            <rect x="-58" y="-29" width="116" height="58" rx="14" />
            <text y={second ? -3 : 4}><tspan x="0">{first}</tspan>{second && <tspan x="0" dy="17">{second}</tspan>}</text>
          </g>
        )
      })}
      {data.phases?.length ? (
        <g className="academy-reader-diagram__phases" transform={`translate(0 ${phaseY})`}>
          {data.phases.map((phase, index) => {
            const width = 560 / data.phases!.length
            return <g transform={`translate(${40 + index * width} 0)`} key={phase.id}><rect width={width - 6} height="30" rx="8" /><text x={(width - 6) / 2} y="20">{index + 1}. {phase.label}</text></g>
          })}
        </g>
      ) : null}
      {data.formula && <text className="academy-reader-diagram__formula" x="320" y="298">{data.formula}</text>}
    </svg>
  )
}
