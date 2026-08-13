from __future__ import annotations

from dataclasses import dataclass, field
from math import atan, atan2, cos, hypot, pi, sin, sqrt, tan
from typing import Any

from OCP.TopoDS import TopoDS_Shape

from .occ import (
    axial_cylinder,
    centered_box,
    compound,
    cut,
    cylinder,
    fuse,
    fuse_all,
    polygon_prism,
    prism_between,
    revolved_profile,
    rounded_prism,
)
from .project import bool_value, dimension, list_value, nested, string_value


@dataclass(slots=True)
class CadPart:
    name: str
    part_id: str
    shape: TopoDS_Shape
    color: tuple[float, float, float, float]
    metadata: dict[str, Any] = field(default_factory=dict)
    analysis_shape: TopoDS_Shape | None = None


COLORS: dict[str, tuple[float, float, float, float]] = {
    "case": (0.52, 0.62, 0.68, 1.0),
    "back": (0.42, 0.48, 0.52, 1.0),
    "movement": (0.63, 0.38, 0.78, 1.0),
    "plate": (0.72, 0.55, 0.31, 1.0),
    "bridge": (0.78, 0.61, 0.35, 1.0),
    "barrel": (0.82, 0.51, 0.20, 1.0),
    "center": (0.87, 0.72, 0.30, 1.0),
    "third": (0.31, 0.69, 0.49, 1.0),
    "fourth": (0.25, 0.61, 0.78, 1.0),
    "escape": (0.77, 0.32, 0.45, 1.0),
    "balance": (0.83, 0.42, 0.23, 1.0),
    "jewel": (0.80, 0.08, 0.28, 0.9),
    "rotor": (0.63, 0.54, 0.34, 1.0),
    "dial": (0.16, 0.58, 0.37, 1.0),
    "hourHand": (0.91, 0.58, 0.08, 1.0),
    "minuteHand": (0.94, 0.77, 0.12, 1.0),
    "secondHand": (0.91, 0.17, 0.22, 1.0),
    "crystal": (0.23, 0.68, 0.80, 0.25),
    "stem": (0.66, 0.69, 0.72, 1.0),
    "crown": (0.72, 0.75, 0.78, 1.0),
}


def _ring(outer_radius: float, inner_radius: float, height: float, z: float) -> TopoDS_Shape:
    outer = cylinder(outer_radius, height, z)
    inner = cylinder(min(outer_radius - 1e-4, inner_radius), height + 0.2, z - 0.1)
    return cut(outer, inner)


def _stack(project: dict[str, Any]) -> dict[str, float]:
    back_top = dimension(project, "case.backThickness", 1.2)
    movement_bottom = back_top + dimension(project, "assembly.movementBackClearance", 0.05)
    movement_height = (
        dimension(project, "movement.totalHeight", 4.8)
        if string_value(project, "movement.kind") == "mechanical"
        else dimension(project, "movement.thickness", 3.15)
    )
    dial_bottom = dimension(project, "dial.seatZ", movement_bottom + movement_height + 0.1)
    dial_top = dial_bottom + dimension(project, "dial.thickness", 0.4)
    crystal_edge = back_top + dimension(project, "case.usableInteriorHeight", 7.2)
    return {
        "back_top": back_top,
        "movement_bottom": movement_bottom,
        "movement_top": movement_bottom + movement_height,
        "dial_bottom": dial_bottom,
        "dial_top": dial_top,
        "crystal_edge": crystal_edge,
    }


