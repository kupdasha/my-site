import bpy, json
from mathutils.geometry import interpolate_bezier
o=bpy.data.objects['Curve']; M=o.matrix_world
out=[]
for s in o.data.splines:
    bp=s.bezier_points; n=len(bp); pts=[]
    for i in range(n):
        a=bp[i]; b=bp[(i+1)%n]
        seg=interpolate_bezier(a.co,a.handle_right,b.handle_left,b.co,64)
        pts+= [tuple((M@p)[:2]) for p in seg[:-1]]
    out.append(pts)
json.dump(out,open('contour.json','w'))
print('ok',[len(p) for p in out])
