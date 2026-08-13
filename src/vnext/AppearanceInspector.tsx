import { InspectorSection, NumberField, Segmented, Toggle, ColorSwatches } from './Controls'
import type { SurfaceAppearance, WatchPartId } from './model'
import { useStudioStore } from './store'

const metalColors = ['#c7cccf', '#8f979b', '#202426', '#d2b46c', '#b76e52', '#efe7d2']
const dialColors = ['#0d1112', '#173c35', '#183150', '#5a1f26', '#e9e3d5', '#b7a47c']
const strapColors = ['#1b1714', '#3b2418', '#76513b', '#17352f', '#202832', '#9b8262']

type SurfaceKey = 'caseSurface' | 'bezelSurface' | 'dialSurface' | 'handsSurface' | 'strapSurface'

function surfaceForPart(part: WatchPartId): { key: SurfaceKey; label: string; colors: string[] } {
  if (part === 'dial' || part === 'dialGraphics' || part === 'rehaut') return { key: 'dialSurface', label: 'Dial', colors: dialColors }
  if (part === 'hourHand' || part === 'minuteHand' || part === 'secondHand') return { key: 'handsSurface', label: 'Agujas', colors: metalColors }
  if (part === 'strap') return { key: 'strapSurface', label: 'Correa', colors: strapColors }
  if (part === 'bezel') return { key: 'bezelSurface', label: 'Bisel', colors: metalColors }
  return { key: 'caseSurface', label: 'Caja', colors: metalColors }
}

function SurfaceEditor({ part }: { part: WatchPartId }) {
  const presentation = useStudioStore((state) => state.project.presentation)
  const updateSurface = useStudioStore((state) => state.updateSurface)
  const descriptor = surfaceForPart(part)
  const surface: SurfaceAppearance = presentation[descriptor.key]
  return (
    <InspectorSection title={`Material · ${descriptor.label}`}>
      <label className="select-field"><span>Material</span><select value={surface.material} onChange={(event) => updateSurface(descriptor.key, 'material', event.target.value)}>
        <option value="stainless-steel">Acero inoxidable</option><option value="titanium">Titanio</option><option value="black-pvd">PVD negro</option><option value="yellow-gold">Oro amarillo</option><option value="rose-gold">Oro rosa</option><option value="brass">Laton</option><option value="ceramic">Ceramica</option><option value="leather">Piel</option><option value="rubber">Caucho</option><option value="fabric">Tejido</option>
      </select></label>
      <label className="select-field"><span>Acabado</span><select value={surface.finish} onChange={(event) => updateSurface(descriptor.key, 'finish', event.target.value)}>
        <option value="polished">Pulido espejo</option><option value="brushed-horizontal">Cepillado horizontal</option><option value="brushed-vertical">Cepillado vertical</option><option value="brushed-radial">Cepillado radial</option><option value="bead-blasted">Microgranallado</option><option value="matte">Mate</option><option value="sunburst">Soleil</option><option value="stone">Piedra</option>
      </select></label>
      <ColorSwatches label="Color base" value={surface.color} colors={descriptor.colors} onChange={(value) => updateSurface(descriptor.key, 'color', value)} />
      <label className="appearance-range"><span>Rugosidad <b>{surface.roughness.toFixed(2)}</b></span><input type="range" min="0.02" max="1" step="0.01" value={surface.roughness} onChange={(event) => updateSurface(descriptor.key, 'roughness', Number(event.target.value))} /></label>
      <label className="appearance-range"><span>Metal <b>{surface.metalness.toFixed(2)}</b></span><input type="range" min="0" max="1" step="0.01" value={surface.metalness} onChange={(event) => updateSurface(descriptor.key, 'metalness', Number(event.target.value))} /></label>
      <label className="appearance-range"><span>Microarañado <b>{surface.microScratches.toFixed(2)}</b></span><input type="range" min="0" max="1" step="0.01" value={surface.microScratches} onChange={(event) => updateSurface(descriptor.key, 'microScratches', Number(event.target.value))} /></label>
    </InspectorSection>
  )
}

