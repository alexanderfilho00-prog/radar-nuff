import pathops
from pathops import Path, op, PathOp
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from glyphs import F
def gpath(ch,w='regular',t=(1,0,0,1,0,0)):
    f=F[w]; gs=f.getGlyphSet(); p=Path(); gs[f.getBestCmap()[ord(ch)]].draw(TransformPen(p.getPen(),t)); return p
def rect(x0,y0,x1,y1):
    p=Path(); pen=p.getPen(); pen.moveTo((x0,y0)); pen.lineTo((x1,y0)); pen.lineTo((x1,y1)); pen.lineTo((x0,y1)); pen.closePath(); return p
def tf(p,t):
    q=Path(); p.draw(TransformPen(q.getPen(),t)); return q
U_=lambda a,b: op(a,b,PathOp.UNION)
I_=lambda a,b: op(a,b,PathOp.INTERSECTION)
D_=lambda a,b: op(a,b,PathOp.DIFFERENCE)
def svgd(p):
    s=SVGPathPen(None); p.draw(s); return s.getCommands()
BIG=10000

def measure(ch,w,y=430):
    """x extents of the stems of a glyph at height y"""
    p=I_(gpath(ch,w),rect(-BIG,y,BIG,y+1)); 
    from fontTools.pens.recordingPen import RecordingPen
    # use contours bounds
    out=[(c.bounds[0],c.bounds[2]) for c in p.contours]
    return sorted(out)
def build(NC=430,nw="bold",uw='regular',fw='regular',ucut=520,drop=110,arms='top',arm_scale=1.0,arm_y=0):
    U=gpath('U',uw)
    (ul0,ul1),(ur0,ur1)=measure('U',uw)[:2]
    Nn=gpath('N',nw); st=measure('N',nw)
    (nl0,nl1),(nr0,nr1)=st[0],st[-1]
    sx=((ur0+ur1)/2-(ul0+ul1)/2)/((nr0+nr1)/2-(nl0+nl1)/2)
    # scale N horizontally so its stem centres land on U's stem centres
    ox=(ul0+ul1)/2-sx*(nl0+nl1)/2
    N=tf(Nn,(sx,0,0,1,ox,0))
    L0,L1=ul0,ul1; R0,R1=ur0,ur1
    TC=700
    top=I_(N,rect(-BIG,TC,BIG,BIG))
    if arms: top=I_(top,rect(L0,-BIG,R1,BIG))      # F arms replace N's outer beaks
    diag=D_(I_(N,rect(L1,0,R0+25,TC+1)),rect(L1+1,-BIG,L1+80,300))
    # straight-line crotch: extend the diagonal's lower edge until it meets the right stem
    def lx(y): return I_(diag,rect(L1+60,y,R0-1,y+1)).bounds[0]
    y1_,y2_=200,300; x1_,x2_=lx(y1_),lx(y2_)
    slope=(y2_-y1_)/(x2_-x1_); yend=y1_+slope*(R0-x1_)
    diag=I_(diag,rect(-BIG,y1_,BIG,BIG))
    w_=Path(); pn=w_.getPen(); pn.moveTo((x1_,y1_)); pn.lineTo((R0+5,y1_)); pn.lineTo((R0+5,yend)); pn.lineTo((R0,yend)); pn.closePath()
    diag=U_(diag,w_)
    Uc=I_(U,rect(-BIG,-BIG,BIG,ucut)); dy=-ucut; Uc=tf(Uc,(1,0,0,1,0,dy))
    stems=U_(rect(L0,-60,L1,TC+1),rect(R0,-60,R1,TC+1))
    m=U_(U_(U_(top,diag),Uc),stems)
    info=dict(L=(L0,L1),R=(R0,R1),bottom=dy-7,top=819,dy=dy)
    if arms:
        Fp=gpath('F',fw); (f0,f1)=measure('F',fw,300)[0]
        fa=I_(Fp,rect(f1-8,330,BIG,BIG))
        if arm_scale!=1: fa=tf(fa,(arm_scale,0,0,arm_scale,f1*(1-arm_scale),819*(1-arm_scale)))
        right=tf(fa,(1,0,0,1,R1-f1,arm_y)); left=tf(fa,(-1,0,0,1,L0+f1,arm_y))
        m=U_(m,U_(right,left))
    return m,info
