from __future__ import annotations

import json
import struct
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from OCP.BRep import BRep_Builder, BRep_Tool
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common, BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeFace, BRepBuilderAPI_MakePolygon, BRepBuilderAPI_Transform
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
from OCP.BRepGProp import BRepGProp
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakePrism, BRepPrimAPI_MakeRevol
from OCP.Bnd import Bnd_Box
from OCP.GProp import GProp_GProps
from OCP.IFSelect import IFSelect_RetDone
from OCP.STEPControl import STEPControl_AsIs, STEPControl_Reader, STEPControl_Writer
from OCP.StlAPI import StlAPI_Writer
from OCP.TopAbs import TopAbs_FACE, TopAbs_REVERSED
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS, TopoDS_Compound, TopoDS_Shape
from OCP.gp import gp_Ax1, gp_Ax2, gp_Dir, gp_Pnt, gp_Trsf, gp_Vec


def cylinder(radius: float, height: float, z: float = 0.0, origin: tuple[float, float] = (0.0, 0.0)) -> TopoDS_Shape:
    axis = gp_Ax2(gp_Pnt(origin[0], origin[1], z), gp_Dir(0, 0, 1))
    return BRepPrimAPI_MakeCylinder(axis, max(1e-5, radius), max(1e-5, height)).Shape()


def axial_cylinder(radius: float, length: float, start: tuple[float, float, float], direction: tuple[float, float, float]) -> TopoDS_Shape:
    axis = gp_Ax2(gp_Pnt(*start), gp_Dir(*direction))
    return BRepPrimAPI_MakeCylinder(axis, max(1e-5, radius), max(1e-5, length)).Shape()


def centered_box(width: float, length: float, height: float, center: tuple[float, float, float]) -> TopoDS_Shape:
    corner = gp_Pnt(center[0] - width / 2, center[1] - length / 2, center[2] - height / 2)
    return BRepPrimAPI_MakeBox(corner, max(1e-5, width), max(1e-5, length), max(1e-5, height)).Shape()


def translate(shape: TopoDS_Shape, x: float = 0.0, y: float = 0.0, z: float = 0.0) -> TopoDS_Shape:
    transform = gp_Trsf()
    transform.SetTranslation(gp_Vec(x, y, z))
    return BRepBuilderAPI_Transform(shape, transform, True).Shape()


def fuse(first: TopoDS_Shape, second: TopoDS_Shape) -> TopoDS_Shape:
    operation = BRepAlgoAPI_Fuse(first, second)
    operation.Build()
    return operation.Shape()


def fuse_all(shapes: list[TopoDS_Shape]) -> TopoDS_Shape:
    if not shapes:
        raise ValueError("At least one shape is required")
    result = shapes[0]
    for shape in shapes[1:]:
        result = fuse(result, shape)
    return result


def cut(shape: TopoDS_Shape, cutter: TopoDS_Shape) -> TopoDS_Shape:
    operation = BRepAlgoAPI_Cut(shape, cutter)
    operation.Build()
    return operation.Shape()


def common(first: TopoDS_Shape, second: TopoDS_Shape) -> TopoDS_Shape:
    operation = BRepAlgoAPI_Common(first, second)
    operation.Build()
    return operation.Shape()


def polygon_prism(points: list[tuple[float, float]], z: float, height: float) -> TopoDS_Shape:
    polygon = BRepBuilderAPI_MakePolygon()
    for x, y in points:
        polygon.Add(gp_Pnt(x, y, z))
    polygon.Close()
    face = BRepBuilderAPI_MakeFace(polygon.Wire()).Face()
    return BRepPrimAPI_MakePrism(face, gp_Vec(0, 0, height), True).Shape()


def prism_between(
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    width_axis: tuple[float, float, float],
    width: float,
    thickness: float,
) -> TopoDS_Shape:
    direction = gp_Vec(end[0] - start[0], end[1] - start[1], end[2] - start[2])
    tangent = gp_Vec(*width_axis)
    tangent.Normalize()
    normal = tangent.Crossed(direction)
    normal.Normalize()
    half_width = width / 2
    half_thickness = thickness / 2
    base = gp_Pnt(*start)
    offsets = [
        tangent.Multiplied(-half_width).Added(normal.Multiplied(-half_thickness)),
        tangent.Multiplied(half_width).Added(normal.Multiplied(-half_thickness)),
        tangent.Multiplied(half_width).Added(normal.Multiplied(half_thickness)),
        tangent.Multiplied(-half_width).Added(normal.Multiplied(half_thickness)),
    ]
    polygon = BRepBuilderAPI_MakePolygon()
    for offset in offsets:
        polygon.Add(base.Translated(offset))
    polygon.Close()
    face = BRepBuilderAPI_MakeFace(polygon.Wire()).Face()
    return BRepPrimAPI_MakePrism(face, direction, True).Shape()


