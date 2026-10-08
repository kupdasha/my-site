import numpy as np, struct, sys
b=open(sys.argv[1],'rb').read(); BITS=int(sys.argv[3])
nv,ni=struct.unpack('<II',b[:8]); P=np.frombuffer(b,'<i2',nv*3,8).reshape(-1,3).astype(np.float64)/32767
off=8+((nv*6+3)//4)*4; T=np.frombuffer(b,'<u2',ni,off).astype(np.int64)
order=[];seen=np.full(nv,-1)
for i in T:
    if seen[i]<0: seen[i]=len(order); order.append(i)
P=P[np.array(order)]; T=seen[T]
Q=(2**(BITS-1)-1); Pq=np.round(P*Q).astype(np.int32)
dP=np.diff(np.vstack([[0,0,0],Pq]),axis=0).astype('<i2')
# индекс как отступ назад от «следующей новой вершины»: новая вершина — 0
hw=0; code=[]
for i in T:
    code.append(hw-i)
    if i==hw: hw+=1
code=np.array(code).astype('<u2')
def zz(a): a=a.astype(np.int32); return ((a<<1)^(a>>31)).astype(np.uint16)
def planes(a): v=a.astype('<u2').view(np.uint8).reshape(-1,2); return v[:,0].tobytes()+v[:,1].tobytes()
body=b''.join(planes(zz(dP[:,k])) for k in range(3))+planes(code)
out=b'SHM3'+struct.pack('<III',nv,ni,Q)+body
open(sys.argv[2],'wb').write(out)
