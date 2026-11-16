from lib2 import *
W,H=1200,1200; cx,cy=600,600
R=430; t=11; Ri=300
body=ring(wavy(cx,cy,R),wavy(cx,cy,R-t))
body+=ring(wavy(cx,cy,Ri,a=0.05),wavy(cx,cy,Ri-t,a=0.05))
body+=ring(wavy(cx,cy,R+26,),wavy(cx,cy,R+21)) if False else ''
body+=arc_text('NUFF',cx,cy,352,60,'regular',track=70,top=True)
body+=arc_text('EST · MMXXVI',cx,cy,346,40,'regular',track=12,top=False)
def emblem(x,y,h):
    return compose(FF(x,y+h/2,h,'regular'),0)
body+=emblem(cx-372,cy,58)+emblem(cx+372,cy,58)
lay,m=chalice(cx,cy+2,0.9)
body+=compose(lay,12,idp='c')
import sys; bg,fg='#1b4228','#d8cf9e'; open('c.svg','w').write(svg(body,W,H,bg,fg)); open('c_t.svg','w').write(svg_t(body,W,H,'#000')); open('c_tw.svg','w').write(svg_t(body,W,H,'#fff'))
