"""Prints facts about the character mesh (run with Blender in background mode).

    blender -b --python tools/blender/inspect_model.py -- client/public/models/runner.fbx
"""
import sys

import bpy
from mathutils import Vector

path = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=path)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
print("objects:", [(o.name, o.type) for o in bpy.context.scene.objects])
for o in meshes:
    me = o.data
    mw = o.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    xs, ys, zs = [v.x for v in verts], [v.y for v in verts], [v.z for v in verts]
    print(f"mesh {o.name}: verts={len(me.vertices)} faces={len(me.polygons)} mats={[m.name for m in me.materials]}")
    print(f"  bbox x[{min(xs):.3f},{max(xs):.3f}] y[{min(ys):.3f},{max(ys):.3f}] z[{min(zs):.3f},{max(zs):.3f}]")
    # Horizontal slices: width in x and y, and how many separate x-clusters (legs/arms) at each height.
    zmin, zmax = min(zs), max(zs)
    h = zmax - zmin
    for i in range(41):
        z0 = zmin + h * i / 40
        band = [v for v in verts if abs(v.z - z0) < h / 80]
        if not band:
            print(f"  {i/40:.3f}: -")
            continue
        bx = sorted(v.x for v in band)
        gaps = [(bx[j + 1] - bx[j], (bx[j + 1] + bx[j]) / 2) for j in range(len(bx) - 1)]
        big = [round(c, 3) for g, c in gaps if g > h * 0.02]
        by = [v.y for v in band]
        print(f"  {i/40:.3f} z={z0:.3f}: x[{bx[0]:.3f},{bx[-1]:.3f}] y[{min(by):.3f},{max(by):.3f}] n={len(band)} gaps@{big[:6]}")
    # Loose parts
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    seen = set()
    islands = []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack = [v]
        seen.add(v.index)
        count = 0
        while stack:
            cur = stack.pop()
            count += 1
            for e in cur.link_edges:
                w = e.other_vert(cur)
                if w.index not in seen:
                    seen.add(w.index)
                    stack.append(w)
        islands.append(count)
    islands.sort(reverse=True)
    print(f"  islands={len(islands)} largest={islands[:8]}")
    bm.free()
