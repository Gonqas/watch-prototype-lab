# Auditoría de dependencias

## Dependencias JavaScript

| Paquete | Versión declarada | Referencias directas detectadas | Decisión |
|---|---|---:|---|
| `@react-three/drei` | `^10.7.7` | 3 | required |
| `@react-three/fiber` | `^9.6.1` | 3 | required |
| `@tauri-apps/api` | `^2.11.1` | 3 | required |
| `@tauri-apps/plugin-dialog` | `^2.7.1` | 5 | required |
| `@tauri-apps/plugin-fs` | `^2.5.1` | 2 | required |
| `@tauri-apps/plugin-opener` | `^2.5.4` | 1 | required |
| `ajv` | `^8.17.1` | 0 | review-transitive-or-cli |
| `fflate` | `^0.8.3` | 8 | required |
| `lucide-react` | `^1.21.0` | 19 | required |
| `react` | `^19.2.6` | 28 | required |
| `react-dom` | `^19.2.6` | 0 | review-transitive-or-cli |
| `three` | `^0.184.0` | 4 | required |
| `zod` | `^4.4.3` | 17 | required |
| `zustand` | `^5.0.14` | 2 | required |
| `@eslint/js` | `^10.0.1` | 0 | review-transitive-or-cli |
| `@tauri-apps/cli` | `^2.11.4` | 0 | review-transitive-or-cli |
| `@types/node` | `^24.12.3` | 0 | review-transitive-or-cli |
| `@types/react` | `^19.2.14` | 0 | review-transitive-or-cli |
| `@types/react-dom` | `^19.2.3` | 0 | review-transitive-or-cli |
| `@vitejs/plugin-react` | `^6.0.1` | 0 | review-transitive-or-cli |
| `eslint` | `^10.3.0` | 0 | review-transitive-or-cli |
| `eslint-plugin-react-hooks` | `^7.1.1` | 0 | review-transitive-or-cli |
| `eslint-plugin-react-refresh` | `^0.5.2` | 0 | review-transitive-or-cli |
| `fake-indexeddb` | `^6.2.4` | 4 | required |
| `globals` | `^17.6.0` | 0 | review-transitive-or-cli |
| `tsx` | `^4.20.6` | 0 | review-transitive-or-cli |
| `typescript` | `~6.0.2` | 0 | review-transitive-or-cli |
| `typescript-eslint` | `^8.59.2` | 0 | review-transitive-or-cli |
| `vite` | `^8.0.12` | 0 | review-transitive-or-cli |
| `vitest` | `^4.1.9` | 83 | required |

## Rust, Tauri y sidecar

- `src-tauri/Cargo.lock` fija la resolución Rust y se conserva.
- `tauri-plugin-dialog`, `tauri-plugin-fs` y `tauri-plugin-opener` están registrados y tienen consumidores directos.
- `src-tauri/binaries/watchlab-cad-*.exe` es el sidecar empaquetado; se conserva antes de limpiar PyInstaller.
- `cad-engine/dist` y `cad-engine/build` son salidas de `npm run cad:package`, no fuente canónica.

## Grafo y empaquetado

- Entrada Web: `src/main.tsx → src/App.tsx`.
- Academia: carga diferida desde `App.tsx`, con superficies internas también divididas.
- Persistencia: repositorios Web/IndexedDB y adaptador SQLite nativo existentes; 5A debe ampliarlos, no crear un tercer subsistema.
- Desktop: Tauri registra comandos de proyecto, aprendizaje y CAD en `src-tauri/src/lib.rs`.
- Build inicial válido, con dos incidencias a corregir: import dinámico ineficaz de `@tauri-apps/api/core` y chunks superiores a 500 kB.

## Decisión

No se elimina ninguna dependencia en esta fase: las referencias cero incluyen herramientas de build/CLI y requieren análisis semántico adicional. Se optimizará el grafo mediante división de contenido y fronteras lazy explícitas, sin alterar el lockfile por limpieza cosmética.

## Estado final 0.8

El import dinámico ineficaz de Tauri quedó corregido y Metrología/contenido se cargan mediante fronteras diferidas. Persisten avisos no bloqueantes por chunks históricos de contenido mayores de 500 kB; no se oculta el umbral ni se alteran datos editoriales para reducirlo artificialmente.
