from mono import *; from lib2 import *
import math, os
OUT='/home/user/radar-nuff/brasao-nuff/'
M,info=build(arm_scale=0.8,ucut=430); D=svgd(M)
x0,y0,x1,y1=M.bounds; MW,MH=x1-x0,y1-y0; STEM=info['L'][1]-info['L'][0]   # 119 units
def mono(cx,cy,h):
    k=h/MH; return f'<path d="{D}" transform="translate({cx},{cy}) scale({k},{-k}) translate({-(x0+x1)/2},{-(y0+y1)/2})" fill="currentColor"/>', k
def save(name,body,w,h,bg,fg):
    open(OUT+name+'.svg','w').write(svg_t(body,w,h,fg))
    open('prev_'+name+'.svg','w').write(svg(body,w,h,bg,fg))
INK,BONE,GREEN,GOLD='#16130f','#efe9dc','#1d3b2a','#d6c79a'
# 1 monogram
b,k=mono(300,360,560); save('nuff-monograma',b,600,720,BONE,INK)
# 2 oval pin — the oval passes 1 stem outside the arm tips; ring = 0.3 stem
h=440; k=h/MH; st=STEM*k
A=MW*k/2+1.0*st; B=h/2+1.0*st; r=1.22
rx=math.sqrt(A*A+B*B/(r*r)); ry=r*rx; t=0.3*st
W2,H2=int(2*rx+80),int(2*ry+80)
b,_=mono(W2/2,H2/2,h); b+=ellipse_ring(W2/2,H2/2,rx,ry,t)
save('nuff-pin-oval',b,W2,H2,BONE,INK)
# 3 crest
cx=cy=600; R=430; t=0.28*STEM*(560/MH)*0.9
b=ring(wavy(cx,cy,R),wavy(cx,cy,R-t))+ring(wavy(cx,cy,300,a=0.05),wavy(cx,cy,300-t,a=0.05))
b+=arc_text('NUFF',cx,cy,352,62,'regular',track=74,top=True)
b+=arc_text('EST · MMXXVI',cx,cy,348,38,'regular',track=14,top=False)
for s_ in (-1,1):
    d_=6; xx=cx+s_*372
    b+=f'<path d="M{xx} {cy-d_*2.2}L{xx+d_} {cy}L{xx} {cy+d_*2.2}L{xx-d_} {cy}Z" fill="currentColor"/>'
mb,k=mono(cx,cy+4,380); b+=mb
save('nuff-brasao',b,1200,1200,GREEN,GOLD)
# 4 horizontal lockup: monogram + wordmark, cap height of wordmark = 0.42 monogram height
mb,k=mono(160,200,260); cap=110
b=mb+text('NUFF',0,0,cap,'regular',track=cap*0.28)
tw=text_width('NUFF',cap,'regular',cap*0.28)
b=mb+text('NUFF',160+MW*k/2+60+tw/2,200+cap/2,cap,'regular',track=cap*0.28)
save('nuff-assinatura',b,int(160+MW*k/2+60+tw+60),400,BONE,INK)
