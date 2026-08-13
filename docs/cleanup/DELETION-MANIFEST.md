# Manifiesto de eliminación

Estado: **limpieza principal ejecutada y validada; consolidación histórica de `release/` pendiente**.

Ejecución: 2026-08-02T09:29:37.466Z. Todas las rutas se resolvieron y comprobaron dentro de `<repository-root>` mediante `scripts/execute-safe-cleanup.mjs`. Antes y después se verificaron el instalador estable 0.7.0 y el sidecar CAD.

| Ruta | Archivos | Bytes | Motivo y prueba | Regeneración | Riesgo | Validación posterior |
|---|---:|---:|---|---|---|---|
| `dist/` | 62 | 51.747.090 | build Web ignorado, reproducido en baseline | `npm run build` | bajo | pendiente `npm run verify` |
| `tmp/` | 1.097 | 166.949.672 | temporales ignorados sin datos de usuario detectados | scripts de prueba | bajo | pendiente pruebas de contenido |
| `build/` | 14 | 318.038.164 | salida de empaquetado antigua; `release/` protegido | `npm run installer` | bajo | instaladores conservados |
| `cad-engine/build/` | 16 | 16.774.239 | caché PyInstaller | `npm run cad:package` | bajo | pendiente `npm run cad:test` |
| `cad-engine/.pytest_cache/` | 5 | 1.178 | caché pytest | `npm run cad:test` | bajo | pendiente `npm run cad:test` |
| `cad-engine/dist/` | 191 | 327.089.515 | paquete duplicado; sidecar empaquetado conservado | `npm run cad:package` | medio | hash sidecar verificado |
| `src-tauri/target/` | 14.016 | 16.192.392.576 | salida Cargo; instaladores históricos en `release/` | `cargo test` / installer | medio | pendiente pruebas Rust e installer 0.8 |
| ocho logs raíz | 8 | 1.913.231 | diagnósticos locales ignorados, sin referencias | ejecución correspondiente | bajo | no necesaria para producto |

Total: **15.409 archivos y 17.074.905.665 bytes**.

## Artefactos protegidos tras la eliminación

- `release/WatchPrototypeLab-Instalador-Windows-x64-v0.7.0.exe`: `8d50904050237d3a38c0bb28393e3c6b0f1886624856ae5210dc045a55aac9ca`.
- `src-tauri/binaries/watchlab-cad-x86_64-pc-windows-msvc.exe`: `3417670ade1644c39f47b598f0a3ad0ce7327d6fde19f202c5ad01c5434654e1`.

No se eliminó ningún dato privado, base SQLite, `.wplab`, foto, medición, checkpoint, libro, secreto ni fuente declarativa.

## Consolidación de entregas registrada tras validar 0.8.0

Después de instalar y abrir 0.8.0 se protegieron las dos versiones de retorno acordadas: 0.7.0 y 0.8.0, cada una con hash y manifiesto versionado. Se inventariaron siete instaladores superseded, junto con sus siete sidecars de hash: 14 archivos y 756.715.851 bytes. Su retirada no se ejecutó porque la política de seguridad del entorno bloqueó dos intentos de borrado aun usando rutas literales verificadas. Permanecen intactos en `release/`; no se empleó un mecanismo alternativo para eludir esa protección.

| Versión retirada | Bytes del EXE | SHA-256 registrado antes de borrar |
|---|---:|---|
| 0.4.0 | 107.838.223 | `d688c783322eb5589f78019ea5586b66e6441092bf80f3588119171b5ef4f1e4` |
| 0.4.1 | 107.831.103 | `0b4d1c91061bad97fc98da8f518de7192ae32d1c9a11b71eebd1a0da0940d7bd` |
| 0.5.0 | 108.203.373 | `abe4dab3d1c7554c5fc9beb4fa7c822bbb9e8448b08db6b87af218a057a06f06` |
| 0.5.1 | 108.203.457 | `9e48abd90facdf2342c86bd2194fb29a451af9580bcb25638a7d89895144f22a` |
| 0.5.2 | 108.206.114 | `7a3b0f0c16b2b14068e6a5137c62d6415ceb612960a53bcda88e52d0676f79c2` |
| 0.5.3 | 108.213.932 | `530307606a8ca509a3728534b9c991d2ef603ef8bf5a5e56cc18f7f59b6b4ba0` |
| 0.6.0 | 108.218.816 | `f1b81ce648ee8dad52c8bf1f0411a4a847a20efe176cd1f72f0fc68fbaf8a921` |

El instalador final 0.8.0 quedó protegido con SHA-256 `a0e4dc34155cdc0a43d8e43e9ac19ddd3f35e16eb83add7ca005cce7e3b6eaba`; 0.7.0 conserva `8d50904050237d3a38c0bb28393e3c6b0f1886624856ae5210dc045a55aac9ca`.

Tras validar e instalar 0.8.0 se ejecutó `cargo clean --manifest-path src-tauri/Cargo.toml`: 9.314 archivos y 8,3 GiB de salida Rust regenerable fueron retirados. El ejecutable instalado y los instaladores 0.7/0.8 permanecen fuera de `target/`.

La reconstrucción final posterior al cierre del último warning editorial generó un nuevo `target`; tras reinstalar el artefacto definitivo se limpió otra vez: 3.971 archivos y 2,4 GiB. Ninguna de las dos limpiezas incluyó datos de usuario.
