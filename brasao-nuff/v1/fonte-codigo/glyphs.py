from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import glob, os
D=os.path.dirname(os.path.abspath(__file__))+'/../fonts/'
F={k:TTFont(glob.glob(D+'*'+p+'.ttf')[0]) for k,p in [('thin','Thin'),('light','Light'),('regular','-AlbertusNova'),('bold','Bold'),('black','Black')]}
def glyph(ch,w='regular'):
    f=F[w]; gs=f.getGlyphSet(); name=f.getBestCmap()[ord(ch)]
    p=SVGPathPen(gs); gs[name].draw(p); b=BoundsPen(gs); gs[name].draw(b)
    return p.getCommands(), b.bounds, gs[name].width
def place(ch,cx,base,h,w='regular',mirror=False,fill='currentColor',anchor='center'):
    """place glyph with cap height h (px), horizontally centered at cx on baseline base"""
    d,(x0,y0,x1,y1),adv=glyph(ch,w); s=h/819
    mx=(x0+x1)/2
    sx=-s if mirror else s
    return f'<path d="{d}" transform="translate({cx},{base}) scale({sx},{-s}) translate({-mx},0)" fill="{fill}"/>', (x1-x0)*s
def text_width(txt,h,w='regular',track=0):
    s=h/819; f=F[w]; cmap=f.getBestCmap(); hm=f['hmtx']
    return sum(hm[cmap[ord(c)]][0]*s for c in txt)+track*(len(txt)-1)
def text(txt,cx,base,h,w='regular',track=0,fill='currentColor'):
    s=h/819; f=F[w]; gs=f.getGlyphSet(); cmap=f.getBestCmap(); x=cx-text_width(txt,h,w,track)/2; out=[]
    for c in txt:
        n=cmap[ord(c)]; p=SVGPathPen(gs); gs[n].draw(p)
        out.append(f'<path d="{p.getCommands()}" transform="translate({x:.2f},{base}) scale({s},{-s})" fill="{fill}"/>'); x+=gs[n].width*s+track
    return ''.join(out)
import math
def arc_text(txt,cx,cy,r,h,w='regular',track=0,top=True,fill='currentColor'):
    """text along circle; top=True reads clockwise over top, else along bottom reading left->right"""
    s=h/819; f=F[w]; gs=f.getGlyphSet(); cmap=f.getBestCmap()
    total=text_width(txt,h,w,track); out=[]
    rr = r if top else r+h  # baseline radius
    ang=-total/2/rr if top else total/2/rr
    for c in txt:
        n=cmap[ord(c)]; adv=gs[n].width*s; p=SVGPathPen(gs); gs[n].draw(p)
        if top:
            a=ang+adv/2/rr; deg=math.degrees(a)
            out.append(f'<g transform="translate({cx},{cy}) rotate({deg:.3f}) translate(0,{-rr})"><path d="{p.getCommands()}" transform="scale({s},{-s}) translate({-gs[n].width/2},0)" fill="{fill}"/></g>')
            ang+=(adv+track)/rr
        else:
            a=ang-adv/2/rr; deg=math.degrees(a)
            out.append(f'<g transform="translate({cx},{cy}) rotate({deg:.3f}) translate(0,{rr})"><path d="{p.getCommands()}" transform="scale({s},{-s}) translate({-gs[n].width/2},0)" fill="{fill}"/></g>')
            ang-=(adv+track)/rr
    return ''.join(out)
def svg(body,w,h,bg,fg):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="color:{fg}"><rect width="100%" height="100%" fill="{bg}"/>{body}</svg>'
def svg_t(body,w,h,fg):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" color="{fg}" style="color:{fg}">{body}</svg>'