function ExteriorGeometry({ part }: { part: WatchPartId }) {
  const exterior = useStudioStore((state) => state.project.exterior)
  const update = useStudioStore((state) => state.updateExteriorDimension)
  const setValue = useStudioStore((state) => state.setExteriorValue)
  if (part === 'bezel') return <InspectorSection title="Geometria de bisel"><Toggle label="Bisel visible" checked={exterior.bezel.enabled} onChange={(value) => setValue('bezel', 'enabled', value)} /><NumberField label="Diametro exterior" dimension={exterior.bezel.outerDiameter} min={20} max={65} step={0.05} onChange={(value) => update('bezel', 'outerDiameter', value)} /><NumberField label="Apertura" dimension={exterior.bezel.innerDiameter} min={15} max={60} step={0.05} onChange={(value) => update('bezel', 'innerDiameter', value)} /><NumberField label="Altura" dimension={exterior.bezel.height} min={0.1} max={5} step={0.01} onChange={(value) => update('bezel', 'height', value)} /></InspectorSection>
  if (part === 'rehaut') return <InspectorSection title="Geometria de rehaut"><Toggle label="Rehaut visible" checked={exterior.rehaut.enabled} onChange={(value) => setValue('rehaut', 'enabled', value)} /><NumberField label="Diametro interior" dimension={exterior.rehaut.innerDiameter} min={15} max={60} step={0.05} onChange={(value) => update('rehaut', 'innerDiameter', value)} /><NumberField label="Diametro exterior" dimension={exterior.rehaut.outerDiameter} min={15} max={62} step={0.05} onChange={(value) => update('rehaut', 'outerDiameter', value)} /><NumberField label="Altura" dimension={exterior.rehaut.height} min={0.1} max={5} step={0.01} onChange={(value) => update('rehaut', 'height', value)} /><NumberField label="Angulo" dimension={exterior.rehaut.angle} min={20} max={89} step={1} onChange={(value) => update('rehaut', 'angle', value)} /></InspectorSection>
  if (part === 'strap' || part === 'clasp' || part === 'springBar') return <InspectorSection title="Correa y cierre"><Segmented label="Tipo" value={exterior.strap.kind} options={[{ value: 'leather', label: 'Piel' }, { value: 'rubber', label: 'Caucho' }, { value: 'fabric', label: 'Tejido' }, { value: 'bracelet', label: 'Brazalete' }, { value: 'none', label: 'Sin' }]} onChange={(value) => setValue('strap', 'kind', value)} /><NumberField label="Ancho entre asas" dimension={exterior.strap.width} min={8} max={34} step={0.1} onChange={(value) => update('strap', 'width', value)} /><NumberField label="Ancho en cierre" dimension={exterior.strap.taperWidth} min={8} max={30} step={0.1} onChange={(value) => update('strap', 'taperWidth', value)} /><NumberField label="Espesor" dimension={exterior.strap.thickness} min={0.5} max={8} step={0.1} onChange={(value) => update('strap', 'thickness', value)} /><NumberField label="Tramo superior" dimension={exterior.strap.upperLength} min={25} max={180} step={1} onChange={(value) => update('strap', 'upperLength', value)} /><NumberField label="Tramo inferior" dimension={exterior.strap.lowerLength} min={30} max={220} step={1} onChange={(value) => update('strap', 'lowerLength', value)} /></InspectorSection>
  if (part === 'dialGraphics') return <InspectorSection title="Grafica del dial"><Toggle label="Indices aplicados" checked={exterior.dialGraphics.indicesEnabled} onChange={(value) => setValue('dialGraphics', 'indicesEnabled', value)} /><Toggle label="Pista de minutos" checked={exterior.dialGraphics.minuteTrack} onChange={(value) => setValue('dialGraphics', 'minuteTrack', value)} /><Toggle label="Lumen" checked={exterior.dialGraphics.lumeEnabled} onChange={(value) => setValue('dialGraphics', 'lumeEnabled', value)} /><label className="select-field"><span>Forma de indice</span><select value={exterior.dialGraphics.indexShape} onChange={(event) => setValue('dialGraphics', 'indexShape', event.target.value)}><option value="baton">Baston</option><option value="dot">Punto</option><option value="arabic">Arabigo</option><option value="roman">Romano</option></select></label><NumberField label="Radio de indices" dimension={exterior.dialGraphics.indexRadius} min={5} max={28} step={0.05} onChange={(value) => update('dialGraphics', 'indexRadius', value)} /><NumberField label="Longitud de indice" dimension={exterior.dialGraphics.indexLength} min={0.2} max={6} step={0.05} onChange={(value) => update('dialGraphics', 'indexLength', value)} /><NumberField label="Ancho de indice" dimension={exterior.dialGraphics.indexWidth} min={0.1} max={3} step={0.05} onChange={(value) => update('dialGraphics', 'indexWidth', value)} /><NumberField label="Altura aplicada" dimension={exterior.dialGraphics.indexHeight} min={0.02} max={1} step={0.01} onChange={(value) => update('dialGraphics', 'indexHeight', value)} /></InspectorSection>
  return null
}

export function PresentationInspector({ part }: { part: WatchPartId }) {
  const presentation = useStudioStore((state) => state.project.presentation)
  const updatePresentation = useStudioStore((state) => state.updatePresentation)
  return <>
    <InspectorSection title="Escena hiperrealista">
      <Segmented label="Calidad" value={presentation.quality} options={[{ value: 'draft', label: 'Borrador' }, { value: 'studio', label: 'Estudio' }, { value: 'ultra', label: 'Ultra' }]} onChange={(value) => updatePresentation('quality', value)} />
      <label className="select-field"><span>Iluminacion</span><select value={presentation.environment} onChange={(event) => updatePresentation('environment', event.target.value)}><option value="design-neutral">Neutra</option><option value="presentation-light">Softbox</option><option value="softbox-dark">Softbox oscuro</option><option value="showroom">Showroom</option></select></label>
      <label className="select-field"><span>Superficie</span><select value={presentation.background} onChange={(event) => updatePresentation('background', event.target.value)}><option value="studio-dark">Estudio oscuro</option><option value="studio-light">Estudio claro</option><option value="marble">Marmol</option><option value="concrete">Hormigon</option><option value="granite">Granito</option><option value="transparent">Transparente</option></select></label>
      <label className="appearance-range"><span>Exposicion <b>{presentation.exposure.toFixed(2)}</b></span><input type="range" min="0.45" max="2" step="0.05" value={presentation.exposure} onChange={(event) => updatePresentation('exposure', Number(event.target.value))} /></label>
      <Toggle label="Superposiciones tecnicas" checked={presentation.showTechnicalOverlays} onChange={(value) => updatePresentation('showTechnicalOverlays', value)} />
    </InspectorSection>
    <ExteriorGeometry part={part} />
    <SurfaceEditor part={part} />
  </>
}

export function ExteriorInspector({ part }: { part: WatchPartId }) {
  return <><ExteriorGeometry part={part} /><SurfaceEditor part={part} /></>
}
