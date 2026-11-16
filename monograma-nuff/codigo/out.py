import p2r
from pen import svgd
full=p2r.build()
simp=p2r.build(hair=10)
def place(m,cx,cy,h,fill='#141414'):
    x0,y0,x1,y1=m.bounds; k=h/(y1-y0)
    return f'<path d="{svgd(m)}" fill="{fill}" transform="translate({cx},{cy}) scale({k}) translate({-(x0+x1)/2},{-(y0+y1)/2})"/>'
b=place(full,560,520,760)
x=1180
for hpx,m in [(120,full),(64,full),(32,full),(64,simp),(32,simp),(20,simp)]:
    b+=place(m,x,180+[0,170,280,420,560,660][[120,64,32,64,32,20].index(hpx)+(3 if m is simp and hpx in(64,32) else 0) if False else 0],hpx) if False else ''
rows=[(120,full,190),(64,full,370),(32,full,480),(64,simp,640),(32,simp,750),(20,simp,820)]
for hpx,m,y in rows: b+=place(m,1260,y,hpx)
b+='<text x="1260" y="560" font-family="Helvetica,Arial" font-size="18" fill="#8a857c" text-anchor="middle">versão reduzida (finos reforçados)</text>'
open('final.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1000" width="1500" height="1000"><rect width="100%" height="100%" fill="#efece6"/>{b}</svg>')