def revolved_profile(points: list[tuple[float, float]]) -> TopoDS_Shape:
    polygon = BRepBuilderAPI_MakePolygon()
    for radius, z in points:
        polygon.Add(gp_Pnt(radius, 0, z))
    polygon.Close()
    face = BRepBuilderAPI_MakeFace(polygon.Wire()).Face()
    return BRepPrimAPI_MakeRevol(face, gp_Ax1(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1)), 6.283185307179586, True).Shape()


def rounded_prism(width: float, length: float, height: float, radius: float, z: float) -> TopoDS_Shape:
    radius = max(0.01, min(radius, width / 2 - 0.01, length / 2 - 0.01))
    shapes = [
        centered_box(width - 2 * radius, length, height, (0, 0, z + height / 2)),
        centered_box(width, length - 2 * radius, height, (0, 0, z + height / 2)),
    ]
    for x in (-width / 2 + radius, width / 2 - radius):
        for y in (-length / 2 + radius, length / 2 - radius):
            shapes.append(cylinder(radius, height, z, (x, y)))
    return fuse_all(shapes)


def compound(shapes: list[TopoDS_Shape]) -> TopoDS_Compound:
    result = TopoDS_Compound()
    builder = BRep_Builder()
    builder.MakeCompound(result)
    for shape in shapes:
        builder.Add(result, shape)
    return result


def is_valid(shape: TopoDS_Shape) -> bool:
    return not shape.IsNull() and BRepCheck_Analyzer(shape).IsValid()


def volume(shape: TopoDS_Shape) -> float:
    properties = GProp_GProps()
    BRepGProp.VolumeProperties_s(shape, properties)
    return float(properties.Mass())


def area(shape: TopoDS_Shape) -> float:
    properties = GProp_GProps()
    BRepGProp.SurfaceProperties_s(shape, properties)
    return float(properties.Mass())


def bounds(shape: TopoDS_Shape) -> tuple[float, float, float, float, float, float]:
    box = Bnd_Box()
    BRepBndLib.Add_s(shape, box)
    return tuple(float(value) for value in box.Get())


def read_step(path: Path) -> TopoDS_Shape:
    if not path.exists() or not path.is_file():
        raise ValueError(f"STEP file does not exist: {path.name}")
    if path.suffix.lower() not in {".step", ".stp"}:
        raise ValueError("Only STEP or STP files can be inspected")
    reader = STEPControl_Reader()
    if reader.ReadFile(str(path)) != IFSelect_RetDone:
        raise ValueError(f"OpenCascade could not read {path.name}")
    transferred = reader.TransferRoots()
    if transferred <= 0:
        raise ValueError(f"No transferable solids were found in {path.name}")
    shape = reader.OneShape()
    if shape.IsNull():
        raise ValueError(f"The imported STEP is empty: {path.name}")
    return shape


def exact_distance(first: TopoDS_Shape, second: TopoDS_Shape) -> float:
    solver = BRepExtrema_DistShapeShape(first, second)
    solver.Perform()
    if not solver.IsDone():
        raise RuntimeError("OpenCascade distance solver did not complete")
    return float(solver.Value())


def tessellate(shape: TopoDS_Shape, deflection: float = 0.03, angular: float = 0.08) -> tuple[list[tuple[float, float, float]], list[tuple[int, int, int]]]:
    mesher = BRepMesh_IncrementalMesh(shape, deflection, False, angular, True)
    mesher.Perform()
    vertices: list[tuple[float, float, float]] = []
    triangles: list[tuple[int, int, int]] = []
    explorer = TopExp_Explorer(shape, TopAbs_FACE)
    while explorer.More():
        face = TopoDS.Face_s(explorer.Current())
        location = TopLoc_Location()
        triangulation = BRep_Tool.Triangulation_s(face, location)
        if triangulation is not None:
            offset = len(vertices)
            transform = location.Transformation()
            for index in range(1, triangulation.NbNodes() + 1):
                point = triangulation.Node(index).Transformed(transform)
                vertices.append((float(point.X()), float(point.Y()), float(point.Z())))
            reversed_face = face.Orientation() == TopAbs_REVERSED
            for index in range(1, triangulation.NbTriangles() + 1):
                first, second, third = triangulation.Triangle(index).Get()
                triangle = (offset + first - 1, offset + second - 1, offset + third - 1)
                triangles.append((triangle[0], triangle[2], triangle[1]) if reversed_face else triangle)
        explorer.Next()
    return vertices, triangles


