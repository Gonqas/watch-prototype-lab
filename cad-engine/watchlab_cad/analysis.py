from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from OCP.TopoDS import TopoDS_Shape

from .builders import CadPart
from .occ import area, bounds, common, compound, exact_distance, is_valid, volume, write_3mf, write_glb, write_step, write_stl


COLLISION_PAIRS = [
    ("movement", "case"),
    ("movement", "back"),
    ("movement", "dial"),
    ("dial", "case"),
    ("hourHand", "minuteHand"),
    ("hourHand", "secondHand"),
    ("minuteHand", "secondHand"),
    ("crystal", "case"),
    ("stem", "case"),
    ("stem", "crown"),
    ("rotor", "plate"),
    ("rotor", "balance"),
]

MECHANICAL_COMPONENT_IDS = {
    "plate",
    "bridge",
    "barrel",
    "center",
    "third",
    "fourth",
    "escape",
    "balance",
    "jewel",
    "pallet",
    "keyless",
    "rotor",
}


def _fuse_group(parts: list[CadPart]) -> dict[str, TopoDS_Shape]:
    grouped: dict[str, list[TopoDS_Shape]] = defaultdict(list)
    for part in parts:
        grouped[part.part_id].append(part.analysis_shape if part.analysis_shape is not None else part.shape)
    result = {part_id: shapes[0] if len(shapes) == 1 else compound(shapes) for part_id, shapes in grouped.items()}
    if "movement" not in result:
        movement_shapes = [shape for part_id, shape in result.items() if part_id in MECHANICAL_COMPONENT_IDS]
        if movement_shapes:
            result["movement"] = compound(movement_shapes)
    return result


def _pair_report(first_id: str, second_id: str, first: TopoDS_Shape, second: TopoDS_Shape, contact_tolerance: float) -> dict[str, Any]:
    try:
        distance = exact_distance(first, second)
        if distance <= contact_tolerance:
            overlap_shape = common(first, second)
            overlap = 0.0 if overlap_shape.IsNull() else volume(overlap_shape)
        else:
            overlap = 0.0
    except (ValueError, RuntimeError) as error:
        return {
            "first": first_id,
            "second": second_id,
            "state": "indeterminate",
            "distanceMm": None,
            "intersectionVolumeMm3": None,
            "exact": False,
            "error": str(error) or error.__class__.__name__,
        }
    state = "collision" if overlap > 1e-6 else "contact" if distance <= contact_tolerance else "clear"
    return {
        "first": first_id,
        "second": second_id,
        "state": state,
        "distanceMm": distance,
        "intersectionVolumeMm3": overlap,
        "exact": True,
    }


def _minimum_clearance(collisions: list[dict[str, Any]], sweeps: list[dict[str, Any]]) -> float | None:
    clearances = [
        item["distanceMm"]
        for item in collisions
        if item["state"] == "clear" and isinstance(item.get("distanceMm"), (int, float))
    ]
    clearances.extend(
        item["minimumDistanceMm"]
        for item in sweeps
        if item["state"] == "clear" and isinstance(item.get("minimumDistanceMm"), (int, float))
    )
    return min(clearances, default=None)


