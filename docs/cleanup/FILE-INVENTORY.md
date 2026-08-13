# Inventario técnico del repositorio

Generado: 2026-08-02T11:34:18.268Z

Este informe cubre individualmente los 1725 archivos fuente no ignorados y agrega por directorio los entornos y salidas generadas. El detalle reproducible, con SHA-256 por archivo fuente, está en `FILE-INVENTORY.json`. Los datos privados ignorados no se abren ni se incluyen.

## Punto de restauración

- Ruta externa: `<external-checkpoints>/WatchPrototypeLab-0.7.0-pre5A-20260802-112047.zip`
- Entradas: 1436
- Tamaño: 49.684.715 bytes
- SHA-256: `48bc27f6ce34d491c9c0dcc34e7c14470df60c9278129063abeb8c98a9b917e3`

## Clasificación

| Clasificación | Registros |
|---|---:|
| content-source | 1199 |
| development-required | 2 |
| generated-current | 3 |
| generated-stale | 5 |
| production-required | 439 |
| test-required | 86 |

## Áreas generadas o locales

| Ruta | Archivos | Bytes | Decisión | Regeneración |
|---|---:|---:|---|---|
| `.venv-cad` | 13834 | 1.121.419.503 | keep | python environment bootstrap |
| `release` | 24 | 973.665.611 | keep-stable-installers | npm run installer |
| `node_modules` | 17528 | 357.710.937 | keep | npm ci |
| `cad-engine/dist` | 191 | 327.090.727 | safe-to-remove-after-sidecar-check | npm run cad:package |
| `src-tauri/binaries` | 1 | 288.271.654 | keep-bundled-sidecar | npm run cad:package plus installer script |
| `dist` | 73 | 52.367.397 | safe-to-remove | npm run build |
| `cad-engine/build` | 16 | 16.778.717 | safe-to-remove | npm run cad:package |
| `tmp` | 2 | 3087 | safe-to-remove | test and audit scripts |
| `cad-engine/.pytest_cache` | 4 | 1176 | safe-to-remove | npm run cad:test |

## Mayores archivos fuente

| Ruta | Bytes | Clasificación | Referenciado |
|---|---:|---|---|
| `public/assets/realism/hdri/presentation_light.exr` | 21.899.432 | production-required | sí |
| `public/assets/realism/hdri/design_neutral.exr` | 21.716.191 | production-required | sí |
| `docs/cleanup/FILE-INVENTORY.json` | 922.402 | production-required | sí |
| `learning-content/miyota8215/generated/miyota8215-operation-matrix.json` | 516.994 | content-source | sí |
| `src-tauri/gen/schemas/desktop-schema.json` | 409.694 | production-required | sí |
| `src-tauri/gen/schemas/windows-schema.json` | 409.694 | production-required | no detectado |
| `public/assets/realism/textures/dial_white_rough_plaster/albedo_preview.jpg` | 305.980 | production-required | sí |
| `public/assets/realism/textures/dial_white_plaster_02/albedo_preview.jpg` | 261.297 | production-required | sí |
| `public/assets/realism/textures/dial_granular_concrete/albedo_preview.jpg` | 206.387 | production-required | sí |
| `public/assets/realism/textures/dial_plaster_grey_04/albedo_preview.jpg` | 201.358 | production-required | sí |
| `learning-content/miyota8215/generated/miyota8215-audit.json` | 200.653 | content-source | sí |
| `learning-content/miyota8215/generated/miyota8215-operation-matrix.md` | 197.394 | content-source | sí |
| `public/assets/realism/textures/presentation_smooth_concrete/albedo_preview.jpg` | 191.386 | production-required | sí |
| `public/assets/realism/textures/dial_plaster_grey_04/roughness_preview.jpg` | 188.487 | production-required | sí |
| `package-lock.json` | 157.605 | production-required | no detectado |
| `public/assets/realism/textures/presentation_granite_tile/albedo_preview.jpg` | 146.708 | production-required | sí |
| `src-tauri/gen/schemas/acl-manifests.json` | 140.712 | production-required | no detectado |
| `public/assets/realism/textures/dial_white_plaster_02/roughness_preview.jpg` | 136.783 | production-required | sí |
| `docs/academy-ux/screenshots/before-route-8215-desktop.png` | 134.489 | production-required | no detectado |
| `src-tauri/icons/icon.icns` | 132.451 | production-required | no detectado |
| `src-tauri/Cargo.lock` | 126.408 | production-required | sí |
| `docs/academy-ux/screenshots/before-explorer-desktop.png` | 124.976 | production-required | no detectado |
| `src/learning/content/schemas/learning-pack-v1.validator.js` | 121.103 | generated-current | sí |
| `docs/academy-ux/screenshots/before-progress-desktop.png` | 119.623 | production-required | no detectado |
| `docs/academy-ux/screenshots/after-harness-desktop.png` | 119.004 | production-required | no detectado |
| `src/learning/ui/AcademySurfaces.tsx` | 116.601 | production-required | no detectado |
| `public/assets/realism/textures/dial_white_rough_plaster/roughness_preview.jpg` | 116.198 | production-required | sí |
| `docs/academy-ux/screenshots/before-home-desktop.png` | 114.709 | production-required | no detectado |
| `docs/academy-ux/screenshots/after-home-desktop.png` | 111.405 | production-required | no detectado |
| `src/components/WatchViewer.tsx` | 107.366 | production-required | no detectado |

## Criterio de decisión

- `keep`: fuente, prueba, documentación o contenido declarativo integrado.
- `keep-stable-installers`: entregables previos, conservados aunque exista una copia en `target`.
- `keep-bundled-sidecar`: binario que Tauri empaqueta; no se elimina sin regeneración y prueba Desktop.
- `safe-to-remove`: salida ignorada, sin datos de usuario y con comando de regeneración documentado.
- `safe-to-remove-after-*`: requiere comprobar primero la copia conservada indicada.
- Lo desconocido no se elimina.
