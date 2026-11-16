import p1,p2,p3
from pen import svgd
cells=[]
names=['1 · Cascata','2 · Encaixe','3 · Dois eixos']
body=''
for i,mod in enumerate([p1,p2,p3]):
    m=mod.build(); x0,y0,x1,y1=m.bounds
    k=min(500/(y1-y0),560/(x1-x0)); cx=350+i*700; cy=380
    body+=f'<path d="{svgd(m)}" fill="#141414" transform="translate({cx},{cy}) scale({k}) translate({-(x0+x1)/2},{-(y0+y1)/2})"/>'
    body+=f'<text x="{cx}" y="720" font-family="Helvetica,Arial" font-size="26" fill="#6b665e" text-anchor="middle">{names[i]}</text>'
    # small reading check
    ks=48/(y1-y0)
    body+=f'<path d="{svgd(m)}" fill="#141414" transform="translate({cx},{790}) scale({ks}) translate({-(x0+x1)/2},{-(y0+y1)/2})"/>'
open('board3.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2100 850" width="2100" height="850"><rect width="100%" height="100%" fill="#f2efe8"/>{body}</svg>')
