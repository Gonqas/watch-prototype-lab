from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

from watchlab_cad.protocol import handle_request
from watchlab_cad import analysis
from watchlab_cad.builders import build_project
from watchlab_cad.occ import is_valid


ROOT = Path(__file__).resolve().parents[2]


def load_fixture() -> dict:
    return json.loads((ROOT / "cad-engine" / "tests" / "fixtures" / "miyota-2035.json").read_text(encoding="utf-8"))


def mechanical_fixture() -> dict:
    project = deepcopy(load_fixture())

    def dim(value: float) -> dict:
        return {"value": value}

    def arbor(identifier: str, x: float, y: float, wheel: int, pinion: int, module: float, wheel_z: float, pinion_z: float) -> dict:
        return {
            "id": identifier,
            "x": dim(x),
            "y": dim(y),
            "wheelTeeth": dim(wheel),
            "pinionTeeth": dim(pinion),
            "moduleToNext": dim(module),
            "pressureAngle": dim(20),
            "profileShift": dim(0),
            "wheelZ": dim(wheel_z),
            "pinionZ": dim(pinion_z),
            "wheelThickness": dim(0.16),
            "pinionThickness": dim(0.24),
            "pivotDiameter": dim(0.2 if identifier != "barrel" else 0.8),
            "pivotLength": dim(0.9),
            "jewelHoleDiameter": dim(0.22 if identifier != "barrel" else 0.82),
            "jewelOuterDiameter": dim(1.5 if identifier != "barrel" else 2.5),
        }

    project["case"]["outerDiameter"] = dim(42)
    project["case"]["innerDiameter"] = dim(36)
    project["case"]["totalHeight"] = dim(11.5)
    project["case"]["usableInteriorHeight"] = dim(9.1)
    project["dial"]["diameter"] = dim(34)
    project["dial"]["seatZ"] = dim(6.15)
    project["movement"] = {
        "kind": "mechanical",
        "name": "Mechanical CAD test",
        "plateDiameter": dim(34),
        "plateThickness": dim(0.6),
        "totalHeight": dim(4.8),
        "bridgeThickness": dim(0.45),
        "bridgeTopZ": dim(4.8),
        "stemAxisZ": dim(1.8),
        "balance": {"x": dim(-5.3), "y": dim(-6.2), "diameter": dim(9.5), "thickness": dim(0.35), "z": dim(2.35)},
        "arbors": [
            arbor("barrel", -7.612, 2.77, 96, 1, 0.15, 0.85, 0.85),
            arbor("center", 0, 0, 80, 12, 0.12, 1.25, 0.85),
            arbor("third", 4.423, 3.097, 75, 10, 0.11, 1.62, 1.25),
            arbor("fourth", 5.235, -1.507, 80, 10, 0.1, 1.98, 1.62),
            arbor("escape", 1.101, -3.012, 18, 8, 0.18, 2.32, 1.98),
        ],
    }
    return project


def test_health_exposes_exact_kernel() -> None:
    result = handle_request({"command": "health"})
    assert result["ok"] is True
    assert result["engine"]["kernel"] == "OpenCascade"
    assert "exact-distance" in result["engine"]["capabilities"]


def test_kernel_failure_is_never_reported_as_valid_contact(monkeypatch) -> None:
    def fail_distance(_first, _second):
        raise RuntimeError("kernel failed")

    monkeypatch.setattr(analysis, "exact_distance", fail_distance)
    report = analysis._pair_report("a", "b", object(), object(), 0.005)
    assert report["state"] == "indeterminate"
    assert report["exact"] is False
    assert report["distanceMm"] is None


def test_minimum_clearance_includes_continuous_sweeps() -> None:
    collisions = [{"state": "clear", "distanceMm": 0.4}]
    sweeps = [{"state": "clear", "minimumDistanceMm": 0.18}]
    assert analysis._minimum_clearance(collisions, sweeps) == 0.18


def test_mechanical_movement_builds_valid_wheels_pinions_pivots_and_jewels() -> None:
    parts = build_project(mechanical_fixture())
    assert all(is_valid(part.shape) for part in parts)
    assert sum(part.part_id == "jewel" for part in parts) == 10
    assert any(part.part_id == "barrel" and part.metadata["includesPinion"] is False for part in parts)
    assert any(part.part_id == "center" and part.metadata["includesPinion"] is True for part in parts)
    grouped = analysis._fuse_group(parts)
    assert "movement" in grouped
    assert is_valid(grouped["movement"])


def test_builds_valid_watch_parts_and_exact_pairs() -> None:
    result = handle_request({"command": "analyze", "project": load_fixture()})
    assert result["ok"] is True
    assert result["partCount"] >= 10
    assert result["analysis"]["invalidParts"] == []
    assert any(pair["first"] == "movement" and pair["second"] == "case" for pair in result["analysis"]["collisions"])
    assert any(item["method"] == "continuous-rotational-envelope" for item in result["analysis"]["sweepCollisions"])
    assert any(item["method"] == "paired-continuous-rotational-envelopes" for item in result["analysis"]["sweepCollisions"])


def test_automatic_rotor_is_exported_and_analyzed_as_a_full_sweep() -> None:
    project = mechanical_fixture()
    project["movement"]["architecture"] = "automatic"
    project["movement"]["trainBaseZ"] = {"value": 0.9}
    project["movement"]["bridgeTopZ"] = {"value": 5.65}
    project["movement"]["totalHeight"] = {"value": 5.8}
    project["movement"]["automatic"] = {
        "rotorDiameter": {"value": 31.5},
        "rotorThickness": {"value": 0.65},
        "rotorZ": {"value": 0.15},
        "bearingDiameter": {"value": 3.2},
        "reverserType": "bidirectional",
    }
    parts = build_project(project)
    rotor = next(part for part in parts if part.part_id == "rotor")
    assert is_valid(rotor.shape)
    assert rotor.analysis_shape is not None and is_valid(rotor.analysis_shape)
    result = analysis.analyze_parts(parts, project=project)
    assert any(pair["first"] == "rotor" and pair["second"] == "plate" for pair in result["collisions"])


def test_continuous_sweep_detects_a_relief_outside_the_static_hand_angle() -> None:
    project = deepcopy(load_fixture())
    project["dial"]["reliefs"] = [
        {
            "id": "test-tall-index",
            "name": "Tall index",
            "shape": "block",
            "x": {"value": 7.0},
            "y": {"value": 0.0},
            "width": {"value": 1.0},
            "length": {"value": 1.0},
            "height": {"value": 2.0},
        }
    ]
    result = handle_request({"command": "analyze", "project": project})
    sweep = result["analysis"]["sweepCollisions"]
    assert any(item["obstacle"] == "relief:test-tall-index" and item["state"] == "collision" for item in sweep)


def test_exports_step_and_mesh_files(tmp_path: Path) -> None:
    result = handle_request(
        {
            "command": "export",
            "project": load_fixture(),
            "outputDir": str(tmp_path),
            "formats": ["step", "stl"],
        }
    )
    assert result["ok"] is True
    assert any(item["format"] == "step" and Path(item["path"]).exists() for item in result["artifacts"])
    assert any(item["format"] == "stl" and Path(item["path"]).exists() for item in result["artifacts"])
    step_path = next(Path(item["path"]) for item in result["artifacts"] if item["format"] == "step")
    inspection = handle_request({"command": "inspect-step", "inputPath": str(step_path)})
    assert inspection["ok"] is True
    assert inspection["inspection"]["valid"] is True
    assert inspection["inspection"]["volumeMm3"] > 0
    assert all(value > 0 for value in inspection["inspection"]["size"])
