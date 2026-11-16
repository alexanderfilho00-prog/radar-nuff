from lib2 import *
W,H=1200,1200; cx=600; cy=600
lay,m=chalice(cx,cy,1.0)
body=compose(lay,14)
ry=(m['bottom']-m['top'])/2+58; rx=ry*0.82
body+=ellipse_ring(cx,cy,rx,ry,12)
body+=reg(cx+148,m['Utop']+8,12)
import sys; bg,fg='#fff','#111'; open('b.svg','w').write(svg(body,W,H,bg,fg)); open('b_t.svg','w').write(svg_t(body,W,H,'#000')); open('b_tw.svg','w').write(svg_t(body,W,H,'#fff'))
