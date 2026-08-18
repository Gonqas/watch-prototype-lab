import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Contrast, Grid3X3, RotateCcw, Ruler, ScanSearch, ZoomIn, ZoomOut } from 'lucide-react'
import {
  measureImageAnnotation,
  nativeMetrologyObjectUrl,
  readWebMetrologyObjectUrl,
  type ContentAddressedObject,
  type ImageAnnotation,
  type ImageAnnotationKind,
  type ImageAsset,
  type ImageCalibration,
  type ImagePoint,
} from '../../core/horology-metrology'
import { isNativeApp } from '../../platform/native'
import { metrologyAnnotationKindLabel, metrologyAnnotationMethodLabel, metrologyAnnotationUnitLabel } from './metrologyUiLanguage'

const requiredPoints: Readonly<Record<ImageAnnotationKind, number>> = {
  distance: 2,
  'diameter-circle': 2,
  'diameter-three-point': 3,
  radius: 2,
  angle: 3,
  center: 2,
  area: 3,
  'tooth-count': 1,
  marker: 1,
  label: 1,
  region: 2,
}

function pointFromEvent(event: PointerEvent<SVGSVGElement>): ImagePoint {
  const matrix = event.currentTarget.getScreenCTM()
  if (!matrix) return { x: 0, y: 0 }
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
  return { x: point.x, y: point.y }
}

