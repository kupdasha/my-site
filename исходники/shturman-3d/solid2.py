import bpy, bmesh, struct, os
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath='implicit.obj', forward_axis='Y', up_axis='Z')
ob=bpy.context.selected_objects[0]; bpy.context.view_layer.objects.active=ob
s=ob.modifiers.new('s','LAPLACIANSMOOTH'); s.iterations=int(os.environ['IT']); s.lambda_factor=0.5
bpy.ops.object.modifier_apply(modifier='s')
d=ob.modifiers.new('d','DECIMATE'); d.ratio=float(os.environ['DR'])
bpy.ops.object.modifier_apply(modifier='d')
bm=bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.triangulate(bm,faces=bm.faces); bm.to_mesh(ob.data); bm.free()
me=ob.data; vs=[v.co.copy() for v in me.vertices]
mn=Vector([min(v[i] for v in vs) for i in range(3)]); mx=Vector([max(v[i] for v in vs) for i in range(3)]); c=(mn+mx)/2; sc=max(mx-mn)/2
q=lambda f:int(round(max(-1,min(1,f))*32767))
out=bytearray(struct.pack('<II',len(vs),len(me.polygons)*3))
for v in vs: p=(v-c)/sc; out+=struct.pack('<hhh',q(p.x),q(p.y),q(p.z))
if len(out)%4: out+=b'\0'*(4-len(out)%4)
assert len(vs)<65536,len(vs)
for p in me.polygons: out+=struct.pack('<HHH',*p.vertices)
open(os.environ['OUT'],'wb').write(out); print('V',len(vs),'T',len(me.polygons),'bytes',len(out),'dims',(mx-mn)[:])
