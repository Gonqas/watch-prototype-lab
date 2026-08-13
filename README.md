# Watch Prototype Lab

Watch Prototype Lab is a private desktop engineering studio for designing complete watches around real movement constraints. It combines a watch-specific parametric editor, a live Three.js assembly, an OpenCascade CAD kernel and traceable engineering diagnostics.

It is deliberately not a generic CAD modeller. A design is never blocked because it is invalid: parts remain editable, collisions stay visible and every result states whether it comes from official, supplier, measured, estimated or unknown data.

## Product areas

- **Montaje**: complete axial stack, exterior watch geometry, direct 3D manipulation, section, isolate and exploded views.
- **Piezas**: contextual editing of case, bezel, rehaut, dial graphics, crystal, hands, strap, stem, crown and movement.
- **Movimiento**: quartz, reference mechanical movements and a scratch multicalibre builder with donor-component compatibility.
- **Validacion**: geometry, assembly constraints, kinematics, dynamics, tolerance analysis and exact CAD checks.
- **Fabricacion**: printability rules, process allowances and STEP, STL, 3MF and GLB export.
- **Proyectos**: local projects, reusable parts, templates, `.wplab` packages and JSON interchange.
- **Aprender**: academia personal separada del proyecto técnico, con teoría primero, modelos y dossiers trazables, fabricación y acabados, ruta de reloj propio, validación independiente, progreso local y funcionamiento sin conexión.

The product includes Miyota 2035 and 2036 bases, official-source Miyota 8215 and 9015 scratch studies, configurable 34 mm manual and automatic mechanical movements, and an empty movement workflow for assembling a calibre from donor components. The library links each curated Miyota record to its current official specification, drawing, manual and parts list. Undo/redo, autosave, PNG capture and a persistent local SQLite library are built in.

## Building a movement from donor watches

1. Open a source movement, select a mechanical set (plate, bridge, train arbor, balance, escapement, mainspring, keyless works, jewels or rotor) and document its manufacturer, calibre, reference, measurement confidence and disassembly notes.
2. Save the active set to the component bank. Its functional interfaces, tolerances and original project remain attached to it.
3. Open **Movimiento desde cero**, select the target set and inspect donor candidates. The compatibility engine checks case/plate envelope, depthing, pivots and jewels, frequency, stem axis, bridge height and rotor sweep as applicable.
4. Apply compatible or conditional parts. Blocked transplants require an explicit forced action and retain the reasons in the report.
5. In Desktop, import a `.step`/`.stp` donor part to validate the solid with OpenCascade and prefill the dimensions that can be inferred from its exact envelope. Functional interfaces still require real metrology.

The resulting movement records whether each set was designed, measured, imported or transplanted, together with its reliability. This makes hybrid movements possible without presenting an approximate donor fit as production-ready.

## Hyperreal presentation

The third render mode assembles the complete exterior with bezel, rehaut, applied indices, minute track, strap or bracelet, spring bars and clasp. It provides studio environments, presentation surfaces, exposure, material/finish controls and configurable metal, dial and strap response while keeping technical overlays optional.

## Engineering core

The canonical model stores dimensions, tolerances, reference datums and provenance. The renderer, inspectors, collision engine, tolerance solver and CAD sidecar all consume that same model.

Current checks include:

- movement, dial, holder, back, crystal, stem and crown envelopes;
- dial recesses, reliefs and real curved-hand height profiles;
- static hand contacts and continuous 360 degree sweep volumes;
- movement-to-case, movement-to-dial, rotor-to-train and bridge headroom;
- fitting diameters, stem alignment, axial freedom and assembly constraints;
- gear ratio, depthing, radial overlap, pinion engagement and plate clearance;
- Swiss-lever escapement frequency and reserve estimates;
- automatic rotor inertia, winding torque margin and daily energy balance;
- nominal, worst-corner and Monte Carlo tolerance results;
- process-specific printability and unresolved-data warnings.

OpenCascade performs exact solid intersection, distance and continuous-envelope analysis in the desktop build. Kernel failures are reported as indeterminate and never converted into a false pass.

## Reliability

Every validation carries a confidence level. Unknown case interiors, hand tube heights or material properties remain explicit pending measurements. The tool can reject geometric impossibilities reliably when the geometry is known, but it does not replace pressure, fatigue, wear, lubrication, shock or production testing on a physical prototype.

## Architecture

- `src/vnext/model.ts`: canonical project schema (version 5), tolerances, appearance and component provenance.
- `src/core/componentCompatibility.ts`: donor extraction, interface reports and controlled component transplants.
- `src/vnext/geometry.ts`: shared physical datums, profiles and stack geometry.
- `src/vnext/engine.ts`: unified engineering report and conflict severity.
- `src/vnext/mechanics.ts`: train, depthing and mechanical-movement calculations.
- `src/core/automatic.ts`: automatic winding model.
- `src/vnext/tolerance.ts`: nominal, worst-corner and Monte Carlo solver.
- `src/vnext/StudioViewport.tsx`: React Three Fiber technical, product and hyperreal viewport.
- `src/vnext/store.ts`: history, autosave, project and reusable-part libraries.
- `src/learning/technical`: fuentes oficiales, ledger R0–R4, fixtures estructurales, selectores y relaciones de Sistema 4B.
- `cad-engine/watchlab_cad`: Python/OpenCascade exact CAD sidecar.
- `src-tauri`: native Tauri shell, SQLite persistence and CAD process bridge.

The old implementation remains isolated under `src/components`, `src/logic` and `src/store`; the production entry point uses only the `vnext` application.

## Development

```powershell
npm install
npm run dev
npm run verify
npm run cad:test
npm run learning:fixture-report
```

The OpenCascade environment is expected at `.venv-cad`. Build its native sidecar with:

```powershell
npm run cad:package
```

Run the local desktop application with:

```powershell
npm run desktop
```

Create the localized Windows installer, verify it and copy it to `release/` with a clear filename and SHA-256 file:

```powershell
npm run installer
```

End-user installation and release notes are in `docs/INSTALACION-WINDOWS.md`. The curated MIYOTA provenance policy is in `docs/FUENTES-MIYOTA.md`.

`npm run verify` runs ESLint, all Vitest suites, TypeScript and the production Vite build.

## Private reference library

The repository includes the original books, archives and editorial blueprint used to build and audit the personal academy under `reference-library/originals`. Large files are stored with Git LFS. `reference-library/MANIFEST.md` records their size and SHA-256 digest so every local copy can be verified.

The library is source material, not application runtime data. Personal learning sessions, local databases, `.wplab` projects, backups, caches and intermediate build outputs remain excluded from version control.

The current verified Windows installer, checksum and release manifest are kept under `release/`; obsolete installers remain excluded by the release cleanup workflow.
