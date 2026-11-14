import numpy as np
from PIL import Image
from scipy import ndimage as nd
def key(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    R,G,B=a[...,0],a[...,1],a[...,2]
    m=np.minimum(R,B)-G
    al=np.clip(1-(m-35)/70,0,1)
    s=np.clip(m,0,None)
    out=np.empty(a.shape[:2]+(4,),np.float32)
    out[...,0]=np.clip(R-s,0,255);out[...,1]=G;out[...,2]=np.clip(B-s,0,255);out[...,3]=al*255
    return out
def segs(out,thr=128,mingap=3,minw=8):
    msk=out[...,3]>thr
    lab,n=nd.label(msk)
    sizes=nd.sum(msk,lab,range(1,n+1))
    keep=np.isin(lab,1+np.where(sizes>=60)[0])
    col=keep.any(0)
    xs=np.where(col)[0];res=[]
    if len(xs)==0:return keep,res
    st=xs[0];pv=xs[0]
    for x in xs[1:]:
        if x-pv>mingap: res.append((st,pv));st=x
        pv=x
    res.append((st,pv))
    return keep,[r for r in res if r[1]-r[0]>=minw]
def figures(out,minarea=3000):
    msk=out[...,3]>40
    dil=nd.binary_dilation(msk,iterations=3)
    lab,n=nd.label(dil)
    objs=nd.find_objects(lab)
    areas=nd.sum(msk,lab,range(1,n+1))
    big=[i+1 for i in range(n) if areas[i]>=minarea and (objs[i][1].stop-objs[i][1].start)>20 and (objs[i][0].stop-objs[i][0].start)>20]
    cen={b:nd.center_of_mass(msk,lab,b) for b in big}
    assign=np.zeros(n+1,int)
    for i in range(1,n+1):
        if i in big: assign[i]=i;continue
        if areas[i-1]<25: continue
        cy,cx=nd.center_of_mass(msk,lab,i)
        assign[i]=min(big,key=lambda b:(cen[b][0]-cy)**2+(cen[b][1]-cx)**2)
    lab2=assign[lab]
    figs=[]
    for b in big:
        m=(lab2==b)&dil
        ys,xs=np.where(m&msk)
        figs.append(dict(id=b,x0=xs.min(),x1=xs.max(),y0=ys.min(),y1=ys.max(),mask=m))
    figs.sort(key=lambda f:(f['x0']))
    return figs
def crop(out,f,pad=0):
    o=out.copy();o[...,3]*=f['mask']
    return o[f['y0']-pad:f['y1']+1+pad,f['x0']-pad:f['x1']+1+pad]
