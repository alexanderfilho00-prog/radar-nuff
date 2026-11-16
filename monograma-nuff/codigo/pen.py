"""Pointed-pen lettering engine: skeleton points -> Catmull-Rom curve -> contrast stroke outline (pathops)."""
import math
from shapely.geometry import Polygon as SPoly, Point as SPoint
from shapely.ops import unary_union
def quads(left,right):
    """robust stroke body: union of the quads between consecutive cross-sections"""
    qs=[]
    for i in range(len(left)-1):
        q=SPoly([left[i],left[i+1],right[i+1],right[i]])
        if not q.is_valid: q=q.buffer(0)
        qs.append(q)
    return unary_union(qs).buffer(0)
from pathops import Path, op, PathOp
from fontTools.pens.svgPathPen import SVGPathPen
U_=lambda a,b: op(a,b,PathOp.UNION); D_=lambda a,b: op(a,b,PathOp.DIFFERENCE)
def cr(pts,n=40,closed=False,alpha=0.5):
    """centripetal Catmull-Rom through pts"""
    P=[pts[0]]+list(pts)+[pts[-1]] if not closed else [pts[-1]]+list(pts)+[pts[0],pts[1]]
    out=[]
    def tj(ti,a,b): return ti+max(1e-6,math.dist(a,b))**alpha
    for i in range(1,len(P)-2):
        p0,p1,p2,p3=P[i-1],P[i],P[i+1],P[i+2]
        if p0==p1: p0=(2*p1[0]-p2[0],2*p1[1]-p2[1])
        if p3==p2: p3=(2*p2[0]-p1[0],2*p2[1]-p1[1])
        t0=0;t1=tj(t0,p0,p1);t2=tj(t1,p1,p2);t3=tj(t2,p2,p3)
        for k in range(n):
            t=t1+(t2-t1)*k/n
            def L(a,b,ta,tb): return tuple(((tb-t)*a[j]+(t-ta)*b[j])/(tb-ta) for j in (0,1))
            A1=L(p0,p1,t0,t1);A2=L(p1,p2,t1,t2);A3=L(p2,p3,t2,t3)
            B1=L(A1,A2,t0,t2);B2=L(A2,A3,t1,t3)
            out.append(L(B1,B2,t1,t2))
    out.append(pts[-1]); return out
def spiral(cx,cy,r0,a0,turns,cw=True,shrink=0.55,n=14):
    """points of an inward spiral starting at angle a0 (deg) radius r0"""
    pts=[]; s=1 if cw else -1
    for i in range(int(n*turns)+1):
        f=i/(n*turns); a=math.radians(a0+s*360*turns*f); r=r0*(1-(1-shrink)*f)
        pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    return pts
SLANT=14
def stroke(pts,wmax=34,wmin=5,taper=(0.0,0.0),ball=(0,0),slant=None,n=40,power=1.6,closed=False,curve=None,swell=0.12):
    s=math.radians(SLANT if slant is None else slant)
    ax=(-math.sin(s),math.cos(s))        # pen downstroke axis (y down, leaning right)
    C=curve or cr(pts,n,closed)
    # dedupe
    Q=[C[0]]
    for p in C[1:]:
        if math.dist(p,Q[-1])>0.4: Q.append(p)
    C=Q; L=[0]
    for i in range(1,len(C)): L.append(L[-1]+math.dist(C[i-1],C[i]))
    tot=L[-1] or 1
    left=[];right=[];W=[]
    for i,p in enumerate(C):
        a=C[max(i-1,0)]; b=C[min(i+1,len(C)-1)]
        dx,dy=b[0]-a[0],b[1]-a[1]; d=math.hypot(dx,dy) or 1; tx,ty=dx/d,dy/d
        f=max(0.0,tx*ax[0]+ty*ax[1])**power
        w=wmin+(wmax-wmin)*f
        u=L[i]/tot
        if taper[0]>0 and u<taper[0]: w=wmin+(w-wmin)*(u/taper[0])**0.8
        if taper[1]>0 and u>1-taper[1]: w=wmin+(w-wmin)*((1-u)/taper[1])**0.8
        # teardrop: swell into the ball over the last/first `swell` of the length
        for end,r in ((0,ball[0]),(1,ball[1])):
            if r:
                uu=u if end==0 else 1-u
                if uu<swell: w=max(w, w+(2*r-w)*(1-uu/swell)**2)
        W.append(w); nx,ny=-ty,tx
        left.append((p[0]+nx*w/2,p[1]+ny*w/2)); right.append((p[0]-nx*w/2,p[1]-ny*w/2))
    path=quads(left,right)
    for end,r in ((0,ball[0]),(-1,ball[1])):
        rr=r if r else W[end]/2
        path=path.union(SPoint(C[end]).buffer(rr,32))
    return St(path,C,W)
