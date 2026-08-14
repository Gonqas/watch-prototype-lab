# Reanudación del lector 0.14D

| Propiedad | Resultado |
| --- | --- |
| documentVersion persistida | `reader-v1:<16 hex>` |
| Longitud máxima observada | 26 caracteres |
| diagnosticSignature máxima | 176 caracteres; solo diagnóstico |
| visitedSectionIds | normalizador dedicado, hasta 1.000 IDs de 512 caracteres |
| Estado previo | se conserva; el legacy documentVersion queda en identity |
| Hash cambiado | se conserva el apartado resoluble, pero no se reutiliza offset incompatible |
| Alias / sección eliminada | resolución explícita por aliases y fallback inicial |

La clave persistida ya no concatena versiones de todos los bloques ni compara una cadena truncada. Los IDs anteriores no se borran.
