from __future__ import annotations

import platform
from pathlib import Path
from time import perf_counter
from typing import Any

import OCP
from pydantic import BaseModel, ConfigDict, Field

from . import ENGINE_VERSION, PROTOCOL_VERSION
from .analysis import analyze_parts, export_parts
from .builders import build_project
from .occ import area, bounds, is_valid, read_step, volume


class EngineRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    protocolVersion: int = PROTOCOL_VERSION
    command: str
    project: dict[str, Any] | None = None
    outputDir: str | None = None
    inputPath: str | None = None
    formats: list[str] = Field(default_factory=list)
    contactToleranceMm: float = 0.005


def engine_info() -> dict[str, Any]:
    return {
        "name": "WatchLab OpenCascade Engine",
        "engineVersion": ENGINE_VERSION,
        "protocolVersion": PROTOCOL_VERSION,
        "openCascadeVersion": OCP.__version__,
        "pythonVersion": platform.python_version(),
        "kernel": "OpenCascade",
        "capabilities": ["brep", "exact-distance", "boolean-intersection", "step-import", "step", "stl", "3mf", "glb"],
    }


def handle_request(payload: dict[str, Any]) -> dict[str, Any]:
    started = perf_counter()
    request = EngineRequest.model_validate(payload)
    if request.protocolVersion != PROTOCOL_VERSION:
        raise ValueError(f"Unsupported protocol version {request.protocolVersion}")
    if request.command == "health":
        return {"ok": True, "engine": engine_info(), "durationMs": (perf_counter() - started) * 1000}
    if request.command == "inspect-step":
        if not request.inputPath:
            raise ValueError("inputPath is required for STEP inspection")
        path = Path(request.inputPath).resolve()
        shape = read_step(path)
        limits = bounds(shape)
        return {
            "ok": True,
            "engine": engine_info(),
            "inspection": {
                "fileName": path.name,
                "valid": is_valid(shape),
                "volumeMm3": volume(shape),
                "areaMm2": area(shape),
                "bounds": {"min": list(limits[:3]), "max": list(limits[3:])},
                "size": [limits[3] - limits[0], limits[4] - limits[1], limits[5] - limits[2]],
                "center": [(limits[0] + limits[3]) / 2, (limits[1] + limits[4]) / 2, (limits[2] + limits[5]) / 2],
            },
            "durationMs": (perf_counter() - started) * 1000,
        }
    if request.project is None:
        raise ValueError("A project is required for this command")
    parts = build_project(request.project)
    result: dict[str, Any] = {
        "ok": True,
        "engine": engine_info(),
        "projectId": request.project.get("id"),
        "partCount": len(parts),
    }
    if request.command in {"analyze", "build", "export"}:
        result["analysis"] = analyze_parts(parts, request.contactToleranceMm, request.project)
    if request.command in {"build", "export"}:
        if not request.outputDir:
            raise ValueError("outputDir is required for build/export")
        formats = request.formats or (["step", "glb"] if request.command == "build" else ["step"])
        result["artifacts"] = export_parts(parts, Path(request.outputDir).resolve(), formats)
    result["durationMs"] = (perf_counter() - started) * 1000
    return result
