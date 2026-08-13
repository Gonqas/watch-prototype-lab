# Rendimiento del banco virtual

Entorno: Node headless; medición contractual del dominio, no GPU

| Operación | ms |
|---|---:|
| loadWorkbench | 0.998 |
| prepareWorkbench | 1.125 |
| changeStepSelection | 0.049 |
| disassembleOneFastenerToTray | 0.490 |
| restoreSnapshot | 0.245 |
| reopenCheckpoint | 0.765 |
| reassembleAndVerifyOneFastener | 0.118 |
| completeAssembly | no representable con la secuencia actual |

Objetos: 33; identidades: 33; manipulables: 23; snapshot: 29270 bytes. Draw calls y memoria GPU: no medidos en el runner headless.

## Limitaciones

- No se mide montaje completo porque el fixture solo declara una secuencia parcial y no debe fingirse una secuencia de servicio.
- Draw calls y memoria GPU requieren instrumentación del renderer en una ejecución gráfica; se declaran no medidos.
- Los tiempos son una muestra diagnóstica local, no un presupuesto de rendimiento garantizado.
