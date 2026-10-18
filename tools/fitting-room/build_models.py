"""
Build the fitting-room 3D models with Blender + MPFB2 (MakeHuman).

For each body (female, male) this creates a posed MakeHuman character, exports
the bare body, then fits every garment in catalog.json to that body and exports
each garment as its own GLB (Draco mesh, WebP textures). The web viewer loads
the body plus only the garments being worn.

Usage (Blender 4.2+ with the MPFB extension installed):
  blender -b --python tools/fitting-room/build_models.py -- \
      --packs <dir with MakeHuman asset pack zips> \
      --out apps/web/public/models [--only id1,id2] [--max-tex 1024]

Then run postprocess.py to make thumbnails and the web catalogue.
"""
import argparse
import glob
import json
import os
import re
import shutil
import sys
import time
import traceback
import zipfile

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
from bl_ext.user_default.mpfb.services import AssetService, HumanService, LocationService, TargetService

HERE = os.path.dirname(os.path.abspath(__file__))

# Body shapes. MakeHuman macros run 0..1; gender 0 = female, 1 = male.
BODIES = {
    "female": {"gender": 0.0, "age": 0.5, "muscle": 0.5, "weight": 0.45, "height": 0.55,
               "proportions": 0.8, "cupsize": 0.5, "firmness": 0.55},
    "male": {"gender": 1.0, "age": 0.5, "muscle": 0.62, "weight": 0.5, "height": 0.6,
             "proportions": 0.75, "cupsize": 0.5, "firmness": 0.5},
}
# Arms relaxed at the sides instead of MakeHuman's T-pose: direction of each bone in armature space.
ARM_POSE = {
    "female": {"upperarm01": (0.22, 0.02, -1.0), "lowerarm01": (0.12, -0.12, -1.0)},
    "male": {"upperarm01": (0.26, 0.0, -1.0), "lowerarm01": (0.14, -0.1, -1.0)},
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--packs", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--catalog", default=os.path.join(HERE, "catalog.json"))
    p.add_argument("--only", default="")
    p.add_argument("--max-tex", type=int, default=1024)
    return p.parse_args(argv)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# Asset folder -> pack name, filled while installing; used when a garment file names no licence.
ASSET_PACK = {}


def pack_license(pack):
    """Licence a pack is published under (makehumancommunity.org asset packs page)."""
    return "CC0" if pack == "makehuman_system_assets" or pack.endswith("01") else "CC-BY"


def install_packs(packs_dir):
    data_dir = LocationService.get_user_data()
    for z in sorted(glob.glob(os.path.join(packs_dir, "*.zip"))):
        name = os.path.splitext(os.path.basename(z))[0]
        if name.startswith("mpfb"):
            continue
        with zipfile.ZipFile(z) as zf:
            for n in zf.namelist():
                parts = n.split("/")
                if len(parts) > 2 and parts[0] == "clothes":
                    ASSET_PACK.setdefault(parts[1], name)
            marker = os.path.join(data_dir, f".installed_{name}")
            if not os.path.exists(marker):
                zf.extractall(data_dir)
                open(marker, "w").close()
                print("installed pack", name)
    AssetService.update_all_asset_lists()
    return data_dir


def find_mhclo(data_dir, asset):
    hits = glob.glob(os.path.join(data_dir, "clothes", asset, "*.mhclo"))
    return hits[0] if hits else None


def normalize_license(raw, pack):
    """Tidy the free-text licence line; fall back to the pack's licence when it is missing or outdated."""
    s = raw.strip()
    if not s or s.upper().startswith("AGPL"):  # old MakeHuman 1.0 headers; the packs are re-released as CC0/CC-BY
        return pack_license(pack)
    m = re.match(r"(?i)cc[\s_-]*(by|0|zero)\W*(\d\.\d)?", s)
    if not m:
        return s
    if m.group(1).lower() in ("0", "zero"):
        return "CC0"
    return f"CC-BY {m.group(2)}" if m.group(2) else "CC-BY"


