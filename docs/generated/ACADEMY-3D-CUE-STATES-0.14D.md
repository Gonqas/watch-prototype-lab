# Estados 3D específicos 0.14D

Estados registrados: **9**.

| visualStateId | Fixture | Cámara | Selección | Aislamiento | Explosión | Animación | Observación esperada |
| --- | --- | --- | --- | --- | --- | --- | --- |
| reader.3d.mechanical-train.overview | fixture.conceptual.mechanical-chain | train-oblique | selector.conceptual.mechanical.train | selector.conceptual.mechanical.train | 0 | paused | El tren transmite por etapas; la cuarta rueda precede al escape y conecta la marcha con la indicación de segundos. |
| reader.3d.mechanical-train.fourth-wheel | fixture.conceptual.mechanical-chain | fourth-wheel-close | instance:fourth-wheel; instance:escape-pinion | selector.conceptual.mechanical.train; instance:escape-pinion | 0 | paused | La salida de la cuarta rueda engrana con el piñón de escape; el sentido alterna en cada engrane externo. |
| reader.3d.miyota8215.overview | fixture.miyota.8215.structural | 8215-overview |  |  | 0 | paused | Los subsistemas comparten un único ensamblaje y ocupan capas distintas alrededor de la estructura base. |
| reader.3d.miyota8215.train-isolated | fixture.miyota.8215.structural | 8215-train | selector.miyota.8215.train | selector.miyota.8215.train | 0 | paused | El selector aísla únicamente las ruedas del tren modeladas, sin duplicar el calibre ni afirmar geometría medida. |
| reader.3d.miyota8215.automatic-isolated | fixture.miyota.8215.structural | 8215-automatic | selector.miyota.8215.automatic-winding | selector.miyota.8215.automatic-winding | 0 | paused | La masa oscilante y las ruedas automáticas forman un subsistema distinto del tren de marcha. |
| reader.3d.miyota8215.rotor-checkpoint | fixture.miyota.8215.structural | 8215-rotor-fastener | instance:screw-rotor; instance:oscillating-weight | instance:screw-rotor; instance:oscillating-weight | 1 | paused | La fijación se reconoce antes que la pieza retirada; el estado solo documenta la dependencia, no una destreza física. |
| reader.3d.miyota8215.barrel-bridge-checkpoint | fixture.miyota.8215.structural | 8215-barrel-bridge | instance:screw-barrel-bridge; instance:barrel-bridge; instance:barrel-complete | instance:screw-barrel-bridge; instance:barrel-bridge; instance:barrel-complete | 1 | paused | El orden parcial separa fijación, puente y conjunto completo; no completa un manual de desmontaje. |
| reader.3d.miyota8215.inspection-train | fixture.miyota.8215.structural | 8215-inspection-train | selector.miyota.8215.train | selector.miyota.8215.train | 0 | paused | La observación identifica el sistema y la incertidumbre; el modelo no permite concluir desgaste o tolerancia. |
| reader.3d.miyota8215.inspection-support | fixture.miyota.8215.structural | 8215-center-support | instance:center-wheel; instance:center-wheel-cock | instance:center-wheel; instance:center-wheel-cock | 1 | paused | La interfaz de apoyo puede localizarse, pero el fixture no aporta un criterio dimensional de aceptación. |

Cada cue 3D enlaza una actividad exacta y un estado. El runtime valida selectores y muestra “Vista no disponible” ante un fallo; no cae a un SVG genérico. Todos los estados parten pausados y respetan movimiento reducido.
