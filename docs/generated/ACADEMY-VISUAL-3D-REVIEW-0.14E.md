# Revisión de visuales y estados 3D 0.14E

## 32 diseños visuales existentes

| Decisión | Conteo |
| --- | ---: |
| correct | 3 |
| keep | 28 |
| source-needed | 1 |

| Diseño | Decisión | Motivo |
| --- | --- | --- |
| visual.watch-system.functions.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.watch-system.boundary.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.mechanical-chain.energy-time.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.mechanical-chain.interruption.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.functional-equivalence.parallel.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.functional-equivalence.boundaries.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.mechanical-energy.flow.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.mechanical-energy.states.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.barrel.anatomy.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.barrel.winding-discharge.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.gear-pair.ratio.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.gear-pair.direction-torque.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.train.real-order.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.train.3d-overview.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.train.3d-fourth-interface.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.escapement.phases.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.escapement.interfaces.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.oscillator.feedback.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.oscillator.active-length.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.metrology.observe-first.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.failure-prediction.hypothesis.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.miyota8215.architecture-overview.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.miyota8215.architecture-train.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.miyota8215.architecture-automatic.v1 | correct | Se conserva el diseño y se estrecha su texto para no presentar inferencias del despiece como procedimiento oficial. |
| visual.miyota8215.disassembly-sequence.v1 | correct | Se conserva el diseño y se estrecha su texto para no presentar inferencias del despiece como procedimiento oficial. |
| visual.miyota8215.disassembly-rotor.v1 | correct | Se conserva el diseño y se estrecha su texto para no presentar inferencias del despiece como procedimiento oficial. |
| visual.miyota8215.disassembly-barrel-bridge.v1 | source-needed | La relación estructural puede mostrarse, pero una secuencia de servicio necesita una fuente adicional. |
| visual.miyota8215.inspection-evidence.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.miyota8215.inspection-train.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.miyota8215.inspection-support.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.case.axial-stack.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |
| visual.case.stem-line.v1 | keep | Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites. |

## 9 estados 3D

| Estado | Decisión | Motivo |
| --- | --- | --- |
| reader.3d.mechanical-train.overview | keep | Modelo conceptual explícito; no expresa geometría fabricable ni calibre. |
| reader.3d.mechanical-train.fourth-wheel | keep | Aísla una interfaz conceptual y conserva la limitación de geometría. |
| reader.3d.miyota8215.overview | keep | La documentación oficial respalda identidad y agrupación de piezas, no tolerancias. |
| reader.3d.miyota8215.train-isolated | keep | Localiza el tren modelado sin afirmar depthing, desgaste o servicio. |
| reader.3d.miyota8215.automatic-isolated | correct | Se elimina toda lectura de ruta cinemática completa no demostrada por el despiece. |
| reader.3d.miyota8215.rotor-checkpoint | correct | Se presenta como dependencia entre fijación y pieza, no como primer paso ni dirección de retirada. |
| reader.3d.miyota8215.barrel-bridge-checkpoint | source-needed | La agrupación es visible; el orden de desmontaje sigue bloqueado sin manual de servicio. |
| reader.3d.miyota8215.inspection-train | keep | La vista localiza un sistema y declara que no demuestra desgaste ni tolerancia. |
| reader.3d.miyota8215.inspection-support | keep | La interfaz espacial se muestra sin criterio dimensional de aceptación. |

Los dos estados conceptuales permanecen identificados como modelos. Los estados 8215 no afirman dimensiones, depthing, desgaste, holgura, lubricación ni secuencia oficial. El checkpoint del puente de barrilete queda source-needed y pierde la explosión procedural.