def write_step(shapes: list[TopoDS_Shape], path: Path) -> None:
    writer = STEPControl_Writer()
    status = writer.Transfer(compound(shapes), STEPControl_AsIs)
    if status != IFSelect_RetDone or writer.Write(str(path)) != IFSelect_RetDone:
        raise RuntimeError(f"OpenCascade could not write STEP to {path}")


def write_stl(shape: TopoDS_Shape, path: Path, deflection: float = 0.02) -> None:
    BRepMesh_IncrementalMesh(shape, deflection, False, 0.08, True).Perform()
    if not StlAPI_Writer().Write(shape, str(path)):
        raise RuntimeError(f"OpenCascade could not write STL to {path}")


def write_3mf(named_meshes: list[tuple[str, TopoDS_Shape]], path: Path) -> None:
    resources: list[str] = []
    build_items: list[str] = []
    for object_id, (name, shape) in enumerate(named_meshes, start=1):
        vertices, triangles = tessellate(shape)
        vertex_xml = "".join(f'<vertex x="{x:.7g}" y="{y:.7g}" z="{z:.7g}"/>' for x, y, z in vertices)
        triangle_xml = "".join(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>' for a, b, c in triangles)
        resources.append(f'<object id="{object_id}" name="{name}" type="model"><mesh><vertices>{vertex_xml}</vertices><triangles>{triangle_xml}</triangles></mesh></object>')
        build_items.append(f'<item objectid="{object_id}"/>')
    model = '<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources>' + "".join(resources) + '</resources><build>' + "".join(build_items) + '</build></model>'
    content_types = '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'
    relationships = '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", relationships)
        archive.writestr("3D/3dmodel.model", model)


def _aligned(data: bytearray) -> None:
    while len(data) % 4:
        data.append(0)


def write_glb(named_meshes: list[tuple[str, TopoDS_Shape, tuple[float, float, float, float]]], path: Path) -> None:
    binary = bytearray()
    buffer_views: list[dict[str, int]] = []
    accessors: list[dict[str, object]] = []
    meshes: list[dict[str, object]] = []
    materials: list[dict[str, object]] = []
    nodes: list[dict[str, object]] = []
    for mesh_index, (name, shape, color) in enumerate(named_meshes):
        vertices, triangles = tessellate(shape)
        _aligned(binary)
        vertex_offset = len(binary)
        for vertex in vertices:
            binary.extend(struct.pack("<3f", *vertex))
        vertex_length = len(binary) - vertex_offset
        buffer_views.append({"buffer": 0, "byteOffset": vertex_offset, "byteLength": vertex_length, "target": 34962})
        minimum = [min((vertex[axis] for vertex in vertices), default=0) for axis in range(3)]
        maximum = [max((vertex[axis] for vertex in vertices), default=0) for axis in range(3)]
        position_accessor = len(accessors)
        accessors.append({"bufferView": len(buffer_views) - 1, "componentType": 5126, "count": len(vertices), "type": "VEC3", "min": minimum, "max": maximum})
        _aligned(binary)
        index_offset = len(binary)
        for triangle in triangles:
            binary.extend(struct.pack("<3I", *triangle))
        index_length = len(binary) - index_offset
        buffer_views.append({"buffer": 0, "byteOffset": index_offset, "byteLength": index_length, "target": 34963})
        index_accessor = len(accessors)
        accessors.append({"bufferView": len(buffer_views) - 1, "componentType": 5125, "count": len(triangles) * 3, "type": "SCALAR"})
        materials.append({"name": name, "pbrMetallicRoughness": {"baseColorFactor": list(color), "metallicFactor": 0.35, "roughnessFactor": 0.45}, "alphaMode": "BLEND" if color[3] < 1 else "OPAQUE", "doubleSided": True})
        meshes.append({"name": name, "primitives": [{"attributes": {"POSITION": position_accessor}, "indices": index_accessor, "material": mesh_index}]})
        nodes.append({"name": name, "mesh": mesh_index})
    document = {"asset": {"version": "2.0", "generator": "WatchLab OCCT"}, "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes, "materials": materials, "buffers": [{"byteLength": len(binary)}], "bufferViews": buffer_views, "accessors": accessors}
    encoded_json = bytearray(json.dumps(document, separators=(",", ":")).encode("utf-8"))
    while len(encoded_json) % 4:
        encoded_json.append(0x20)
    _aligned(binary)
    total_length = 12 + 8 + len(encoded_json) + 8 + len(binary)
    with path.open("wb") as output:
        output.write(struct.pack("<4sII", b"glTF", 2, total_length))
        output.write(struct.pack("<II", len(encoded_json), 0x4E4F534A))
        output.write(encoded_json)
        output.write(struct.pack("<II", len(binary), 0x004E4942))
        output.write(binary)