def _case_parts(project: dict[str, Any]) -> list[CadPart]:
    stack = _stack(project)
    outer = dimension(project, "case.outerDiameter", 39.0)
    inner = min(outer - 0.2, dimension(project, "case.innerDiameter", 33.5))
    height = dimension(project, "case.totalHeight", 9.5)
    back = dimension(project, "case.backThickness", 1.2)
    outer_ring = _ring(outer / 2, inner / 2, max(0.1, height - back), back)
    bezel_outer = outer / 2 + 0.25
    crystal_seat = min(outer - 0.2, dimension(project, "case.crystalSeatDiameter", inner))
    bezel = _ring(bezel_outer, crystal_seat / 2, 0.6, height - 0.6)
    lug_spacing = dimension(project, "case.lugSpacing", 20.0)
    lug_width = dimension(project, "case.lugWidth", 3.0)
    lug_length = dimension(project, "case.lugLength", 5.2)
    lug_height = max(1.2, height * 0.46)
    lug_y = outer / 2 + lug_length / 2 - 1.0
    lugs = [
        centered_box(
            lug_width,
            lug_length,
            lug_height,
            (x_sign * (lug_spacing / 2 + lug_width / 2), y_sign * lug_y, height * 0.46),
        )
        for x_sign in (-1, 1)
        for y_sign in (-1, 1)
    ]
    case_shape = fuse_all([outer_ring, bezel, *lugs])
    seat_bottom = max(back, min(height - 0.05, stack["crystal_edge"] - 0.05))
    case_shape = cut(case_shape, cylinder(crystal_seat / 2, height - seat_bottom + 0.2, seat_bottom - 0.05))
    tube_radius = dimension(project, "case.crownTubeDiameter", 2.5) / 2
    stem_z = stack["movement_bottom"] + dimension(project, "movement.stemAxisZ", 1.55)
    case_shape = cut(case_shape, axial_cylinder(tube_radius, outer, (0, 0, stem_z), (1, 0, 0)))
    back_shape = cylinder(max(0.1, outer / 2 - 0.55), back)
    return [
        CadPart("case", "case", case_shape, COLORS["case"]),
        CadPart("back", "back", back_shape, COLORS["back"]),
    ]


def _involute_outline(teeth: int, module: float, pressure_angle_deg: float, profile_shift: float = 0.0) -> list[tuple[float, float]]:
    teeth = max(6, int(teeth))
    module = max(0.02, module)
    pressure = pressure_angle_deg * pi / 180
    pitch_radius = module * teeth / 2
    base_radius = pitch_radius * cos(pressure)
    tip_radius = pitch_radius + module * (1 + profile_shift)
    root_radius = max(module * 0.25, pitch_radius - module * (1.25 - profile_shift))
    half_tooth = pi / (2 * teeth) + 2 * profile_shift * tan(pressure) / teeth

    def involute(radius: float) -> float:
        ratio = max(1.0, radius / max(1e-9, base_radius))
        parameter = sqrt(ratio * ratio - 1)
        return parameter - atan(parameter)

    pitch_involute = involute(pitch_radius)
    start_radius = max(base_radius, root_radius)
    points: list[tuple[float, float]] = []
    for tooth in range(teeth):
        center = tooth * 2 * pi / teeth
        left: list[tuple[float, float]] = []
        right: list[tuple[float, float]] = []
        for index in range(7):
            radius = start_radius + (tip_radius - start_radius) * index / 6
            angle = half_tooth + pitch_involute - involute(radius)
            left.append((cos(center - angle) * radius, sin(center - angle) * radius))
            right.insert(0, (cos(center + angle) * radius, sin(center + angle) * radius))
        root_transition = half_tooth * 1.4
        points.append((cos(center - root_transition) * root_radius, sin(center - root_transition) * root_radius))
        points.extend(left)
        points.extend(right)
        points.append((cos(center + root_transition) * root_radius, sin(center + root_transition) * root_radius))
    return points


