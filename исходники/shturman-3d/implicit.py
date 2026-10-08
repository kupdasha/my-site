import json, numpy as np, sys
from scipy import ndimage
from skimage import measure
m=np.load('mask.npy'); G=json.load(open('grid.json')); R=G['R']; span=G['span']; org=np.array(G['org'])
px=span/R
sd=(ndimage.distance_transform_edt(m)-ndimage.distance_transform_edt(~m))*px
sd=ndimage.gaussian_filter(sd,2.0)
W=ndimage.maximum_filter(np.maximum(sd,0),size=int(0.5/px)); W=ndimage.gaussian_filter(W,0.06/px); W=np.maximum(W,0.02)
N=int(sys.argv[1]); s=R/N
sdN=ndimage.zoom(sd,1/s,order=1); WN=ndimage.zoom(W,1/s,order=1)
h=span/N; zmax=W.max()*1.15; nz=int(2*zmax/h)+3
zs=np.linspace(-zmax,zmax,nz)
t=np.minimum(sdN,WN)
F=np.sqrt(zs[None,None,:]**2+(WN-t)[...,None]**2)-WN[...,None]   # <0 внутри
F=np.pad(F,1,constant_values=1.0)
v,f,_,_=measure.marching_cubes(F.astype(np.float32),0.0,spacing=(h,h,zs[1]-zs[0]))
v-=np.array([h,h,zs[1]-zs[0]])
# оси: [row, col, z] -> мир: x=col, y=-row
P=np.stack([v[:,1]+org[0], -(v[:,0])+org[1]+span, v[:,2]-zmax],1)
P[:,:2]-= (P[:,:2].max(0)+P[:,:2].min(0))/2
with open('implicit.obj','w') as o:
    for p in P: o.write('v %f %f %f\n'%tuple(p))
    for a,b,c in f+1: o.write('f %d %d %d\n'%(a,c,b))
print('V',len(v),'F',len(f),'nz',nz)