export function MetrologyImageWorkbench({
  image,
  original,
  thumbnail,
  calibration,
  annotations,
  onCreateCalibration,
  onCreateAnnotation,
}: {
  image?: ImageAsset
  original?: ContentAddressedObject
  thumbnail?: ContentAddressedObject
  calibration?: ImageCalibration
  annotations: ImageAnnotation[]
  onCreateCalibration: (pixelDistance: number, physicalDistance: number) => Promise<void>
  onCreateAnnotation: (kind: ImageAnnotationKind, points: ImagePoint[], value?: number, unit?: ImageAnnotation['unit']) => Promise<void>
}) {
  const [source, setSource] = useState<string>()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [invert, setInvert] = useState(false)
  const [grid, setGrid] = useState(true)
  const [tool, setTool] = useState<ImageAnnotationKind>('distance')
  const [pendingPoints, setPendingPoints] = useState<ImagePoint[]>([])
  const [physicalReference, setPhysicalReference] = useState('1')
  const sourceRef = useRef<string | undefined>(undefined)
  const displayObject = thumbnail ?? original

  useEffect(() => {
    let cancelled = false
    if (!displayObject) return
    void (async () => {
      const next = isNativeApp() ? nativeMetrologyObjectUrl(displayObject) : await readWebMetrologyObjectUrl(displayObject)
      if (cancelled) { if (next.startsWith('blob:')) URL.revokeObjectURL(next); return }
      if (sourceRef.current?.startsWith('blob:')) URL.revokeObjectURL(sourceRef.current)
      sourceRef.current = next
      setSource(next)
    })().catch(() => setSource(undefined))
    return () => { cancelled = true }
  }, [displayObject])

  useEffect(() => () => {
    if (sourceRef.current?.startsWith('blob:')) URL.revokeObjectURL(sourceRef.current)
  }, [])

  const complete = pendingPoints.length >= requiredPoints[tool]
  const currentValue = useMemo(() => measureImageAnnotation(tool, pendingPoints, calibration), [calibration, pendingPoints, tool])
  const addPoint = (point: ImagePoint) => {
    if (!image) return
    if (tool === 'tooth-count') setPendingPoints((current) => [...current, point].slice(-240))
    else setPendingPoints((current) => [...current, point].slice(-requiredPoints[tool]))
  }
  const nudgeLastPoint = (dx: number, dy: number) => setPendingPoints((current) => current.map((point, index) => index === current.length - 1 ? { x: point.x + dx, y: point.y + dy } : point))

  if (!image || !displayObject) return <div className="metrology-image-empty"><ScanSearch size={28} /><strong>Importa una fotografía</strong><span>El original permanecerá inmutable; las operaciones visuales son reversibles.</span></div>
  return (
    <section className="metrology-image-workbench" aria-label="Banco de inspección fotográfica">
      <header>
        <div><span className="academy-kicker">ORIGINAL INMUTABLE</span><strong>{displayObject.originalName}</strong><small>{image.pixelWidth} × {image.pixelHeight} px · {displayObject.sha256.slice(0, 12)}…</small></div>
        <div className="metrology-image-controls" aria-label="Controles de imagen">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.25, value - 0.25))} aria-label="Alejar"><ZoomOut size={16} /></button>
          <output>{Math.round(zoom * 100)}%</output>
          <button type="button" onClick={() => setZoom((value) => Math.min(6, value + 0.25))} aria-label="Acercar"><ZoomIn size={16} /></button>
          <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} aria-label="Girar 90 grados"><RotateCcw size={16} /></button>
          <button type="button" className={invert ? 'is-active' : undefined} onClick={() => setInvert((value) => !value)} aria-label="Invertir colores"><Contrast size={16} /></button>
          <button type="button" className={grid ? 'is-active' : undefined} onClick={() => setGrid((value) => !value)} aria-label="Mostrar cuadrícula"><Grid3X3 size={16} /></button>
        </div>
      </header>
      <div className="metrology-image-adjustments">
        <label>Brillo <input type="range" min="40" max="180" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} /></label>
        <label>Contraste <input type="range" min="40" max="220" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} /></label>
        <div className="metrology-pan-controls"><button type="button" onClick={() => setPan((value) => ({ ...value, y: value.y - 12 }))} aria-label="Desplazar arriba"><ArrowUp size={14} /></button><button type="button" onClick={() => setPan((value) => ({ ...value, x: value.x - 12 }))} aria-label="Desplazar izquierda"><ArrowLeft size={14} /></button><button type="button" onClick={() => setPan((value) => ({ ...value, x: value.x + 12 }))} aria-label="Desplazar derecha"><ArrowRight size={14} /></button><button type="button" onClick={() => setPan((value) => ({ ...value, y: value.y + 12 }))} aria-label="Desplazar abajo"><ArrowDown size={14} /></button></div>
      </div>
      <div className={`metrology-image-stage ${grid ? 'has-grid' : ''}`} tabIndex={0} onKeyDown={(event) => {
        const step = event.shiftKey ? 10 : 1
        if (event.key === 'ArrowLeft') nudgeLastPoint(-step, 0)
        if (event.key === 'ArrowRight') nudgeLastPoint(step, 0)
        if (event.key === 'ArrowUp') nudgeLastPoint(0, -step)
        if (event.key === 'ArrowDown') nudgeLastPoint(0, step)
      }}>
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`, filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 1 : 0})` }}>
          {source && <img src={source} alt="Fotografía de la unidad física seleccionada" draggable={false} />}
          <svg viewBox={`0 0 ${image.pixelWidth} ${image.pixelHeight}`} role="application" aria-label="Capa de anotación por coordenadas" onPointerDown={(event) => addPoint(pointFromEvent(event))}>
            {annotations.map((annotation) => <g key={annotation.id}>{annotation.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r={Math.max(2, image.pixelWidth / 300)} />)}{annotation.points.length >= 2 && <line x1={annotation.points[0].x} y1={annotation.points[0].y} x2={annotation.points[1].x} y2={annotation.points[1].y} />}</g>)}
            <g className="is-pending">{pendingPoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r={Math.max(3, image.pixelWidth / 240)} />)}{pendingPoints.length >= 2 && <line x1={pendingPoints[0].x} y1={pendingPoints[0].y} x2={pendingPoints[1].x} y2={pendingPoints[1].y} />}</g>
          </svg>
        </div>
      </div>
      <div className="metrology-tool-panel">
        <label>Herramienta<select value={tool} onChange={(event) => { setTool(event.target.value as ImageAnnotationKind); setPendingPoints([]) }}><option value="distance">Distancia</option><option value="diameter-circle">Diámetro por círculo</option><option value="diameter-three-point">Diámetro por tres puntos</option><option value="radius">Radio</option><option value="angle">Ángulo</option><option value="center">Centro</option><option value="area">Área aproximada</option><option value="tooth-count">Conteo manual de dientes</option><option value="marker">Marcador</option><option value="label">Etiqueta</option><option value="region">Región</option></select></label>
        <div><span>Puntos: {pendingPoints.length}{tool !== 'tooth-count' ? `/${requiredPoints[tool]}` : ''}</span><strong>{currentValue.value === undefined ? 'Traza sobre la imagen' : `${currentValue.value.toFixed(3)} ${metrologyAnnotationUnitLabel(currentValue.unit)}`}</strong></div>
        <button type="button" disabled={!complete} onClick={() => void onCreateAnnotation(tool, pendingPoints, currentValue.value, currentValue.unit).then(() => setPendingPoints([]))}><Ruler size={15} />Guardar anotación</button>
        <label>Referencia física (mm)<input inputMode="decimal" value={physicalReference} onChange={(event) => setPhysicalReference(event.target.value)} /></label>
        <button type="button" disabled={pendingPoints.length < 2 || !(Number(physicalReference) > 0)} onClick={() => void onCreateCalibration(Math.hypot(pendingPoints[1].x - pendingPoints[0].x, pendingPoints[1].y - pendingPoints[0].y), Number(physicalReference))}>Calibrar escala 2D</button>
      </div>
      <details className="metrology-annotation-table" open><summary>Anotaciones guardadas ({annotations.length})</summary><table><thead><tr><th>Tipo</th><th>Valor</th><th>Método</th></tr></thead><tbody>{annotations.map((annotation) => <tr key={annotation.id}><td>{metrologyAnnotationKindLabel(annotation.kind)}</td><td>{annotation.value === undefined ? '—' : `${annotation.value.toFixed(3)} ${metrologyAnnotationUnitLabel(annotation.unit)}`}</td><td>{metrologyAnnotationMethodLabel(annotation.method)}</td></tr>)}</tbody></table></details>
    </section>
  )
}