_BS978_RATIOS = [3, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12]
_BS978_FACTORS = {
    6: ([1.259, 1.280, 1.293, 1.303, 1.307, 1.310, 1.313, 1.315, 1.318, 1.320, 1.321, 1.323, 1.326, 1.328], [1.855, 1.886, 1.906, 1.920, 1.926, 1.930, 1.934, 1.938, 1.942, 1.944, 1.947, 1.949, 1.954, 1.957]),
    7: ([1.335, 1.359, 1.374, 1.385, 1.389, 1.393, 1.396, 1.399, 1.402, 1.404, 1.406, 1.408, 1.411, 1.414], [1.968, 2.003, 2.025, 2.041, 2.048, 2.053, 2.058, 2.062, 2.066, 2.069, 2.072, 2.075, 2.080, 2.084]),
    8: ([1.403, 1.430, 1.447, 1.459, 1.464, 1.468, 1.471, 1.475, 1.478, 1.480, 1.482, 1.484, 1.488, 1.491], [2.068, 2.107, 2.132, 2.150, 2.157, 2.163, 2.169, 2.173, 2.177, 2.181, 2.184, 2.187, 2.193, 2.197]),
    9: ([1.465, 1.494, 1.513, 1.526, 1.531, 1.536, 1.540, 1.543, 1.547, 1.549, 1.552, 1.554, 1.558, 1.561], [2.160, 2.202, 2.230, 2.249, 2.257, 2.263, 2.269, 2.274, 2.279, 2.283, 2.287, 2.290, 2.296, 2.301]),
    10: ([1.523, 1.554, 1.574, 1.588, 1.594, 1.599, 1.603, 1.607, 1.610, 1.613, 1.616, 1.618, 1.623, 1.626], [2.244, 2.290, 2.320, 2.341, 2.349, 2.356, 2.363, 2.368, 2.373, 2.377, 2.381, 2.385, 2.391, 2.397]),
    12: ([1.626, 1.661, 1.684, 1.700, 1.707, 1.712, 1.717, 1.721, 1.725, 1.728, 1.731, 1.734, 1.739, 1.743], [2.396, 2.448, 2.482, 2.505, 2.516, 2.523, 2.530, 2.536, 2.542, 2.547, 2.552, 2.556, 2.563, 2.569]),
    14: ([1.718, 1.756, 1.782, 1.799, 1.807, 1.812, 1.818, 1.822, 1.827, 1.830, 1.834, 1.837, 1.842, 1.847], [2.532, 2.589, 2.626, 2.652, 2.662, 2.671, 2.679, 2.686, 2.692, 2.697, 2.703, 2.707, 2.715, 2.722]),
    15: ([1.760, 1.801, 1.827, 1.845, 1.853, 1.859, 1.864, 1.869, 1.874, 1.878, 1.881, 1.884, 1.890, 1.895], [2.594, 2.654, 2.692, 2.719, 2.730, 2.739, 2.748, 2.755, 2.761, 2.767, 2.773, 2.777, 2.785, 2.792]),
    16: ([1.801, 1.843, 1.870, 1.889, 1.897, 1.903, 1.909, 1.914, 1.919, 1.923, 1.926, 1.929, 1.935, 1.940], [2.654, 2.715, 2.756, 2.784, 2.795, 2.804, 2.813, 2.820, 2.827, 2.833, 2.839, 2.844, 2.852, 2.859]),
}


def _interpolate(xs: list[float], ys: list[float], x: float) -> float:
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    upper = next(index for index, value in enumerate(xs) if value >= x)
    lower = upper - 1
    ratio = (x - xs[lower]) / (xs[upper] - xs[lower])
    return ys[lower] + (ys[upper] - ys[lower]) * ratio


def _bs978_factors(pinion_leaves: int, ratio: float) -> tuple[float, float]:
    rows = sorted(_BS978_FACTORS)
    leaves = max(rows[0], min(rows[-1], pinion_leaves))
    upper_index = next(index for index, value in enumerate(rows) if value >= leaves)
    lower_leaves = rows[max(0, upper_index - 1)]
    upper_leaves = rows[upper_index]
    low_a, low_r = _BS978_FACTORS[lower_leaves]
    high_a, high_r = _BS978_FACTORS[upper_leaves]
    leaf_ratio = 0 if upper_leaves == lower_leaves else (leaves - lower_leaves) / (upper_leaves - lower_leaves)
    addendum_low = _interpolate(_BS978_RATIOS, low_a, ratio)
    addendum_high = _interpolate(_BS978_RATIOS, high_a, ratio)
    radius_low = _interpolate(_BS978_RATIOS, low_r, ratio)
    radius_high = _interpolate(_BS978_RATIOS, high_r, ratio)
    return (
        addendum_low + (addendum_high - addendum_low) * leaf_ratio,
        radius_low + (radius_high - radius_low) * leaf_ratio,
    )


