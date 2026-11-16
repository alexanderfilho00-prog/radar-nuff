from lib2 import *
import sys
W,H=1200,1200; cx=600
h=150; w='regular'; s=h/819; sw=119*s*0.55
top=300; nb=top+h+70       # N baseline
ub=nb+h+16; fb=ub+h+16
sp=flared_stem(cx,top,fb-60,sw,fl=2.6,flen=sw*3.2,bot=False)
ff=FF(cx,fb,h,w); sp.nocut=ff
lay=[G('N',cx,nb,h,w),G('U',cx,ub,h,w),sp]+ff
body=compose(lay,16)
cy=(top+fb)/2; ry=(fb-top)/2+62; rx=ry*0.52
body+=ellipse_ring(cx,cy,rx,ry,13)
body+=text('MM',cx-rx-120,cy+18,44,'bold',track=8)+text('XXVI',cx+rx+135,cy+18,44,'bold',track=8)
body+=reg(cx+98,ub-8,12)
import sys; bg,fg='#000','#fff'; open('a.svg','w').write(svg(body,W,H,bg,fg)); open('a_t.svg','w').write(svg_t(body,W,H,'#000')); open('a_tw.svg','w').write(svg_t(body,W,H,'#fff'))