def _analyze_sweeps(project: dict[str, Any], grouped: dict[str, TopoDS_Shape], contact_tolerance: float) -> list[dict[str, Any]]:
    from .builders import build_hand_sweep

    obstacles = {
        part_id: shape
        for part_id, shape in grouped.items()
        if part_id in {"dial", "crystal"} or part_id.startswith("relief:")
    }
    reports: list[dict[str, Any]] = []
    hand_sweeps: dict[str, TopoDS_Shape] = {}
    for hand_key, hand_id in (("hour", "hourHand"), ("minute", "minuteHand"), ("second", "secondHand")):
        sweep = build_hand_sweep(project, hand_key)
        if sweep is None:
            continue
        hand_sweeps[hand_id] = sweep.shape
        for obstacle_id, obstacle in obstacles.items():
            report = _pair_report(hand_id, obstacle_id, sweep.shape, obstacle, contact_tolerance)
            reports.append(
                {
                    "hand": hand_id,
                    "obstacle": obstacle_id,
                    "state": report["state"],
                    "minimumDistanceMm": report["distanceMm"],
                    "intersectionVolumeMm3": report["intersectionVolumeMm3"],
                    "anglesTested": 360,
                    "method": "continuous-rotational-envelope",
                    "exact": report["exact"],
                    **({"error": report["error"]} if "error" in report else {}),
                }
            )
    hand_ids = list(hand_sweeps)
    for first_index, first_id in enumerate(hand_ids):
        for second_id in hand_ids[first_index + 1:]:
            report = _pair_report(first_id, second_id, hand_sweeps[first_id], hand_sweeps[second_id], contact_tolerance)
            reports.append(
                {
                    "hand": first_id,
                    "obstacle": second_id,
                    "state": report["state"],
                    "minimumDistanceMm": report["distanceMm"],
                    "intersectionVolumeMm3": report["intersectionVolumeMm3"],
                    "anglesTested": "continuous-relative-cycle",
                    "method": "paired-continuous-rotational-envelopes",
                    "exact": report["exact"],
                    **({"error": report["error"]} if "error" in report else {}),
                }
            )
    return reports


def analyze_parts(parts: list[CadPart], contact_tolerance: float = 0.005, project: dict[str, Any] | None = None) -> dict[str, Any]:
    grouped = _fuse_group(parts)
    part_reports: list[dict[str, Any]] = []
    for part in parts:
        xmin, ymin, zmin, xmax, ymax, zmax = bounds(part.shape)
        part_reports.append(
            {
                "name": part.name,
                "partId": part.part_id,
                "valid": is_valid(part.shape),
                "volumeMm3": volume(part.shape),
                "areaMm2": area(part.shape),
                "bounds": {"min": [xmin, ymin, zmin], "max": [xmax, ymax, zmax]},
                "metadata": part.metadata,
            }
        )
    collisions: list[dict[str, Any]] = []
    for first_id, second_id in COLLISION_PAIRS:
        first = grouped.get(first_id)
        second = grouped.get(second_id)
        if first is None or second is None:
            continue
        collisions.append(_pair_report(first_id, second_id, first, second, contact_tolerance))
    sweep_collisions = _analyze_sweeps(project, grouped, contact_tolerance) if project is not None else []
    return {
        "parts": part_reports,
        "collisions": collisions,
        "minimumClearanceMm": _minimum_clearance(collisions, sweep_collisions),
        "invalidParts": [item["name"] for item in part_reports if not item["valid"]],
        "sweepCollisions": sweep_collisions,
    }


def _safe_name(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", name).strip("-")
    return cleaned or "part"


def export_parts(parts: list[CadPart], output_dir: Path, formats: list[str]) -> list[dict[str, Any]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts: list[dict[str, Any]] = []
    normalized = {item.lower().lstrip(".") for item in formats}
    if "step" in normalized or "stp" in normalized:
        path = output_dir / "watch-assembly.step"
        write_step([part.shape for part in parts], path)
        artifacts.append({"format": "step", "path": str(path), "bytes": path.stat().st_size})
    if "glb" in normalized or "gltf" in normalized:
        path = output_dir / "watch-assembly.glb"
        write_glb([(part.name, part.shape, part.color) for part in parts], path)
        artifacts.append({"format": "glb", "path": str(path), "bytes": path.stat().st_size})
    if "3mf" in normalized:
        path = output_dir / "watch-assembly.3mf"
        write_3mf([(part.name, part.shape) for part in parts if part.part_id != "crystal"], path)
        artifacts.append({"format": "3mf", "path": str(path), "bytes": path.stat().st_size})
    if "stl" in normalized:
        part_dir = output_dir / "parts"
        part_dir.mkdir(exist_ok=True)
        for index, part in enumerate(parts):
            if part.part_id in {"crystal", "stem"}:
                continue
            path = part_dir / f"{index:02d}-{_safe_name(part.name)}.stl"
            write_stl(part.shape, path)
            artifacts.append({"format": "stl", "partId": part.part_id, "path": str(path), "bytes": path.stat().st_size})
    return artifacts