def _cycloidal_wheel_outline(teeth: int, pinion_leaves: int, module: float, backlash: float = 0.0) -> list[tuple[float, float]]:
    teeth = max(6, int(teeth))
    pinion_leaves = max(4, int(pinion_leaves))
    module = max(0.02, module)
    pitch = module * teeth / 2
    generator = module * pinion_leaves / 4
    addendum_factor, _ = _bs978_factors(pinion_leaves, teeth / pinion_leaves)
    addendum = module * addendum_factor
    root = max(module * 0.2, pitch - addendum)
    tip = pitch + addendum
    tooth_thickness = max(module * 0.08, pi * module / 2 - backlash / 2)
    half_tooth = tooth_thickness / (2 * pitch)

    def epicycloid(parameter: float) -> tuple[float, float]:
        return (
            (pitch + generator) * cos(parameter) - generator * cos((pitch + generator) / generator * parameter),
            (pitch + generator) * sin(parameter) - generator * sin((pitch + generator) / generator * parameter),
        )

    low = 0.0
    high = pi / pinion_leaves
    for _ in range(64):
        middle = (low + high) / 2
        if hypot(*epicycloid(middle)) < tip:
            low = middle
        else:
            high = middle
    sample_count = 5 if teeth > 60 else 7
    flank: list[tuple[float, float]] = []
    for index in range(sample_count + 1):
        point = epicycloid(high * index / sample_count)
        flank.append((hypot(*point), abs(atan2(point[1], point[0]))))
    polar_scale = min(1.0, half_tooth * 0.85 / max(1e-9, flank[-1][1]))
    points: list[tuple[float, float]] = []
    for tooth in range(teeth):
        center = tooth * 2 * pi / teeth
        points.append((cos(center - half_tooth * 1.35) * root, sin(center - half_tooth * 1.35) * root))
        for radius, polar in flank:
            angle = center - half_tooth + polar * polar_scale
            points.append((cos(angle) * radius, sin(angle) * radius))
        for radius, polar in reversed(flank):
            angle = center + half_tooth - polar * polar_scale
            points.append((cos(angle) * radius, sin(angle) * radius))
        points.append((cos(center + half_tooth * 1.35) * root, sin(center + half_tooth * 1.35) * root))
    return points


def _cycloidal_pinion_outline(wheel_teeth: int, leaves: int, module: float, backlash: float = 0.0) -> list[tuple[float, float]]:
    leaves = max(4, int(leaves))
    module = max(0.02, module)
    pitch = module * leaves / 2
    addendum_factor, _ = _bs978_factors(leaves, wheel_teeth / leaves)
    root = max(module * 0.22, pitch - module * (addendum_factor + 0.4))
    tip = pitch + module * 0.4
    thickness = max(module * 0.08, pi * module / 2 - backlash / 2)
    half = thickness / (2 * pitch)
    points: list[tuple[float, float]] = []
    for leaf in range(leaves):
        center = leaf * 2 * pi / leaves
        for radius, offset in (
            (root, -half),
            (pitch, -half),
            (tip, -half * 0.62),
            (tip + module * 0.04, 0),
            (tip, half * 0.62),
            (pitch, half),
            (root, half),
        ):
            points.append((cos(center + offset) * radius, sin(center + offset) * radius))
    return points


