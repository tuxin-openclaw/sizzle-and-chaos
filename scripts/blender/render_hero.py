"""Render the transparent chef key art used on the title screen.

Run with:
  blender --background --factory-startup --python scripts/blender/render_hero.py

Outputs public/hero-chef.png. The checked-in menu asset is
public/hero-chef-trimmed.png (the transparent margins are trimmed for layout).
"""

import bpy, os, math
from mathutils import Vector

PROJECT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
clear()
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1500
scene.render.resolution_y = 1500
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

world = bpy.data.worlds.new('W'); scene.world=world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(0.18,0.26,0.28,1)
world.node_tree.nodes['Background'].inputs[1].default_value=0.45

def import_asset(path, dx=0, dy=0, dz=0, scale=1, rotz=0):
    bpy.ops.import_scene.gltf(filepath=path)
    objs = list(bpy.context.selected_objects)
    roots = [o for o in objs if o.parent is None]
    for o in roots:
        o.location.x += dx
        o.location.y += dy
        o.location.z += dz
        o.rotation_euler.z += rotz
        o.scale = (o.scale.x*scale, o.scale.y*scale, o.scale.z*scale)
    return objs

D=os.path.join(PROJECT,'public','models')
# counter and chef
import_asset(os.path.join(D,'stations.glb'), 0, -1.2, 0, 1.0)
# stations glb includes all stations overlapping; need delete other station objects
keep = {'Counter'}
for o in bpy.context.selected_objects:
    if o.parent is None and o.name not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
chef_objs = import_asset(os.path.join(D,'chef.glb'), 0.05, 0.2, 0.0, 1.0)
# arms forward onto counter
for o in chef_objs:
    if o.name in ('ChefArmL','ChefArmR'):
        o.rotation_euler.x = math.radians(-52)
        o.rotation_euler.y = math.radians(24 if o.name.endswith('L') else -24)

# food objects
food = {}
bpy.ops.import_scene.gltf(filepath=os.path.join(D,'food.glb'))
for o in bpy.context.selected_objects:
    if o.parent is None:
        food[o.name] = o
# hide all, then position copies
for o in food.values():
    o.hide_render = True
    o.hide_viewport = True

def place(name, x, y, z, scale=1.0, rotz=0):
    src = food[name]
    dup = src.copy(); dup.data = src.data.copy()
    bpy.context.collection.objects.link(dup)
    dup.hide_render = False; dup.hide_viewport = False
    dup.location=(x,y,z)
    dup.rotation_euler.z = rotz
    dup.scale=(scale,scale,scale)
    return dup

# plate and burger on the counter
place('Plate', -0.25, -1.1, 1.04, 0.92)
place('Bun', -0.25, -1.1, 1.08, 0.82)
place('Patty', -0.25, -1.1, 1.14, 0.82)
place('LettuceChopped', -0.25, -1.1, 1.2, 0.82)
place('TomatoChopped', -0.25, -1.1, 1.23, 0.68)
place('Bun', -0.25, -1.1, 1.27, 0.76)
# side garnish
place('Tomato', 0.48, -1.1, 1.04, 0.7)
place('Lettuce', 0.72, -0.96, 1.04, 0.52)
# props: plant left, pan right? maybe bell
props = {}
bpy.ops.import_scene.gltf(filepath=os.path.join(D,'props.glb'))
for o in bpy.context.selected_objects:
    if o.parent is None:
        props[o.name]=o
for o in props.values():
    o.hide_render = True; o.hide_viewport = True

def prop(name,x,y,z,scale=1.0,rotz=0):
    src=props[name]; dup=src.copy(); dup.data=src.data.copy(); bpy.context.collection.objects.link(dup)
    dup.hide_render=False; dup.hide_viewport=False
    dup.location=(x,y,z); dup.scale=(scale,scale,scale); dup.rotation_euler.z=rotz
    return dup
prop('Plant', -1.35, -1.05, 1.04, 0.62)
prop('Bell', 0.78, -1.4, 1.04, 0.8)
# small herb jar
prop('Jar', 1.25, -1.25, 1.04, 0.85)

# circular plinth beneath everything, slightly larger
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=2.5, depth=0.22, location=(0,0,0.11))
plinth=bpy.context.object
m=bpy.data.materials.new('Plinth'); m.use_nodes=True
m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.11,0.3,0.27,1)
m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=0.75
plinth.data.materials.append(m)
# a warm rug ring on top
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.68, depth=0.035, location=(0,0,0.235))
ring=bpy.context.object
m2=bpy.data.materials.new('Ring'); m2.use_nodes=True
m2.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.68,0.24,0.14,1)
m2.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=0.8
ring.data.materials.append(m2)

# camera
bpy.ops.object.camera_add(location=(0, -10.5, 4.3), rotation=(0,0,0))
cam=bpy.context.object; cam.data.lens=60; scene.camera=cam
# aim camera at the chef and counter
bpy.ops.object.empty_add(location=(0, -0.25, 1.1)); focus=bpy.context.object
con = cam.constraints.new('TRACK_TO')
con.target = focus
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'
cam.data.dof.use_dof=True; cam.data.dof.focus_object=focus; cam.data.dof.aperture_fstop=6.3

def area(name, loc, energy, size, color):
    d=bpy.data.lights.new(name,'AREA'); d.energy=energy; d.shape='DISK'; d.size=size; d.color=color
    ob=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(ob); ob.location=loc
    ob.rotation_euler=(math.radians(58),0,math.radians(25))
area('Key',(-4.5,-5.5,7.5),1100,5.0,(1.0,0.82,0.63))
area('Fill',(5,-4,4.5),500,4.0,(0.55,0.78,1.0))
area('Rim',(0,3.5,6),900,4.0,(1.0,0.55,0.32))
area('Top',(0,-1,9),500,4.0,(1.0,0.92,0.78))

scene.render.filepath=os.path.join(PROJECT,'public','hero-chef.png')
bpy.ops.render.render(write_still=True)
print('hero rendered')
