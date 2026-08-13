from pathlib import Path

project_root = Path(SPECPATH).parent
engine_root = project_root / "cad-engine"

analysis = Analysis(
    [str(engine_root / "sidecar_entry.py")],
    pathex=[str(engine_root)],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["cadquery", "casadi", "vtk", "vtkmodules", "numpy", "scipy", "numba", "matplotlib", "notebook", "IPython", "PyQt5", "PySide6"],
    noarchive=False,
    optimize=1,
)

pyz = PYZ(analysis.pure)

executable = EXE(
    pyz,
    analysis.scripts,
    [],
    exclude_binaries=True,
    name="watchlab-cad",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

collection = COLLECT(
    executable,
    analysis.binaries,
    analysis.datas,
    strip=False,
    upx=False,
    name="watchlab-cad",
)