def _mechanical_parts(project: dict[str, Any], stack: dict[str, float]) -> list[CadPart]:
    parts: list[CadPart] = []
    plate_radius = dimension(project, "movement.plateDiameter", 34.0) / 2
    plate_thickness = dimension(project, "movement.plateThickness", 0.6)
    train_base = dimension(project, "movement.trainBaseZ", 0.0)
    bridge_top = dimension(project, "movement.bridgeTopZ", 4.8)
    parts.append(CadPart("plate", "plate", cylinder(plate_radius, plate_thickness, stack["movement_bottom"] + train_base), COLORS["plate"]))
    arbors = list_value(project, "movement.arbors")
    for index, arbor in enumerate(arbors):
        arbor_id = str(arbor.get("id", f"wheel-{index}"))
        x = dimension(arbor, "x")
        y = dimension(arbor, "y")
        teeth = int(dimension(arbor, "wheelTeeth", 60))
        module = dimension(arbor, "moduleToNext", 0.1)
        pressure = dimension(arbor, "pressureAngle", 20)
        shift = dimension(arbor, "profileShift", 0)
        backlash = dimension(arbor, "backlash", 0.0)
        next_arbor = arbors[index + 1] if index + 1 < len(arbors) else None
        profile = str(arbor.get("profileToNext", "cycloidal"))
        wheel_z = stack["movement_bottom"] + train_base + dimension(arbor, "wheelZ", 1.2)
        thickness = dimension(arbor, "wheelThickness", 0.16)
        wheel_outline = (
            _cycloidal_wheel_outline(teeth, int(dimension(next_arbor, "pinionTeeth", 10)), module, backlash)
            if profile == "cycloidal" and next_arbor is not None
            else _involute_outline(teeth, module, pressure, shift)
        )
        wheel = polygon_prism(wheel_outline, wheel_z - thickness / 2, thickness)
        if profile == "cycloidal" and next_arbor is not None:
            addendum_factor, _ = _bs978_factors(int(dimension(next_arbor, "pinionTeeth", 10)), teeth / max(1, int(dimension(next_arbor, "pinionTeeth", 10))))
            wheel_tip = module * teeth / 2 + module * addendum_factor
        else:
            wheel_tip = module * teeth / 2 + module * (1 + shift)
        pivot_diameter = dimension(arbor, "pivotDiameter", 0.2)
        pivot_length = max(0.1, bridge_top - train_base - 0.28)
        pivot = cylinder(pivot_diameter / 2, pivot_length, stack["movement_bottom"] + train_base + 0.08, (x, y))
        analysis_shapes = [cylinder(max(0.05, wheel_tip), thickness, wheel_z - thickness / 2, (x, y)), pivot]
        if abs(x) > 1e-9 or abs(y) > 1e-9:
            wheel = polygon_prism(
                [(px + x, py + y) for px, py in wheel_outline],
                wheel_z - thickness / 2,
                thickness,
            )
        arbor_shape = fuse(wheel, pivot)
        if index > 0:
            previous = arbors[index - 1]
            pinion_teeth = int(dimension(arbor, "pinionTeeth", 10))
            pinion_module = dimension(previous, "moduleToNext", module)
            pinion_pressure = dimension(previous, "pressureAngle", pressure)
            pinion_shift = dimension(arbor, "profileShift", shift)
            previous_profile = str(previous.get("profileToNext", "cycloidal"))
            previous_backlash = dimension(previous, "backlash", 0.0)
            pinion_z = stack["movement_bottom"] + train_base + dimension(arbor, "pinionZ", 0.9)
            pinion_thickness = dimension(arbor, "pinionThickness", 0.24)
            pinion_outline = (
                _cycloidal_pinion_outline(int(dimension(previous, "wheelTeeth", 60)), pinion_teeth, pinion_module, previous_backlash)
                if previous_profile == "cycloidal"
                else _involute_outline(pinion_teeth, pinion_module, pinion_pressure, pinion_shift)
            )
            if abs(x) > 1e-9 or abs(y) > 1e-9:
                pinion_outline = [(px + x, py + y) for px, py in pinion_outline]
            pinion = polygon_prism(pinion_outline, pinion_z - pinion_thickness / 2, pinion_thickness)
            arbor_shape = fuse(arbor_shape, pinion)
            pinion_tip = (
                pinion_module * pinion_teeth / 2 + pinion_module * 0.44
                if previous_profile == "cycloidal"
                else pinion_module * pinion_teeth / 2 + pinion_module * (1 + pinion_shift)
            )
            analysis_shapes.append(cylinder(max(0.05, pinion_tip), pinion_thickness, pinion_z - pinion_thickness / 2, (x, y)))
        if arbor_id == "barrel":
            drum_radius = max(0.8, module * teeth / 2 - 0.55)
            drum = cylinder(drum_radius, 0.72, max(stack["movement_bottom"] + train_base + 0.1, wheel_z - 0.58), (x, y))
            arbor_shape = fuse(arbor_shape, drum)
            analysis_shapes.append(drum)
        parts.append(
            CadPart(
                f"{arbor_id}-arbor",
                arbor_id,
                arbor_shape,
                COLORS.get(arbor_id, COLORS["center"]),
                {"wheelTeeth": teeth, "module": module, "includesPinion": index > 0, "profile": profile, "analysisGeometry": "exact-envelope"},
                compound(analysis_shapes),
            )
        )
        jewel_outer = dimension(arbor, "jewelOuterDiameter", 1.5)
        jewel_hole = min(jewel_outer - 0.05, dimension(arbor, "jewelHoleDiameter", pivot_diameter + 0.02))
        jewel = _ring(jewel_outer / 2, jewel_hole / 2, 0.18, stack["movement_bottom"] + train_base + 0.02)
        if abs(x) > 1e-9 or abs(y) > 1e-9:
            from .occ import translate

            jewel = translate(jewel, x, y, 0)
        parts.append(CadPart(f"{arbor_id}-jewel", "jewel", jewel, COLORS["jewel"], {"owner": arbor_id}))
        top_jewel_z = stack["movement_bottom"] + bridge_top - 0.2
        top_jewel = _ring(jewel_outer / 2, jewel_hole / 2, 0.18, top_jewel_z)
        if abs(x) > 1e-9 or abs(y) > 1e-9:
            from .occ import translate

            top_jewel = translate(top_jewel, x, y, 0)
        parts.append(CadPart(f"{arbor_id}-upper-jewel", "jewel", top_jewel, COLORS["jewel"], {"owner": arbor_id, "upper": True}))
    balance_x = dimension(project, "movement.balance.x", -5.3)
    balance_y = dimension(project, "movement.balance.y", -6.2)
    balance_radius = dimension(project, "movement.balance.diameter", 9.5) / 2
    balance_thickness = dimension(project, "movement.balance.thickness", 0.35)
    balance_z = stack["movement_bottom"] + train_base + dimension(project, "movement.balance.z", 2.35)
    balance = _ring(balance_radius, max(0.1, balance_radius - 0.45), balance_thickness, balance_z - balance_thickness / 2)
    from .occ import translate

    balance = translate(balance, balance_x, balance_y, 0)
    parts.append(CadPart("balance", "balance", balance, COLORS["balance"]))
    bridge_thickness = dimension(project, "movement.bridgeThickness", 0.45)
    architecture = string_value(project, "movement.architecture", "manual")
    automatic = nested(project, "movement.automatic", {})
    rotor_z = dimension(project, "movement.automatic.rotorZ", 0.15)
    bridge_z = stack["movement_bottom"] + bridge_top - bridge_thickness
    bridge = _ring(plate_radius * 0.94, plate_radius * 0.58, bridge_thickness, bridge_z)
    parts.append(CadPart("bridge", "bridge", bridge, COLORS["bridge"]))
    if architecture == "automatic" and isinstance(automatic, dict):
        rotor_radius = dimension(project, "movement.automatic.rotorDiameter", 31.5) / 2
        rotor_thickness = dimension(project, "movement.automatic.rotorThickness", 0.65)
        bearing_radius = dimension(project, "movement.automatic.bearingDiameter", 3.2) / 2
        rotor_bottom = stack["movement_bottom"] + rotor_z
        samples = 96
        rotor_outline = [(0.0, 0.0)] + [
            (cos(pi * index / samples) * rotor_radius, sin(pi * index / samples) * rotor_radius)
            for index in range(samples + 1)
        ]
        rotor = polygon_prism(rotor_outline, rotor_bottom, rotor_thickness)
        rotor = cut(rotor, cylinder(bearing_radius, rotor_thickness + 0.2, rotor_bottom - 0.1))
        rotor_sweep = cylinder(rotor_radius, rotor_thickness, rotor_bottom)
        parts.append(
            CadPart(
                "automatic-rotor",
                "rotor",
                rotor,
                COLORS["rotor"],
                {"continuousSweep": True, "reverserType": string_value(project, "movement.automatic.reverserType", "bidirectional")},
                rotor_sweep,
            )
        )
    return parts


