# Plan de eliminación segura

No se elimina ningún elemento desconocido. El orden protege primero los entregables y después retira solo cachés/salidas regenerables.

| Orden | Ruta | Motivo | Prueba | Regeneración | Riesgo | Validación posterior |
|---:|---|---|---|---|---|---|
| 1 | logs raíz `*.log` | Diagnóstico local obsoleto | ignorados, sin referencias | nueva ejecución Vite/installer | bajo | `npm run verify` |
| 2 | `dist/` | build Web reproducible | baseline acaba de regenerarlo | `npm run build` | bajo | build y tamaños de chunks |
| 3 | `tmp/` | fixtures/reportes temporales | ignorado, sin datos de usuario detectados | scripts de prueba/auditoría | bajo | pruebas de contenido |
| 4 | `build/` | salida de instalador antigua | instaladores estables están en `release/` | `npm run installer` | bajo | conservar hashes de release |
| 5 | `cad-engine/build/`, `.pytest_cache` | caché PyInstaller/pytest | fuente está en `cad-engine/watchlab_cad` | `npm run cad:package`, `npm run cad:test` | bajo | pruebas CAD |
| 6 | `cad-engine/dist/` | paquete PyInstaller duplicado | sidecar conservado en `src-tauri/binaries` | `npm run cad:package` | medio | hash/presencia sidecar y build Desktop |
| 7 | `src-tauri/target/` | salida Cargo de 15+ GB | instaladores estables conservados en `release/` | `cargo test`, `npm run installer` | medio | pruebas Rust + installer 0.8 |

## Exclusiones expresas

No se tocan `.git/`, `release/`, `src-tauri/binaries/`, `node_modules/`, `.venv-cad/`, bases SQLite, perfiles, sesiones, `.wplab`, fotos, mediciones, checkpoints externos, secretos, documentos privados ni originales.
