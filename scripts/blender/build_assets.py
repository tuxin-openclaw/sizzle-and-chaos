"""Build the stylized kitchen asset kit for Sizzle & Chaos.

Run with:
  blender --background --factory-startup --python scripts/blender/build_assets.py

The script generates GLB files in public/models:
  chef.glb, food.glb, stations.glb, props.glb

Modelling conventions:
  * Blender Z-up, front of props faces -Y.
  * glTF export converts to Y-up / +Z forward for Three.js.
  * Every asset has its origin at the floor/base centre so it drops into the
    game without offset maths.
"""

import bpy
import bmesh
import math
import os
import random
from mathutils import Vector, Euler

PROJECT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(PROJECT, "public", "models")
os.makedirs(OUT, exist_ok=True)

random.seed(7)


# ---------------------------------------------------------------------------
# Colour / material helpers
# ---------------------------------------------------------------------------

def _srgb(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexa(value, alpha=1.0):
    value = value.lstrip("#")
    return (_srgb(int(value[0:2], 16)), _srgb(int(value[2:4], 16)),
            _srgb(int(value[4:6], 16)), alpha)


MATS = {}


def material(name, color, roughness=0.72, metallic=0.0, emission=None, emission_strength=0.0):
    if name in MATS:
        return MATS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hexa(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.35
    if emission:
        bsdf.inputs["Emission Color"].default_value = hexa(emission)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    mat.diffuse_color = hexa(color)
    MATS[name] = mat
    return mat


def palette():
    return {
        "cream": material("Cream", "#FFF4DE", 0.82),
        "paper": material("Paper", "#FFFBF0", 0.9),
        "teal": material("Teal", "#2F817A", 0.6),
        "teal_dark": material("TealDark", "#1E5C58", 0.6),
        "teal_light": material("TealLight", "#67B8A9", 0.6),
        "red": material("Red", "#E85A45", 0.55),
        "red_dark": material("RedDark", "#A83A2C", 0.6),
        "mustard": material("Mustard", "#E8B34B", 0.65),
        "wood": material("Wood", "#C1844F", 0.72),
        "wood_dark": material("WoodDark", "#8A5634", 0.75),
        "wood_light": material("WoodLight", "#DCAD72", 0.72),
        "metal": material("Metal", "#AEB8B6", 0.3, 0.75),
        "iron": material("Iron", "#3A3F41", 0.42, 0.35),
        "brass": material("Brass", "#D9A441", 0.28, 0.7),
        "white": material("White", "#FFFDF5", 0.55),
        "skin": material("Skin", "#F3B98C", 0.72),
        "skin_shadow": material("SkinShadow", "#DB9468", 0.75),
        "blush": material("Blush", "#EE8C78", 0.8),
        "hair": material("Hair", "#5A3826", 0.8),
        "black": material("Black", "#2A2320", 0.55),
        "green": material("Green", "#67A843", 0.68),
        "green_light": material("GreenLight", "#9BCB5C", 0.68),
        "green_dark": material("GreenDark", "#477A35", 0.7),
        "tomato": material("TomatoRed", "#D94436", 0.58),
        "bun": material("Bun", "#D9974F", 0.7),
        "bun_light": material("BunLight", "#E9B46B", 0.7),
        "meat": material("MeatRaw", "#D97972", 0.72),
        "sesame": material("Sesame", "#FFF0C9", 0.75),
    }


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def apply_transform(obj):
    activate(obj)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def bevel(obj, width=0.04, segments=2, angle=40.0):
    mod = obj.modifiers.new("Soft bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angle)
    mod.use_clamp_overlap = True
    activate(obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    activate(obj)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle + 5))
    except Exception:
        pass
    return obj


def box(name, dims, loc, mat, bevel_width=0.05, segments=3, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = dims
    obj.rotation_euler = Euler(rot, "XYZ")
    apply_transform(obj)
    if bevel_width > 0:
        bevel(obj, min(bevel_width, min(dims) * 0.4), segments)
    obj.data.materials.append(mat)
    return obj


def sphere(name, radius, loc, mat, scale=(1, 1, 1), segments=32, rings=20, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings,
                                         radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = Euler(rot, "XYZ")
    apply_transform(obj)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def cylinder(name, radius, depth, loc, mat, vertices=32, rot=(0, 0, 0),
             bevel_width=0.015, segments=2):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth,
                                        location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    apply_transform(obj)
    if bevel_width > 0:
        bevel(obj, bevel_width, segments)
    else:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def cone(name, r1, r2, depth, loc, mat, vertices=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2,
                                    depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    apply_transform(obj)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def torus(name, major, minor, loc, mat, rot=(0, 0, 0), major_segments=32, minor_segments=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     major_segments=major_segments,
                                     minor_segments=minor_segments,
                                     location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    result = bpy.context.object
    result.name = name
    return result


def origin_to_cursor(obj, position):
    bpy.context.scene.cursor.location = position
    activate(obj)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.mesh_curves if hasattr(bpy.data, "mesh_curves") else []):
        pass
    bpy.context.scene.cursor.location = (0, 0, 0)


def new_root(name):
    root = bpy.data.objects.new(name, None)
    link(root)
    return root


def parent_keep_transform(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    if objs:
        bpy.context.view_layer.objects.active = objs[0]


def export_glb(filename, objs):
    select_only(objs)
    path = os.path.join(OUT, filename)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_materials="EXPORT",
        export_normals=True,
        export_texcoords=True,
    )
    print(f"  -> {path} ({os.path.getsize(path) / 1024:.0f} KB)")


# ---------------------------------------------------------------------------
# Chef
# ---------------------------------------------------------------------------

def build_chef():
    print("Building chef...")
    reset_scene()
    P = palette()
    root = new_root("ChefRoot")
    parts = []

    def add(obj):
        parent_keep_transform(obj, root)
        parts.append(obj)
        return obj

    # legs + shoes (mostly hidden, but they ground the silhouette)
    for side, x in (("L", -0.2), ("R", 0.2)):
        add(sphere(f"ChefLeg{side}", 0.16, (x, 0.02, 0.18), P["skin_shadow"],
                   scale=(1.0, 1.0, 1.15), segments=24, rings=16))
        add(sphere(f"ChefShoe{side}", 0.19, (x, -0.1, 0.09), P["hair"],
                   scale=(1.0, 1.35, 0.6), segments=24, rings=12))

    # jacket / chubby body
    add(sphere("ChefBody", 0.58, (0, 0, 0.82), P["paper"],
               scale=(1.0, 0.88, 1.06), segments=40, rings=24))
    # apron: flat skirt + bib, kept close to the jacket so it reads as fabric
    add(box("ChefApronSkirt", (0.66, 0.1, 0.5), (0, -0.47, 0.51), P["red"],
            0.09, 3))
    add(box("ChefApronBib", (0.36, 0.09, 0.3), (0, -0.5, 0.9), P["red"],
            0.06, 3))
    for x in (-0.16, 0.16):
        add(box("ChefApronStrap", (0.055, 0.05, 0.28), (x, -0.44, 1.08),
                P["red_dark"], 0.022, 2))
    add(torus("ChefApronTie", 0.54, 0.035, (0, 0, 0.73), P["red_dark"],
              rot=(math.radians(0), 0, math.radians(0)), major_segments=32))
    add(box("ChefApronPocket", (0.3, 0.035, 0.15), (0, -0.53, 0.57),
            P["cream"], 0.035, 2))
    add(box("ChefApronPocketLine", (0.24, 0.012, 0.018), (0, -0.55, 0.61),
            P["red_dark"], 0.006, 1))
    # buttons
    for z in (0.98, 0.86):
        add(sphere("ChefButton", 0.035, (0, -0.5, z), P["brass"],
                   scale=(1, 0.55, 1), segments=16, rings=10))
    # little neckerchief
    add(torus("ChefScarf", 0.27, 0.055, (0, 0, 1.19), P["red_dark"],
              rot=(math.radians(8), 0, 0), major_segments=28))
    add(sphere("ChefScarfKnot", 0.09, (0, -0.25, 1.14), P["red_dark"],
               scale=(1.15, 0.7, 0.9), segments=18, rings=12))

    # head
    add(sphere("ChefHead", 0.38, (0, -0.015, 1.49), P["skin"],
               scale=(1.0, 0.94, 0.98), segments=40, rings=24))
    add(sphere("ChefEarL", 0.095, (-0.355, -0.01, 1.47), P["skin"], scale=(0.65, 1, 1),
               segments=20, rings=12))
    add(sphere("ChefEarR", 0.095, (0.355, -0.01, 1.47), P["skin"], scale=(0.65, 1, 1),
               segments=20, rings=12))
    # big friendly nose
    add(sphere("ChefNose", 0.095, (0, -0.365, 1.47), P["skin_shadow"],
               scale=(1.0, 0.9, 0.85), segments=24, rings=16))
    # eyes (white sclera + pupils + catchlight)
    for side, x in (("L", -0.135), ("R", 0.135)):
        add(sphere(f"ChefEye{side}", 0.075, (x, -0.325, 1.57), P["white"],
                   scale=(0.8, 0.5, 1.05), segments=20, rings=12))
        add(sphere(f"ChefPupil{side}", 0.042, (x, -0.357, 1.565), P["black"],
                   scale=(0.72, 0.4, 1.0), segments=16, rings=10))
        add(sphere(f"ChefSpark{side}", 0.014, (x + 0.016, -0.378, 1.585), P["white"],
                   scale=(1, 0.5, 1), segments=12, rings=8))
        add(box(f"ChefBrow{side}", (0.12, 0.035, 0.028),
                (x, -0.33, 1.67), P["hair"], 0.014, 2,
                rot=(0, math.radians(6 if side == "R" else -6), 0)))
    # cheeks + moustache + mouth
    for x in (-0.21, 0.21):
        add(sphere("ChefCheek", 0.075, (x, -0.30, 1.42), P["blush"],
                   scale=(1.1, 0.3, 0.72), segments=18, rings=10))
    for x, rot in ((-0.075, 0.28), (0.075, -0.28)):
        add(sphere("ChefMoustache", 0.105, (x, -0.36, 1.39), P["hair"],
                   scale=(1.1, 0.5, 0.46), segments=20, rings=12, rot=(0, 0, rot)))
    add(sphere("ChefMouth", 0.055, (0, -0.352, 1.335), P["red_dark"],
               scale=(0.9, 0.3, 0.55), segments=16, rings=10))

    # chef hat: band + three puffy clouds
    add(cylinder("ChefHatBand", 0.305, 0.16, (0, 0, 1.80), P["white"], vertices=40,
                 bevel_width=0.03))
    add(cylinder("ChefHatAccent", 0.309, 0.055, (0, 0, 1.745), P["red"], vertices=40,
                 bevel_width=0.012, segments=1))
    add(sphere("ChefHatPuffA", 0.29, (0, 0, 1.95), P["white"],
               scale=(1.05, 1.0, 0.8), segments=32, rings=20))
    add(sphere("ChefHatPuffB", 0.2, (-0.18, 0.02, 1.9), P["white"],
               scale=(1.0, 1.0, 0.85), segments=24, rings=16))
    add(sphere("ChefHatPuffC", 0.2, (0.19, 0.0, 1.91), P["white"],
               scale=(1.0, 1.0, 0.85), segments=24, rings=16))
    add(sphere("ChefHatPuffD", 0.18, (0.03, 0.13, 1.93), P["white"],
               scale=(1.0, 1.0, 0.8), segments=24, rings=16))

    # arms, built at origin then pivoted at shoulders so the game can animate them
    for side, sx in (("L", -1), ("R", 1)):
        shoulder = Vector((0.58 * sx, -0.04, 1.02))
        pieces = []
        pieces.append(sphere(f"ChefSleeve{side}", 0.17,
                             (shoulder.x, shoulder.y, shoulder.z - 0.2), P["paper"],
                             scale=(1.0, 1.0, 1.65), segments=24, rings=16))
        pieces.append(cylinder(f"ChefCuff{side}", 0.135, 0.09,
                               (shoulder.x, shoulder.y, shoulder.z - 0.39), P["red"],
                               vertices=24, rot=(0, 0, 0)))
        pieces.append(sphere(f"ChefHand{side}", 0.14,
                             (shoulder.x, shoulder.y, shoulder.z - 0.5), P["skin"],
                             scale=(1.0, 0.95, 1.05), segments=24, rings=16))
        arm = join(pieces, f"ChefArm{side}")
        origin_to_cursor(arm, shoulder)
        arm.rotation_euler = Euler((math.radians(-18), math.radians(18 * sx), 0), "XYZ")
        add(arm)

    # a tea towel tucked at the waist
    add(box("ChefTowel", (0.2, 0.05, 0.38), (0.4, -0.42, 0.58), P["cream"], 0.035,
            rot=(math.radians(8), math.radians(-12), math.radians(-4))))

    export_glb("chef.glb", [root] + parts)


# ---------------------------------------------------------------------------
# Food
# ---------------------------------------------------------------------------

def build_food():
    print("Building food...")
    reset_scene()
    P = palette()
    all_objects = []

    # Plate ------------------------------------------------------------------
    plate_parts = [
        cylinder("PlateBase", 0.4, 0.055, (0, 0, 0.028), P["white"], vertices=48,
                 bevel_width=0.025),
        cylinder("PlateInner", 0.31, 0.02, (0, 0, 0.062), P["cream"], vertices=48,
                 bevel_width=0.01),
        torus("PlateRim", 0.375, 0.028, (0, 0, 0.055), P["white"], major_segments=48),
    ]
    plate = join(plate_parts, "Plate")
    all_objects.append(plate)

    # Bun --------------------------------------------------------------------
    bun_parts = [
        cylinder("BunBottom", 0.27, 0.09, (0, 0, 0.045), P["bun_light"], vertices=36,
                 bevel_width=0.02),
        sphere("BunDome", 0.29, (0, 0, 0.135), P["bun"], scale=(1.0, 1.0, 0.72),
               segments=36, rings=20),
    ]
    for i in range(7):
        a = (i / 7.0) * math.tau + 0.3
        rad = 0.16 if i % 2 else 0.1
        bun_parts.append(sphere("Sesame", 0.022,
                                (math.cos(a) * rad, math.sin(a) * rad,
                                 0.23 + 0.035 * math.cos(a * 2)),
                                P["sesame"], scale=(1.0, 1.0, 0.55),
                                segments=12, rings=8))
    bun = join(bun_parts, "Bun")
    all_objects.append(bun)

    # Patty ------------------------------------------------------------------
    patty_parts = [
        cylinder("PattyBody", 0.275, 0.11, (0, 0, 0.06), P["meat"], vertices=40,
                 bevel_width=0.04, segments=3),
    ]
    for i in range(6):
        a = i * 1.3
        patty_parts.append(sphere("PattyBump", 0.05,
                                  (math.cos(a) * 0.16, math.sin(a) * 0.16, 0.118),
                                  P["meat"], scale=(1.2, 1.2, 0.35),
                                  segments=12, rings=8))
    patty = join(patty_parts, "Patty")
    all_objects.append(patty)

    # Whole lettuce ----------------------------------------------------------
    lettuce_parts = [
        cylinder("LettuceCore", 0.09, 0.12, (0, 0, 0.06), P["cream"], vertices=16),
        sphere("LettuceHead", 0.27, (0, 0, 0.2), P["green"], scale=(1, 1, 0.9),
               segments=32, rings=20),
    ]
    for i in range(7):
        a = (i / 7.0) * math.tau
        lettuce_parts.append(sphere("LettuceLeaf", 0.17,
                                    (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.16),
                                    P["green_light"] if i % 2 else P["green_dark"],
                                    scale=(1.25, 0.8, 0.45),
                                    segments=20, rings=12, rot=(0.15, 0, a)))
    lettuce = join(lettuce_parts, "Lettuce")
    all_objects.append(lettuce)

    # Chopped lettuce --------------------------------------------------------
    chop_lettuce_parts = []
    for i in range(10):
        a = random.uniform(0, math.tau)
        r = random.uniform(0.02, 0.24)
        chop_lettuce_parts.append(box("LettuceShred", (0.18, 0.075, 0.03),
                                      (math.cos(a) * r, math.sin(a) * r,
                                       0.04 + 0.015 * i),
                                      P["green_light"] if i % 3 else P["green"],
                                      0.028, 2,
                                      rot=(random.uniform(-0.3, 0.3),
                                           random.uniform(-0.3, 0.3), a)))
    chopped_lettuce = join(chop_lettuce_parts, "LettuceChopped")
    all_objects.append(chopped_lettuce)

    # Whole tomato -----------------------------------------------------------
    tomato_parts = [
        sphere("TomatoBody", 0.27, (0, 0, 0.24), P["tomato"], scale=(1, 1, 0.9),
               segments=32, rings=20),
    ]
    for i in range(5):
        a = (i / 5.0) * math.tau
        tomato_parts.append(sphere("TomatoLeaf", 0.11,
                                   (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.45),
                                   P["green_dark"], scale=(1.5, 0.65, 0.25),
                                   segments=16, rings=10, rot=(0, 0, a)))
    tomato_parts.append(cylinder("TomatoStem", 0.035, 0.1, (0, 0, 0.49),
                                 P["green_dark"], vertices=12))
    tomato = join(tomato_parts, "Tomato")
    all_objects.append(tomato)

    # Chopped tomato ---------------------------------------------------------
    chop_tomato_parts = []
    for i in range(8):
        a = (i / 8.0) * math.tau + 0.2
        r = 0.1 + (i % 3) * 0.055
        chop_tomato_parts.append(box("TomatoChunk", (0.13, 0.11, 0.1),
                                     (math.cos(a) * r, math.sin(a) * r,
                                      0.05 + (i % 2) * 0.03),
                                     P["tomato"], 0.025, 2,
                                     rot=(random.uniform(-0.4, 0.4),
                                          random.uniform(-0.4, 0.4), a)))
    chopped_tomato = join(chop_tomato_parts, "TomatoChopped")
    all_objects.append(chopped_tomato)

    # a little prep bowl (used as decoration)
    bowl_parts = [
        cone("BowlBody", 0.24, 0.32, 0.16, (0, 0, 0.1), P["white"], vertices=32),
        torus("BowlRim", 0.31, 0.025, (0, 0, 0.18), P["cream"], major_segments=32),
    ]
    bowl = join(bowl_parts, "Bowl")
    all_objects.append(bowl)

    export_glb("food.glb", all_objects)


# ---------------------------------------------------------------------------
# Stations
# ---------------------------------------------------------------------------

def counter_base(P, body_color, door_color, name_prefix="Counter"):
    parts = []
    parts.append(box(f"{name_prefix}Base", (1.66, 0.88, 0.9), (0, 0, 0.49),
                     body_color, 0.085, 3))
    parts.append(box(f"{name_prefix}Kick", (1.54, 0.8, 0.13), (0, 0, 0.065),
                     P["wood_dark"], 0.03, 2))
    parts.append(box(f"{name_prefix}Top", (1.82, 1.02, 0.105), (0, 0, 0.975),
                     P["wood"], 0.045, 3))
    # door panels on both sides (readable from every camera angle)
    for side in (-1, 1):
        for x in (-0.4, 0.4):
            parts.append(box(f"{name_prefix}Door", (0.67, 0.055, 0.54),
                             (x, side * 0.445, 0.49), door_color, 0.055, 3))
            parts.append(box(f"{name_prefix}Inset", (0.49, 0.025, 0.35),
                             (x, side * 0.478, 0.49), body_color, 0.035, 2))
            parts.append(cylinder(f"{name_prefix}Handle", 0.028, 0.15,
                                  (x, side * 0.51, 0.7), P["brass"], vertices=16,
                                  rot=(math.radians(90), 0, 0)))
    # corner trim
    for x in (-0.81, 0.81):
        for y in (-0.43, 0.43):
            parts.append(box(f"{name_prefix}Corner", (0.06, 0.06, 0.84),
                             (x, y, 0.47), P["wood_dark"], 0.02, 2))
    return parts


def build_stations():
    print("Building stations...")
    P = palette()
    export_items = []

    # Plain counter ----------------------------------------------------------
    reset_scene()
    counter = join(counter_base(P, P["teal"], P["cream"]), "Counter")
    export_items.append(counter)

    # Stove ------------------------------------------------------------------
    parts = counter_base(P, P["cream"], P["teal"], "Stove")
    parts.append(box("StoveHob", (1.84, 1.03, 0.075), (0, 0, 1.045), P["iron"], 0.03, 2))
    parts.append(box("StoveSplash", (1.78, 0.09, 0.38), (0, 0.47, 1.18), P["iron"],
                     0.035, 2))
    for x in (-0.44, 0.44):
        for y in (-0.24, 0.24):
            parts.append(cylinder("BurnerBase", 0.185, 0.025, (x, y, 1.09), P["black"],
                                  vertices=32, bevel_width=0.008, segments=1))
            parts.append(torus("BurnerRing", 0.155, 0.018, (x, y, 1.108), P["metal"],
                               major_segments=28, minor_segments=6))
            parts.append(cylinder("BurnerCap", 0.06, 0.03, (x, y, 1.11), P["metal"],
                                  vertices=20, bevel_width=0.01))
    for x in (-0.55, -0.28, 0.28, 0.55):
        parts.append(cylinder("StoveKnob", 0.062, 0.075, (x, -0.5, 0.83), P["red"],
                              vertices=20, rot=(math.radians(90), 0, 0)))
        parts.append(sphere("StoveKnobDot", 0.023, (x, -0.545, 0.83), P["cream"],
                            scale=(1, 0.4, 1), segments=12, rings=8))
    stove = join(parts, "StoveStation")
    export_items.append(stove)

    # Chopping station -------------------------------------------------------
    parts = counter_base(P, P["teal"], P["cream"], "Chop")
    parts.append(box("ChoppingBoard", (0.94, 0.68, 0.085), (0, 0, 1.07),
                     P["wood_light"], 0.045, 3))
    parts.append(box("ChoppingBoardStripe", (0.75, 0.05, 0.012), (0, -0.22, 1.12),
                     P["wood_dark"], 0.006, 1))
    # small scrap bowl, kept to the side of the board
    parts.append(cylinder("ScrapBowl", 0.14, 0.16, (0.63, 0.28, 1.11), P["cream"],
                          vertices=24, bevel_width=0.03))
    parts.append(cylinder("ScrapBowlIn", 0.115, 0.02, (0.63, 0.28, 1.19), P["green"],
                          vertices=24, bevel_width=0.01))
    chop = join(parts, "ChopStation")
    export_items.append(chop)

    # Plate station ----------------------------------------------------------
    parts = counter_base(P, P["red"], P["cream"], "Plate")
    parts.append(box("PlateRunner", (0.95, 0.65, 0.018), (0, 0, 1.038),
                     P["cream"], 0.008, 1))
    # low brass rail along the back
    parts.append(cylinder("PlateRailPostL", 0.025, 0.25, (-0.72, 0.4, 1.14),
                          P["brass"], vertices=12))
    parts.append(cylinder("PlateRailPostR", 0.025, 0.25, (0.72, 0.4, 1.14),
                          P["brass"], vertices=12))
    parts.append(cylinder("PlateRail", 0.025, 1.44, (0, 0.4, 1.26), P["brass"],
                          vertices=12, rot=(0, math.radians(90), 0)))
    plate_station = join(parts, "PlateStation")
    export_items.append(plate_station)

    # Serving pass -----------------------------------------------------------
    parts = counter_base(P, P["mustard"], P["cream"], "Serve")
    # serving tray
    parts.append(box("ServeTray", (1.1, 0.62, 0.04), (0, -0.02, 1.045),
                     P["metal"], 0.025, 2))
    # chunky pass arch and sign
    for x in (-0.8, 0.8):
        parts.append(box("ServePost", (0.11, 0.11, 1.1), (x, 0.36, 1.53),
                         P["red_dark"], 0.035, 2))
    parts.append(box("ServeSignBoard", (1.86, 0.1, 0.48), (0, 0.36, 2.12),
                     P["red"], 0.05, 3))
    parts.append(box("ServeSignInset", (1.64, 0.04, 0.3), (0, 0.31, 2.12),
                     P["cream"], 0.03, 2))
    # little bell
    parts.append(cylinder("ServeBellBase", 0.12, 0.035, (0.42, -0.06, 1.08),
                          P["brass"], vertices=24, bevel_width=0.012))
    parts.append(sphere("ServeBellDome", 0.105, (0.42, -0.06, 1.14), P["brass"],
                        scale=(1, 1, 0.85), segments=20, rings=12))
    parts.append(sphere("ServeBellKnob", 0.03, (0.42, -0.06, 1.24), P["brass"],
                        segments=12, rings=8))
    serve = join(parts, "ServeStation")
    export_items.append(serve)

    # Sink (decoration / future dishwashing) ---------------------------------
    parts = counter_base(P, P["teal_dark"], P["cream"], "Sink")
    parts.append(box("SinkBasin", (0.9, 0.64, 0.04), (0, 0, 1.045), P["metal"],
                     0.03, 2))
    parts.append(box("SinkInner", (0.76, 0.5, 0.02), (0, 0, 1.07), P["iron"],
                     0.02, 2))
    parts.append(cylinder("Faucet", 0.04, 0.55, (0, 0.33, 1.3), P["metal"],
                          vertices=16, bevel_width=0.01))
    parts.append(torus("FaucetArch", 0.12, 0.038, (0, 0.2, 1.56), P["metal"],
                       rot=(math.radians(90), 0, 0), major_segments=24))
    sink = join(parts, "SinkStation")
    export_items.append(sink)

    export_glb("stations.glb", export_items)


# ---------------------------------------------------------------------------
# Props
# ---------------------------------------------------------------------------

def build_props():
    print("Building props...")
    P = palette()
    props = []

    # Crate ------------------------------------------------------------------
    parts = [box("CrateFloor", (0.88, 0.68, 0.06), (0, 0, 0.03), P["wood_dark"], 0.02, 2)]
    for x in (-0.41, 0.41):
        for y in (-0.31, 0.31):
            parts.append(box("CratePost", (0.09, 0.09, 0.5), (x, y, 0.27),
                             P["wood_dark"], 0.02, 2))
    for side in (-1, 1):
        for z in (0.1, 0.26, 0.42):
            parts.append(box("CrateSlatX", (0.82, 0.055, 0.15), (0, side * 0.315, z),
                             P["wood"], 0.025, 2))
        for x in (-0.455, 0.455):
            parts.append(box("CrateSlatY", (0.055, 0.6, 0.15), (x, 0, z),
                             P["wood"], 0.025, 2))
    parts.append(box("CrateLabel", (0.58, 0.035, 0.2), (0, -0.335, 0.3),
                     P["cream"], 0.03, 2))
    parts.append(box("CrateLabelLine", (0.45, 0.012, 0.035), (0, -0.358, 0.3),
                     P["red"], 0.008, 1))
    crate = join(parts, "Crate")
    props.append(crate)

    # Pan --------------------------------------------------------------------
    parts = [
        cylinder("PanBody", 0.38, 0.115, (0, 0, 0.065), P["iron"], vertices=40,
                 bevel_width=0.025),
        torus("PanRim", 0.36, 0.035, (0, 0, 0.118), P["black"], major_segments=40),
        cylinder("PanInner", 0.31, 0.03, (0, 0, 0.112), P["black"], vertices=32,
                 bevel_width=0.01),
        box("PanHandle", (0.52, 0.13, 0.09), (0.56, 0, 0.08), P["wood_dark"],
            0.04, 3, rot=(0, 0, math.radians(-4))),
        sphere("PanRivet", 0.035, (0.36, 0, 0.09), P["metal"], segments=12, rings=8),
    ]
    pan = join(parts, "Pan")
    props.append(pan)

    # Knife ------------------------------------------------------------------
    parts = [
        box("KnifeHandle", (0.3, 0.07, 0.08), (-0.2, 0, 0.045), P["wood_dark"],
            0.03, 3),
        sphere("KnifeRivetA", 0.025, (-0.27, 0, 0.09), P["brass"], segments=12, rings=8),
        sphere("KnifeRivetB", 0.025, (-0.13, 0, 0.09), P["brass"], segments=12, rings=8),
        box("KnifeBlade", (0.62, 0.035, 0.14), (0.25, 0, 0.055), P["metal"],
            0.025, 2, rot=(0, math.radians(0), 0)),
    ]
    knife = join(parts, "Knife")
    origin_to_cursor(knife, (0, 0, 0.04))
    props.append(knife)

    # Trash bin --------------------------------------------------------------
    parts = [
        cylinder("TrashBody", 0.33, 0.66, (0, 0, 0.35), P["teal_dark"], vertices=32,
                 bevel_width=0.03),
        torus("TrashRim", 0.33, 0.035, (0, 0, 0.68), P["metal"], major_segments=32),
        cylinder("TrashLid", 0.35, 0.07, (0, 0, 0.72), P["metal"], vertices=32,
                 bevel_width=0.02),
        sphere("TrashKnob", 0.07, (0, 0, 0.78), P["iron"], scale=(1.4, 1.4, 0.8),
               segments=16, rings=10),
        box("TrashPedal", (0.24, 0.16, 0.06), (0, -0.36, 0.08), P["metal"],
            0.02, 2),
        box("TrashStripe", (0.5, 0.02, 0.14), (0, -0.324, 0.5), P["cream"],
            0.015, 1),
    ]
    trash = join(parts, "TrashBin")
    props.append(trash)

    # Plant ------------------------------------------------------------------
    parts = [
        cone("PlantPot", 0.2, 0.27, 0.34, (0, 0, 0.17), P["red"], vertices=28),
        cylinder("PlantSoil", 0.245, 0.03, (0, 0, 0.335), P["wood_dark"], vertices=28),
        cylinder("PlantStem", 0.035, 0.5, (0, 0, 0.55), P["green_dark"], vertices=12),
    ]
    for i in range(7):
        a = (i / 7.0) * math.tau
        z = 0.55 + (i % 3) * 0.12
        parts.append(sphere("PlantLeaf", 0.19,
                            (math.cos(a) * 0.2, math.sin(a) * 0.2, z),
                            P["green"] if i % 2 else P["green_light"],
                            scale=(1.7, 0.55, 0.9), segments=20, rings=12,
                            rot=(0.3, 0, a)))
    plant = join(parts, "Plant")
    props.append(plant)

    # Stool ------------------------------------------------------------------
    parts = [
        cylinder("StoolSeat", 0.31, 0.1, (0, 0, 0.56), P["wood_light"], vertices=32,
                 bevel_width=0.03),
        torus("StoolRing", 0.23, 0.025, (0, 0, 0.3), P["metal"], major_segments=24),
    ]
    for i in range(4):
        a = (i / 4.0) * math.tau + math.pi / 4
        parts.append(cylinder("StoolLeg", 0.035, 0.56,
                              (math.cos(a) * 0.21, math.sin(a) * 0.21, 0.28),
                              P["wood_dark"], vertices=12,
                              rot=(math.radians(6) * math.sin(a),
                                   math.radians(6) * math.cos(a), 0)))
    stool = join(parts, "Stool")
    props.append(stool)

    # Pendant lamp -----------------------------------------------------------------
    parts = [
        cylinder("LampCord", 0.018, 1.5, (0, 0, -0.75), P["black"], vertices=10,
                 bevel_width=0),
        cone("LampShade", 0.42, 0.1, 0.32, (0, 0, -1.58), P["teal"], vertices=32),
        torus("LampShadeRim", 0.4, 0.03, (0, 0, -1.73), P["brass"], major_segments=32),
        sphere("LampBulb", 0.12, (0, 0, -1.68), P["cream"], segments=20, rings=12),
        sphere("LampGlow", 0.22, (0, 0, -1.68),
               material("WarmGlow", "#FFD98A", 0.4, 0.0, "#FFC861", 3.0),
               scale=(1, 1, 0.7), segments=20, rings=12),
    ]
    lamp = join(parts, "PendantLamp")
    props.append(lamp)

    # Bell -------------------------------------------------------------------
    parts = [
        cylinder("BellBase", 0.2, 0.045, (0, 0, 0.022), P["brass"], vertices=28,
                 bevel_width=0.012),
        sphere("BellDome", 0.185, (0, 0, 0.12), P["brass"], scale=(1, 1, 0.9),
               segments=28, rings=16),
        sphere("BellKnob", 0.05, (0, 0, 0.29), P["brass"], segments=16, rings=10),
        box("BellHandle", (0.13, 0.06, 0.05), (0, 0, 0.35), P["wood_dark"], 0.02, 2),
    ]
    bell = join(parts, "Bell")
    props.append(bell)

    # Enamel pot -------------------------------------------------------------
    parts = [
        cylinder("PotBody", 0.34, 0.4, (0, 0, 0.21), P["red"], vertices=32,
                 bevel_width=0.04),
        torus("PotRim", 0.33, 0.035, (0, 0, 0.415), P["cream"], major_segments=32),
        cylinder("PotLid", 0.36, 0.07, (0, 0, 0.445), P["cream"], vertices=32,
                 bevel_width=0.025),
        sphere("PotKnob", 0.06, (0, 0, 0.5), P["red_dark"], segments=16, rings=10),
    ]
    for x in (-0.37, 0.37):
        parts.append(torus("PotHandle", 0.11, 0.03, (x, 0, 0.33), P["iron"],
                           rot=(0, math.radians(90), 0), major_segments=20))
    pot = join(parts, "Pot")
    props.append(pot)

    # Extinguisher -----------------------------------------------------------
    parts = [
        cylinder("ExtBody", 0.14, 0.55, (0, 0, 0.3), P["red"], vertices=24,
                 bevel_width=0.03),
        sphere("ExtTop", 0.14, (0, 0, 0.58), P["red"], scale=(1, 1, 0.55),
               segments=20, rings=12),
        cylinder("ExtNeck", 0.055, 0.12, (0, 0, 0.67), P["metal"], vertices=16),
        box("ExtHandle", (0.18, 0.06, 0.05), (0, -0.02, 0.74), P["black"], 0.02, 2),
        box("ExtLabel", (0.18, 0.02, 0.18), (0, -0.142, 0.34), P["cream"], 0.01, 1),
        cylinder("ExtHose", 0.032, 0.4, (0.16, -0.03, 0.46), P["black"], vertices=12,
                 rot=(0.3, 0, -0.15)),
    ]
    extinguisher = join(parts, "Extinguisher")
    props.append(extinguisher)

    # Jar of goodies ---------------------------------------------------------
    parts = [
        cylinder("JarBody", 0.12, 0.26, (0, 0, 0.13), P["cream"], vertices=24,
                 bevel_width=0.02),
        cylinder("JarContents", 0.1, 0.11, (0, 0, 0.085), P["mustard"], vertices=24,
                 bevel_width=0.01),
        cylinder("JarLid", 0.13, 0.05, (0, 0, 0.275), P["red"], vertices=24,
                 bevel_width=0.012),
    ]
    jar = join(parts, "Jar")
    props.append(jar)

    export_glb("props.glb", props)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    build_chef()
    build_food()
    build_stations()
    build_props()
    print("All assets exported to", OUT)


if __name__ == "__main__":
    main()
