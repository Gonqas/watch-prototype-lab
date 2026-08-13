# Rendimiento del laboratorio mecánico

Entorno: Node headless; dominio mecánico y cálculos, sin renderer GPU

| Operación | ms |
|---|---:|
| loadLab | 0.966 |
| wind | 0.918 |
| changeRatio | 0.296 |
| recalculateTrain | 0.014 |
| eightEscapementPhases | 0.943 |
| restoreSnapshot | 0.355 |
| reconfigureFunctions | 0.548 |

Entidades: 30; relaciones cinemáticas: 12; tramos energéticos: 9; snapshot: 12102 bytes.

Materiales, draw calls y memoria GPU: no medidos en Node headless.

## Limitaciones

- Los tiempos son una muestra diagnóstica, no un presupuesto garantizado.
- Materiales, draw calls y memoria GPU requieren instrumentación del renderer y quedan no medidos.
- No se mide física, servicio ni montaje de un MIYOTA 8215.