class St:
    def __init__(s,p,C,W): s.p=p; s.C=C; s.W=W
def circle(cx,cy,r,n=48):
    p=Path(); pen=p.getPen()
    pen.moveTo((cx+r,cy))
    for i in range(1,n): a=2*math.pi*i/n; pen.lineTo((cx+r*math.cos(a),cy+r*math.sin(a)))
    pen.closePath(); return p
def widen(path_stroke,gap,**kw):
    """the same stroke, fattened by gap on each side (used to cut under-strokes)"""
    return path_stroke
def svgd(g):
    polys=[g] if g.geom_type=='Polygon' else list(getattr(g,'geoms',[]))
    out=[]
    for P in polys:
        if P.geom_type!='Polygon' or P.is_empty: continue
        for ring in [P.exterior]+list(P.interiors):
            c=list(ring.coords)
            out.append('M'+'L'.join(f'{x:.2f} {y:.2f}' for x,y in c[:-1])+'Z')
    return ''.join(out)
def compose(strokes,cuts=()):
    """strokes: dict name->Path ; cuts: list (under, over, gap) -> under gets an air gap where over crosses"""
    S=dict(strokes)
    for under,over,gap in cuts:
        o=strokes[over]
        g=stroke(None,curve=o.C,wmax=0,wmin=0) if False else None
        S[under]=St(S[under].p.difference(o.p.buffer(gap,16)),S[under].C,S[under].W)
    return unary_union([v.p for v in S.values()]).buffer(0)
def fatten(o,gap):
    """outline of stroke o grown by gap: rebuild from its centreline with widths+2gap"""
    C,W=o.C,o.W
    left=[];right=[]
    for i,p in enumerate(C):
        a=C[max(i-1,0)]; b=C[min(i+1,len(C)-1)]
        dx,dy=b[0]-a[0],b[1]-a[1]; d=math.hypot(dx,dy) or 1; tx,ty=dx/d,dy/d; nx,ny=-ty,tx; w=W[i]+2*gap
        left.append((p[0]+nx*w/2,p[1]+ny*w/2)); right.append((p[0]-nx*w/2,p[1]-ny*w/2))
    path=Path(); pen=path.getPen(); poly=left+right[::-1]
    pen.moveTo(poly[0]); [pen.lineTo(q) for q in poly[1:]]; pen.closePath()
    from pathops import simplify, FillType
    path.fillType=FillType.WINDING; return simplify(path,fix_winding=True)
def svg(body,w,h,bg,fg,guides=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><rect width="100%" height="100%" fill="{bg}"/>{guides}<g fill="{fg}">{body}</g></svg>'

from fontTools.pens.transformPen import TransformPen
def shifted(p,dx,dy):
    q=Path(); p.draw(TransformPen(q.getPen(),(1,0,0,1,dx,dy))); return q
def inflate(p,g,n=12):
    out=Path(); out=U_(out,p)
    for i in range(n):
        a=2*math.pi*i/n; out=U_(out,shifted(p,g*math.cos(a),g*math.sin(a)))
    return out
