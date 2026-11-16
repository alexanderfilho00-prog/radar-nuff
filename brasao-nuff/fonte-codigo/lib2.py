from glyphs import *
STEM={'thin':148,'light':150,'regular':152,'bold':165,'black':175}
class L:
    """a layer: glyph path + transform, or raw d"""
    def __init__(s,d,tf=''): s.d=d; s.tf=tf
    def el(s,fill,stroke=None,sw=0):
        st=f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" vector-effect="non-scaling-stroke"' if stroke else ''
        return f'<path d="{s.d}" transform="{s.tf}" fill="{fill}"{st}/>'
def G(ch,cx,base,h,w='regular',mirror=False,pivot=None,sx=1.0):
    d,(x0,y0,x1,y1),adv=glyph(ch,w); s=h/819
    px = pivot if pivot is not None else (x0+x1)/2
    k=-s*sx if mirror else s*sx
    return L(d,f'translate({cx},{base}) scale({k},{-s}) translate({-px},0)')
def FF(cx,base,h,w='regular'):
    p=STEM[w]; a=G('F',cx,base,h,w,pivot=p); b=G('F',cx,base,h,w,mirror=True,pivot=p); a.nocut=[b]; return [a,b]
def compose(layers,gap,fill='currentColor',idp='m'):
    """later layers sit on top and cut a gap into earlier ones"""
    defs=[];out=[]
    for i,l in enumerate(layers):
        above=[a for a in layers[i+1:] if a not in getattr(l,'nocut',[])]
        if above and gap>0:
            mid=f'{idp}{i}'
            defs.append(f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/>'+''.join(a.el('#000','#000',gap) for a in above)+'</mask>')
            out.append(f'<g mask="url(#{mid})">{l.el(fill)}</g>')
        else: out.append(l.el(fill))
    return '<defs>'+''.join(defs)+'</defs>'+''.join(out)
def rectL(x,y,w,h): return L(f'M{x} {y}h{w}v{h}h{-w}z')
def ellipse_ring(cx,cy,rx,ry,t):
    return (f'<path fill-rule="evenodd" fill="currentColor" d="M{cx-rx} {cy}a{rx} {ry} 0 1 0 {2*rx} 0a{rx} {ry} 0 1 0 {-2*rx} 0z'
            f'M{cx-rx+t} {cy}a{rx-t} {ry-t} 0 1 0 {2*(rx-t)} 0a{rx-t} {ry-t} 0 1 0 {-2*(rx-t)} 0z"/>')
def reg(cx,cy,r,w='regular'):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="currentColor" stroke-width="{r*0.16}"/>'+text('R',cx,cy+r*0.42,r*1.1,w)
def flared_stem(cx,y0,y1,sw,fl=1.45,flen=None,top=True,bot=True):
    """vertical stem with Albertus-like concave flares at the ends"""
    flen=flen or sw*1.6; a=sw/2; b=sw*fl/2
    t0=y0+flen if top else y0; t1=y1-flen if bot else y1
    d=f'M{cx-(b if top else a)} {y0}H{cx+(b if top else a)}'
    d+=f'Q{cx+a} {y0+flen*0.25} {cx+a} {t0}' if top else ''
    d+=f'V{t1}'
    d+=f'Q{cx+a} {y1-flen*0.25} {cx+b} {y1}' if bot else f'V{y1}'
    d+=f'H{cx-(b if bot else a)}'
    d+=f'Q{cx-a} {y1-flen*0.25} {cx-a} {t1}' if bot else ''
    d+=f'V{t0}'
    d+=f'Q{cx-a} {y0+flen*0.25} {cx-b} {y0}Z' if top else 'Z'
    return L(d)
def wavy(cx,cy,R,n=4.0,a=0.045,k=8,ph=0,N=720):
    pts=[]
    for i in range(N):
        t=2*math.pi*i/N
        c,s_=math.cos(t),math.sin(t)
        r=R/((abs(c)**n+abs(s_)**n)**(1/n))
        r*=1+a*math.cos(k*t+ph)
        pts.append((cx+r*c,cy+r*s_))
    return 'M'+'L'.join(f'{x:.2f} {y:.2f}' for x,y in pts)+'Z'
def ring(d_outer,d_inner,fill='currentColor'):
    return f'<path fill-rule="evenodd" fill="{fill}" d="{d_outer}{d_inner}"/>'
def chalice(cx,cy,k=1.0,w='regular',uw='thin'):
    """B monogram: thin U cup, N nested, FF double-cross foot, spine. k=1 -> ~490px tall, centred on cy"""
    hU=270*k; hN=104*k; hF=150*k
    total=55*k+hU+14*k+hF; top=cy-total/2
    Utop=top+55*k; Ub=Utop+hU; Nb=Utop+hN+70*k; Fb=Ub+hF+14*k
    s=hF/819
    ff=FF(cx,Fb,hF,w)
    sp=flared_stem(cx,top,Fb-40*k,119*s*0.6,fl=2.6,flen=26*k,bot=False); sp.nocut=ff
    return [G('U',cx,Ub,hU,uw,sx=1.12), sp, G('N',cx,Nb,hN,w)]+ff, dict(top=top,bottom=Fb,Utop=Utop,Ub=Ub)
