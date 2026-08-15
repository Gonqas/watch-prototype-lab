# Concurrencia de persistencia · 0.14G

## Reproducción anterior

| Backend | Mutaciones simultáneas | Resultado | Versión final | Pérdida observada |
|---|---:|---|---:|---|
| memory | 2 | one-fulfilled-one-conflict | 2 | educationalPreferences.academyStateV1 |
| indexeddb | 2 | one-fulfilled-one-conflict | 2 | educationalPreferences |

## Contrato corregido

- Cola funcional independiente por perfil.
- Relectura dentro de la transacción y versión monotónica.
- Máximo de 3 intentos; conflicto agotado recuperable y visible.
- Estrés determinista: 100 transiciones de Academia más una mutación de accesibilidad en memoria, IndexedDB y adaptador SQLite.
- Resultado esperado y cubierto por prueba: versión 102, cero mutaciones perdidas.
- Diagnósticos acotados, exportables, borrables y sin IDs de perfil en claro.

La prueba de SQLite cubre el adaptador y su gateway contractual, no una base nativa externa real.