def read_credits(mhclo, asset):
    meta = {"author": "", "license": ""}
    with open(mhclo, encoding="utf-8", errors="replace") as f:
        for line in f:
            # both "# author: name" and "# author name" appear in the wild
            m = re.match(r"#\s*(author|license)\b\s*:?\s*(.+)", line.strip(), re.I)
            if m:
                meta[m.group(1).lower()] = m.group(2).strip()
            if line.startswith("basemesh"):
                break
    pack = ASSET_PACK.get(asset, "")
    meta["license"] = normalize_license(meta["license"], pack)
    if meta["author"].lower() in ("", "unknown"):
        meta["author"] = "MakeHuman team" if pack == "makehuman_system_assets" else author_from_folder(asset)
    return meta


# Community asset folders start with the author's handle.
HANDLES = {"elvs": "Elvaerwyn", "toigo": "Toigo", "punkduck": "punkduck", "mindfront": "Mindfront", "cortu": "Cortu",
           "jujube": "Jujube", "culturalibre": "culturalibre", "aethelraed": "AEthelraed_Unraed", "ews": "EWS",
           "janexx": "Janexx", "wolgade": "wolgade", "namuhekam": "Namuhekam", "joepal": "Joepal"}


def author_from_folder(asset):
    handle = asset.split("_", 1)[0].lower()
    return HANDLES.get(handle, handle)


def aim_bone(rig, name, direction):
    """Rotate a pose bone about its head so it points along `direction` (armature space)."""
    pb = rig.pose.bones[name]
    bpy.context.view_layer.update()
    head = pb.head.copy()
    q = (pb.tail - pb.head).normalized().rotation_difference(Vector(direction).normalized())
    pb.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ pb.matrix
    bpy.context.view_layer.update()


def make_body(gender):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    macros = TargetService.get_default_macro_info_dict()
    macros.update(BODIES[gender])
    basemesh = HumanService.create_human(macro_detail_dict=macros, feet_on_ground=True, scale=0.1)
    rig = HumanService.add_builtin_rig(basemesh, "default", import_weights=True)
    for side in ("L", "R"):
        sign = 1 if rig.pose.bones[f"upperarm01.{side}"].head.x > 0 else -1
        for bone, (x, y, z) in ARM_POSE[gender].items():
            aim_bone(rig, f"{bone}.{side}", (sign * x, y, z))
    return basemesh, rig


def shrink_textures(obj, max_px):
    for slot in obj.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes:
            continue
        for node in mat.node_tree.nodes:
            img = getattr(node, "image", None)
            if node.type == "TEX_IMAGE" and img and max(img.size) > max_px:
                k = max_px / max(img.size)
                img.scale(max(1, int(img.size[0] * k)), max(1, int(img.size[1] * k)))


def export_glb(obj, path, *, materials=True, draco=True, attributes=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=path, use_selection=True, export_format="GLB", export_apply=True,
        export_skins=False, export_animations=False, export_morph=False, export_yup=True,
        export_materials="EXPORT" if materials else "NONE", export_texcoords=materials,
        export_attributes=attributes, export_extras=True,
        export_image_format="WEBP", export_image_quality=80,
        export_draco_mesh_compression_enable=draco, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14, export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
    )


def ranges(ids):
    """Sorted vertex ids as compact ranges ("12-40,57")."""
    runs, start, prev = [], None, None
    for i in sorted(ids):
        if start is None:
            start = prev = i
        elif i == prev + 1:
            prev = i
        else:
            runs.append(f"{start}-{prev}" if prev > start else str(start))
            start = prev = i
    if start is not None:
        runs.append(f"{start}-{prev}" if prev > start else str(start))
    return ",".join(runs)


def real_body_vertices(basemesh):
    """Ids of the actual body. The base mesh also carries helper geometry (tights, skirt, hair,
    teeth...) that MPFB hides with a mask; it must never count as covered or nearest skin."""
    group = basemesh.vertex_groups["body"].index
    return {v.index for v in basemesh.data.vertices if any(g.group == group for g in v.groups)}