def _quartz_parts(project: dict[str, Any], stack: dict[str, float]) -> list[CadPart]:
    width = dimension(project, "movement.casingWidth", 18.2)
    length = dimension(project, "movement.casingLength", 17.8)
    height = dimension(project, "movement.thickness", 3.15)
    body = rounded_prism(width, length, height, 2.1, stack["movement_bottom"])
    battery_radius = min(width, length) * 0.24
    battery = cylinder(battery_radius, min(1.6, height * 0.55), stack["movement_bottom"] + height * 0.5, (-width * 0.17, -length * 0.13))
    body = fuse(body, battery)
    return [CadPart(string_value(project, "movement.name", "quartz-movement"), "movement", body, COLORS["movement"], {"silhouette": "rounded-casing-envelope"})]


def _dial_parts(project: dict[str, Any], stack: dict[str, float]) -> list[CadPart]:
    radius = dimension(project, "dial.diameter", 31.8) / 2
    thickness = dimension(project, "dial.thickness", 0.4)
    center_hole = dimension(project, "dial.centerHole", 1.7) / 2
    dial = _ring(radius, center_hole, max(1e-4, thickness), stack["dial_bottom"])
    if bool_value(project, "dial.recess.enabled"):
        depth = dimension(project, "dial.recess.depth", 0.0)
        recess_radius = min(radius - 0.05, dimension(project, "dial.recess.radius", 8.2))
        if depth > 0:
            transition = string_value(project, "dial.recess.transition", "ramp")
            if transition == "step":
                cutter = cylinder(recess_radius, depth + 0.1, stack["dial_top"] - depth)
            else:
                profile: list[tuple[float, float]] = []
                samples = 24
                for index in range(samples + 1):
                    r = center_hole + (recess_radius - center_hole) * index / samples
                    ratio = index / samples
                    factor = 1 - ratio if transition == "ramp" else 1 - ratio * ratio * (3 - 2 * ratio)
                    profile.append((r, stack["dial_top"] - depth * factor))
                profile.extend([(recess_radius, stack["dial_top"] + 0.1), (center_hole, stack["dial_top"] + 0.1)])
                cutter = revolved_profile(profile)
            dial = cut(dial, cutter)
    parts = [CadPart("dial", "dial", dial, COLORS["dial"])]
    for relief in list_value(project, "dial.reliefs"):
        width = dimension(relief, "width", 1.0)
        length = dimension(relief, "length", width)
        height = dimension(relief, "height", 0.2)
        x = dimension(relief, "x")
        y = dimension(relief, "y")
        shape_kind = str(relief.get("shape", "block"))
        relief_shape = (
            cylinder(width / 2, height, stack["dial_top"], (x, y))
            if shape_kind == "circle"
            else centered_box(width, length, height, (x, y, stack["dial_top"] + height / 2))
        )
        relief_id = str(relief.get("id", len(parts)))
        parts.append(
            CadPart(
                f"relief-{relief_id}",
                f"relief:{relief_id}",
                relief_shape,
                COLORS["dial"],
                {"relief": True, "owner": "dial"},
            )
        )
    return parts


