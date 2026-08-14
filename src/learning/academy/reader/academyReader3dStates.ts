import type { Academy3dVisualState } from './academyReaderModel'

const conceptualLimit = 'Geometría y posición didácticas; no representan medidas fabricables ni un calibre concreto.'
const miyotaLimit = 'Fixture R2 estructural del MIYOTA 8215; la geometría interna está normalizada y no expresa tolerancias de servicio.'

export const ACADEMY_3D_VISUAL_STATES: readonly Academy3dVisualState[] = [
  {
    visualStateId: 'reader.3d.mechanical-train.overview',
    fixtureId: 'fixture.conceptual.mechanical-chain',
    camera: { presetId: 'train-oblique', position: [5.4, 4.2, 5.8], target: [0.2, 0.45, 0], fieldOfView: 31 },
    selectedIds: ['selector.conceptual.mechanical.train'],
    isolatedIds: ['selector.conceptual.mechanical.train'],
    transparency: {}, explosion: {}, animation: 'paused',
    labels: [
      { id: 'label.center', label: 'Rueda central', targetId: 'instance:center-wheel' },
      { id: 'label.third', label: 'Tercera rueda', targetId: 'instance:third-wheel' },
      { id: 'label.fourth', label: 'Cuarta rueda', targetId: 'instance:fourth-wheel' },
      { id: 'label.escape', label: 'Rueda de escape', targetId: 'instance:escape-wheel' },
    ],
    expectedObservation: 'El tren transmite por etapas; la cuarta rueda precede al escape y conecta la marcha con la indicación de segundos.',
    fidelity: 'conceptual', limitations: [conceptualLimit],
  },
  {
    visualStateId: 'reader.3d.mechanical-train.fourth-wheel',
    fixtureId: 'fixture.conceptual.mechanical-chain',
    camera: { presetId: 'fourth-wheel-close', position: [5.2, 4.2, 6], target: [0.45, 0.75, 0], fieldOfView: 29 },
    selectedIds: ['instance:fourth-wheel', 'instance:escape-pinion'],
    isolatedIds: ['selector.conceptual.mechanical.train', 'instance:escape-pinion'],
    transparency: { 'selector.conceptual.mechanical.train': 0.78 }, explosion: {}, animation: 'paused',
    labels: [{ id: 'label.fourth-interface', label: 'Interfaz cuarta rueda → piñón de escape', targetId: 'instance:fourth-wheel' }],
    expectedObservation: 'La salida de la cuarta rueda engrana con el piñón de escape; el sentido alterna en cada engrane externo.',
    fidelity: 'conceptual', limitations: [conceptualLimit],
  },
  {
    visualStateId: 'reader.3d.miyota8215.overview',
    fixtureId: 'fixture.miyota.8215.structural',
    camera: { presetId: '8215-overview', position: [10, 9, 10], target: [0, 1, 0], fieldOfView: 34 },
    selectedIds: [], isolatedIds: [], transparency: {}, explosion: {}, animation: 'paused',
    labels: [
      { id: 'label.rotor', label: 'Masa oscilante', targetId: 'instance:oscillating-weight' },
      { id: 'label.barrel', label: 'Barrilete completo', targetId: 'instance:barrel-complete' },
      { id: 'label.balance', label: 'Volante con espiral', targetId: 'instance:balance-assembly' },
      { id: 'label.calendar', label: 'Calendario', targetId: 'instance:date-dial' },
    ],
    expectedObservation: 'Los subsistemas comparten un único ensamblaje y ocupan capas distintas alrededor de la estructura base.',
    fidelity: 'calibre-specific', limitations: [miyotaLimit],
  },
  {
    visualStateId: 'reader.3d.miyota8215.train-isolated',
    fixtureId: 'fixture.miyota.8215.structural',
    camera: { presetId: '8215-train', position: [7, 6, 7], target: [0.15, 0.9, -0.35], fieldOfView: 30 },
    selectedIds: ['selector.miyota.8215.train'], isolatedIds: ['selector.miyota.8215.train'], transparency: {}, explosion: {}, animation: 'paused',
    labels: [
      { id: 'label.8215.center', label: 'Rueda de centro', targetId: 'instance:center-wheel' },
      { id: 'label.8215.third', label: 'Tercera rueda', targetId: 'instance:third-wheel' },
      { id: 'label.8215.fourth', label: 'Cuarta rueda', targetId: 'instance:fourth-wheel' },
    ],
    expectedObservation: 'El selector aísla únicamente las ruedas del tren modeladas, sin duplicar el calibre ni afirmar geometría medida.',
    fidelity: 'calibre-specific', limitations: [miyotaLimit],
  },
  {
    visualStateId: 'reader.3d.miyota8215.automatic-isolated',
    fixtureId: 'fixture.miyota.8215.structural',
    camera: { presetId: '8215-automatic', position: [7.5, 5.5, 8.5], target: [-0.7, -0.2, 0.9], fieldOfView: 31 },
    selectedIds: ['selector.miyota.8215.automatic-winding'], isolatedIds: ['selector.miyota.8215.automatic-winding'], transparency: {}, explosion: {}, animation: 'paused',
    labels: [
      { id: 'label.automatic.rotor', label: 'Masa oscilante', targetId: 'instance:oscillating-weight' },
      { id: 'label.automatic.pawl', label: 'Rueda de carga con trinquete', targetId: 'instance:pawl-winding-wheel' },
      { id: 'label.automatic.reduction', label: 'Rueda reductora', targetId: 'instance:reduction-wheel' },
    ],
    expectedObservation: 'La masa oscilante y las ruedas automáticas forman un subsistema distinto del tren de marcha.',
    fidelity: 'calibre-specific', limitations: [miyotaLimit, 'La ruta cinemática completa del automático sigue declarada como parcialmente inferida.'],
  },
  {
    visualStateId: 'reader.3d.miyota8215.rotor-checkpoint',
    fixtureId: 'fixture.miyota.8215.structural',
    camera: { presetId: '8215-rotor-fastener', position: [6.5, 4.8, 7], target: [0, -0.35, 0], fieldOfView: 27 },
    selectedIds: ['instance:screw-rotor', 'instance:oscillating-weight'],
    isolatedIds: ['instance:screw-rotor', 'instance:oscillating-weight'], transparency: {}, explosion: { 'instance:oscillating-weight': 0.32 }, animation: 'paused',
    labels: [
      { id: 'label.rotor.screw', label: 'Fijación del rotor', targetId: 'instance:screw-rotor' },
      { id: 'label.rotor.weight', label: 'Masa oscilante', targetId: 'instance:oscillating-weight' },
    ],
    expectedObservation: 'La fijación se reconoce antes que la pieza retirada; el estado solo documenta la dependencia, no una destreza física.',
    fidelity: 'calibre-specific', limitations: [miyotaLimit, 'Explosión visual simbólica; no representa una distancia de extracción ni autoriza el procedimiento.'],
  },
  {
    visualStateId: 'reader.3d.miyota8215.barrel-bridge-checkpoint',
    fixtureId: 'fixture.miyota.8215.structural',
    camera: { presetId: '8215-barrel-bridge', position: [6, 5.2, 6.8], target: [-1.1, 1.2, 0.5], fieldOfView: 26 },
    selectedIds: ['instance:screw-barrel-bridge', 'instance:barrel-bridge', 'instance:barrel-complete'],
    isolatedIds: ['instance:screw-barrel-bridge', 'instance:barrel-bridge', 'instance:barrel-complete'], transparency: {}, explosion: { 'instance:barrel-bridge': 0.38 }, animation: 'paused',
    labels: [
      { id: 'label.barrel.screws', label: 'Tornillos de puente', targetId: 'instance:screw-barrel-bridge' },
      { id: 'label.barrel.bridge', label: 'Puente de barrilete', targetId: 'instance:barrel-bridge' },
      { id: 'label.barrel.complete', label: 'Barrilete completo', targetId: 'instance:barrel-complete' },
    ],
    expectedObservation: 'El orden parcial separa fijación, puente y conjunto completo; no completa un manual de desmontaje.',
    fidelity: 'calibre-specific', limitations: [miyotaLimit, 'Orden parcial inferido del despiece; requiere validación física y documental moderna.'],
  },
  {
    visualStateId: 'reader.3d.miyota8215.inspection-train',
    fixtureId: 'fixture.miyota.8215.structural',
    camera: { presetId: '8215-inspection-train', position: [6.5, 5.5, 6.5], target: [0, 0.9, -0.4], fieldOfView: 29 },
    selectedIds: ['selector.miyota.8215.train'], isolatedIds: ['selector.miyota.8215.train'], transparency: {}, explosion: {}, animation: 'paused',
    labels: [{ id: 'label.inspect.train', label: 'Tren observado', targetId: 'instance:center-wheel' }],
    expectedObservation: 'La observación identifica el sistema y la incertidumbre; el modelo no permite concluir desgaste o tolerancia.',
    fidelity: 'calibre-specific', limitations: [miyotaLimit, 'No se simulan holguras, suciedad, rayas, pivotes ni desgaste medible.'],
  },
  {
    visualStateId: 'reader.3d.miyota8215.inspection-support',
    fixtureId: 'fixture.miyota.8215.structural',
    camera: { presetId: '8215-center-support', position: [5.5, 4.5, 5.5], target: [0, 1.15, 0], fieldOfView: 25 },
    selectedIds: ['instance:center-wheel', 'instance:center-wheel-cock'], isolatedIds: ['instance:center-wheel', 'instance:center-wheel-cock'],
    transparency: { 'instance:center-wheel-cock': 0.62 }, explosion: { 'instance:center-wheel-cock': 0.22 }, animation: 'paused',
    labels: [
      { id: 'label.inspect.center', label: 'Rueda de centro', targetId: 'instance:center-wheel' },
      { id: 'label.inspect.cock', label: 'Puente de rueda de centro', targetId: 'instance:center-wheel-cock' },
    ],
    expectedObservation: 'La interfaz de apoyo puede localizarse, pero el fixture no aporta un criterio dimensional de aceptación.',
    fidelity: 'calibre-specific', limitations: [miyotaLimit],
  },
] as const

export function academy3dVisualState(visualStateId: string | undefined): Academy3dVisualState | undefined {
  return visualStateId ? ACADEMY_3D_VISUAL_STATES.find((state) => state.visualStateId === visualStateId) : undefined
}