def covered_vertices(basemesh, clothes, reach=0.02, cover_reach=0.08):
    """
    Body vertices a garment covers: the asset's own MakeHuman delete group (when it has one),
    plus every vertex whose outward normal hits the garment within `reach` metres. Many
    community assets ship without a delete group, and the ray test also catches spots the
    author's group misses. Open areas (necklines, cuffs) stay visible because their rays
    leave without touching cloth.
    Returns (hide, cover): hide is that skin; cover reaches `cover_reach` and is what the
    garment hides on garments worn under it.
    """
    ids = set()
    masks = [m for m in basemesh.modifiers if m.type == "MASK" and m.name.startswith("Delete")]
    group = basemesh.vertex_groups.get(masks[-1].vertex_group) if masks else None
    if group:
        ids.update(v.index for v in basemesh.data.vertices if any(g.group == group.index for g in v.groups))

    # Evaluate the posed body with every mask off, so vertex indices match the original mesh.
    mask_mods = [m for m in basemesh.modifiers if m.type == "MASK"]
    for m in mask_mods:
        m.show_viewport = False
    depsgraph = bpy.context.evaluated_depsgraph_get()
    body_eval = basemesh.evaluated_get(depsgraph)
    body_mesh = body_eval.to_mesh()
    cloth_eval = clothes.evaluated_get(depsgraph)
    cloth_mesh = cloth_eval.to_mesh()
    cloth_mesh.transform(clothes.matrix_world)
    bvh = BVHTree.FromPolygons([v.co.copy() for v in cloth_mesh.vertices], [tuple(p.vertices) for p in cloth_mesh.polygons])
    to_world = basemesh.matrix_world
    normal_world = to_world.to_3x3().inverted().transposed()
    hits, far = set(), set()
    real = real_body_vertices(basemesh)
    for v in body_mesh.vertices:
        if v.index not in real:
            continue
        co = to_world @ v.co
        n = (normal_world @ v.normal).normalized()
        hit, face_normal, _, dist = bvh.ray_cast(co + n * 0.0005, n, cover_reach)
        # Count only cloth facing the same way as the skin: hitting the inside of a collar or
        # cuff from the neck or wrist is not "covered".
        if hit is not None and abs(face_normal.dot(n)) > 0.4:
            far.add(v.index)
            if dist <= reach:
                hits.add(v.index)
    # Erode two rings, so skin right at a garment's edge stays: hiding it would open a hole
    # where the cloth ends (necklines, sleeve hems).
    neighbours = {}
    for e in body_mesh.edges:
        a, b = e.vertices
        neighbours.setdefault(a, []).append(b)
        neighbours.setdefault(b, []).append(a)
    for _ in range(2):
        hits = {i for i in hits if all(n in hits for n in neighbours.get(i, ()))}
    # What this garment hides on garments worn under it: everything under the cloth, out to
    # `cover_reach` and not eroded, since an inner garment poking out (a trouser waist through a
    # shirt hem) is the problem there, not a hole in the skin.
    cover = ids | far | hits
    ids |= hits
    body_eval.to_mesh_clear()
    cloth_eval.to_mesh_clear()
    for m in mask_mods:
        m.show_viewport = True
    return ranges(ids), ranges(cover)


def tag_nearest_body_vertex(basemesh, clothes):
    """
    Give every garment vertex the id of the nearest body vertex (_VID). The viewer uses it to
    hide the parts of an inner garment that an outer one covers (a trouser waist under a shirt),
    using the outer garment's list of covered body vertices.
    """
    mask_mods = [m for m in basemesh.modifiers if m.type == "MASK"]
    for m in mask_mods:
        m.show_viewport = False
    depsgraph = bpy.context.evaluated_depsgraph_get()
    body_eval = basemesh.evaluated_get(depsgraph)
    body_mesh = body_eval.to_mesh()
    kd = KDTree(len(body_mesh.vertices))
    to_world = basemesh.matrix_world
    real = real_body_vertices(basemesh)
    for v in body_mesh.vertices:
        if v.index in real:
            kd.insert(to_world @ v.co, v.index)
    kd.balance()
    cloth_eval = clothes.evaluated_get(depsgraph)
    cloth_mesh = cloth_eval.to_mesh()
    ids = [float(kd.find(clothes.matrix_world @ v.co)[1]) for v in cloth_mesh.vertices]
    body_eval.to_mesh_clear()
    cloth_eval.to_mesh_clear()
    for m in mask_mods:
        m.show_viewport = True
    # the garment keeps its modifiers (fit, pose) until export applies them; the attribute rides
    # on the base mesh, whose vertex count matches the evaluated one for these garments
    if len(ids) == len(clothes.data.vertices):
        attr = clothes.data.attributes.get("_vid") or clothes.data.attributes.new("_vid", "FLOAT", "POINT")
        attr.data.foreach_set("value", ids)