def _curve_offset(hand: dict[str, Any], ratio: float) -> float:
    start = max(0.0, min(0.95, float(nested(hand, "curve.startRatio", 0.35))))
    end = max(start + 0.01, min(1.0, float(nested(hand, "curve.endRatio", 0.85))))
    base = dimension(hand, "curve.base")
    middle = dimension(hand, "curve.middle")
    tip = dimension(hand, "curve.tip")
    if ratio <= start:
        return base
    if ratio >= end:
        return tip
    local = (ratio - start) / (end - start)
    return base + (middle - base) * local * 2 if local <= 0.5 else middle + (tip - middle) * (local - 0.5) * 2


def _hand_shape(project: dict[str, Any], key: str, angle: float, stack: dict[str, float]) -> CadPart | None:
    hand = nested(project, f"hands.{key}", {})
    if not isinstance(hand, dict) or not bool(hand.get("enabled", True)):
        return None
    length = dimension(hand, "length", 10)
    width = dimension(hand, "width", 0.8)
    thickness = dimension(hand, "thickness", 0.1)
    base_z = stack["dial_top"] + dimension(hand, "mountingHeight", 0.5)
    segments: list[TopoDS_Shape] = []
    count = 24
    for index in range(count):
        r0 = length * index / count
        r1 = length * (index + 1) / count
        start = (cos(angle) * r0, sin(angle) * r0, base_z + _curve_offset(hand, index / count))
        end = (cos(angle) * r1, sin(angle) * r1, base_z + _curve_offset(hand, (index + 1) / count))
        segments.append(prism_between(start, end, (-sin(angle), cos(angle), 0), width, thickness))
    tube_height = max(thickness, dimension(hand, "tubeHeight", 0.1) + thickness)
    hole = dimension(hand, "holeDiameter", 0.7)
    tube = _ring(max(hole * 0.85, width * 0.35), max(0.01, hole / 2), tube_height, base_z - thickness / 2)
    shape = compound([*segments, tube])
    part_id = {"hour": "hourHand", "minute": "minuteHand", "second": "secondHand"}[key]
    return CadPart(f"{key}-hand", part_id, shape, COLORS[part_id])


def build_hand_sweep(project: dict[str, Any], key: str) -> CadPart | None:
    """Build the exact 360 degree rotational envelope of a curved hand."""
    hand = nested(project, f"hands.{key}", {})
    if not isinstance(hand, dict) or not bool(hand.get("enabled", True)):
        return None
    stack = _stack(project)
    length = dimension(hand, "length", 10)
    width = dimension(hand, "width", 0.8)
    thickness = dimension(hand, "thickness", 0.1)
    base_z = stack["dial_top"] + dimension(hand, "mountingHeight", 0.5)
    # Rotating a radial blade produces one axisymmetric solid. Building its
    # meridian once is both exact for the sampled curve and much faster than a
    # compound of 24 independently revolved segments.
    samples = 48
    lower_profile: list[tuple[float, float]] = []
    upper_profile: list[tuple[float, float]] = []
    for index in range(samples + 1):
        ratio = index / samples
        radial = length * ratio
        swept_radius = sqrt(radial * radial + (width / 2) ** 2) if index > 0 else 0.0
        center_z = base_z + _curve_offset(hand, ratio)
        lower_profile.append((swept_radius, center_z - thickness / 2))
        upper_profile.append((swept_radius, center_z + thickness / 2))
    swept_blade = revolved_profile([*lower_profile, *reversed(upper_profile)])
    tube_height = max(thickness, dimension(hand, "tubeHeight", 0.1) + thickness)
    hole = dimension(hand, "holeDiameter", 0.7)
    tube = _ring(max(hole * 0.85, width * 0.35), max(0.01, hole / 2), tube_height, base_z - thickness / 2)
    part_id = {"hour": "hourHand", "minute": "minuteHand", "second": "secondHand"}[key]
    return CadPart(f"{key}-hand-sweep", part_id, compound([swept_blade, tube]), COLORS[part_id], {"continuousSweep": True})


def _crystal_part(project: dict[str, Any], stack: dict[str, float]) -> CadPart:
    radius = dimension(project, "crystal.diameter", 34.3) / 2
    thickness = max(0.05, dimension(project, "crystal.thickness", 1.0))
    rise = max(0.0, dimension(project, "crystal.innerRise", 0.0))
    crystal_type = string_value(project, "crystal.type", "flat")
    inner: list[tuple[float, float]] = []
    for index in range(49):
        r = radius * index / 48
        ratio = r / max(0.001, radius)
        if crystal_type == "flat":
            profile = 0.0
        elif crystal_type == "domed":
            profile = rise * (1 - ratio * ratio)
        else:
            profile = rise if ratio <= 0.68 else rise * max(0.0, 1 - ((ratio - 0.68) / 0.32) ** 2)
        inner.append((r, stack["crystal_edge"] + profile))
    crystal = revolved_profile([*inner, *((r, z + thickness) for r, z in reversed(inner))])
    return CadPart("crystal", "crystal", crystal, COLORS["crystal"])


def _crown_parts(project: dict[str, Any], stack: dict[str, float]) -> list[CadPart]:
    stem_z = stack["movement_bottom"] + dimension(project, "movement.stemAxisZ", 1.55)
    crown_distance = dimension(project, "case.crownDistance", 21.6)
    crown_radius = dimension(project, "case.crownDiameter", 6.0) / 2
    tube_radius = dimension(project, "case.crownTubeDiameter", 2.5) / 2
    stem = axial_cylinder(max(0.15, tube_radius * 0.24), crown_distance, (0, 0, stem_z), (1, 0, 0))
    crown = axial_cylinder(crown_radius, max(1.2, crown_radius * 0.7), (crown_distance, 0, stem_z), (1, 0, 0))
    return [CadPart("stem", "stem", stem, COLORS["stem"]), CadPart("crown", "crown", crown, COLORS["crown"])]


def build_project(project: dict[str, Any]) -> list[CadPart]:
    stack = _stack(project)
    parts = _case_parts(project)
    parts.extend(_mechanical_parts(project, stack) if string_value(project, "movement.kind") == "mechanical" else _quartz_parts(project, stack))
    parts.extend(_dial_parts(project, stack))
    for key, angle in (("hour", pi * 0.18), ("minute", -pi * 0.27), ("second", pi * 0.82)):
        hand = _hand_shape(project, key, angle, stack)
        if hand:
            parts.append(hand)
    parts.append(_crystal_part(project, stack))
    parts.extend(_crown_parts(project, stack))
    return parts