def main():
    args = parse_args()
    out = os.path.abspath(args.out)
    catalog = json.load(open(args.catalog, encoding="utf-8"))["items"]
    only = {s.strip() for s in args.only.split(",") if s.strip()}
    data_dir = install_packs(args.packs)

    manifest_path = os.path.join(out, "manifest.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {"bodies": {}, "items": {}}
    thumbs_src = os.path.join(out, "_thumbs_src")
    os.makedirs(thumbs_src, exist_ok=True)

    for gender in BODIES:
        t0 = time.time()
        basemesh, rig = make_body(gender)

        # Bare body, pulled 4 mm inward so tight garments never show skin poking through.
        disp = basemesh.modifiers.new("inset", "DISPLACE")
        disp.strength = -0.004
        disp.mid_level = 0.0
        # Number every body vertex (_vid) so the viewer can hide the skin a garment covers.
        vid = basemesh.data.attributes.new("_vid", "FLOAT", "POINT")
        vid.data.foreach_set("value", [float(i) for i in range(len(basemesh.data.vertices))])
        body_file = f"{gender}/body.glb"
        export_glb(basemesh, os.path.join(out, body_file), materials=False, attributes=True)
        basemesh.modifiers.remove(disp)
        manifest["bodies"][gender] = {"file": body_file, "height": round(basemesh.dimensions.z, 3)}
        print(f"[{gender}] body exported")

        for item in catalog:
            iid = slug(item["asset"])
            if only and iid not in only and item["asset"] not in only:
                continue
            mhclo = find_mhclo(data_dir, item["asset"])
            entry = manifest["items"].setdefault(iid, {})
            entry.update({k: item[k] for k in ("asset", "name", "slot", "kind")})
            entry["tucked"] = bool(item.get("tucked"))
            if not mhclo:
                entry["error"] = "asset not installed"
                print(f"  ! {iid}: not installed")
                continue
            entry.update(read_credits(mhclo, item["asset"]))
            try:
                clothes = HumanService.add_mhclo_asset(
                    mhclo, basemesh, asset_type="Clothes", subdiv_levels=0, material_type="GAMEENGINE")
                shrink_textures(clothes, args.max_tex)
                # MakeHuman hides the body under a garment with a "Delete" vertex group; ship it
                # with the garment (glTF extras) so the viewer hides the same skin.
                clothes["hide"], clothes["cover"] = covered_vertices(basemesh, clothes)
                tag_nearest_body_vertex(basemesh, clothes)
                rel = f"{gender}/{iid}.glb"
                export_glb(clothes, os.path.join(out, rel), attributes=True)
                entry.setdefault("files", {})[gender] = rel
                entry.pop("error", None)
                HumanService.unload_mhclo_asset(basemesh, clothes)
                bpy.data.orphans_purge(do_recursive=True)
                thumb = glob.glob(os.path.join(os.path.dirname(mhclo), "*.thumb"))
                if thumb and gender == "female":
                    shutil.copyfile(thumb[0], os.path.join(thumbs_src, f"{iid}.png"))
                print(f"  ok {gender}/{iid}")
            except Exception as e:  # keep going; one bad asset shouldn't stop the batch
                entry["error"] = f"{type(e).__name__}: {e}"
                traceback.print_exc()
                print(f"  ! {iid}: {e}")
        print(f"[{gender}] done in {time.time() - t0:.0f}s")

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)
    print("manifest:", manifest_path)


main()
