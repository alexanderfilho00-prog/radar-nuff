from letters import *
import sys
def build(ox=300,oy=170,s=420,hair=4.5,simple=False):
    P=lambda pts: X(pts,ox,oy,s); k=s/420; h=hair
    S={}
    RS=0.86                 # N right stem = F1 stem
    # N diagonal
    S['n_dn']=stroke(P([(0.0,0.0),(RS/3,1/3),(2*RS/3,2/3),(RS,1.0)]),wmax=42*k,wmin=h,taper=(0.08,0.06))
    S['nf']=stroke(P([(RS,0.0),(RS,0.5),(RS,1.0)]),wmax=40*k,wmin=h,taper=(0.1,0.02))
    # F2 stem -> tail under the whole mark -> loop -> N's entry hairline up to the apex (one continuous stroke)
    tail=[(1.24,0.0),(1.23,0.5),(1.19,0.96),(1.1,1.12),(0.9,1.2),(0.6,1.21),(0.32,1.15),(0.12,1.03),(0.03,0.82),(0.0,0.5),(-0.005,0.2),(0.0,0.0)]
    S['f2']=stroke(P(tail),wmax=40*k,wmin=h,taper=(0.06,0.0),power=1.8)
    # U: arm and bowl split so the interlace can alternate (arm over diagonal, diagonal over bowl)
    UL,UR,UT,UB=0.33,0.69,0.1,0.72
    S['u_arm']=stroke(P([(UL+0.02,UT-0.06),(UL+0.005,UT),(UL,0.3),(UL,0.5)]),wmax=40*k,wmin=h,taper=(0.3,0),power=1.6)
    S['u_bowl']=stroke(P([(UL,0.5),(UL+0.005,0.62),(UL+0.06,UB-0.02),(UL+0.18,UB+0.01),(UR-0.07,UB-0.04),(UR-0.01,0.52),(UR,0.25),(UR+0.01,UT)]),wmax=40*k,wmin=h,power=1.6)
    S['u_r']=stroke(P([(UR+0.01,UT),(UR,0.4),(UR,0.62),(UR+0.03,UB-0.01),(UR+0.08,UB+0.0)]),wmax=36*k,wmin=h,taper=(0.12,0.0),ball=(0,6))
    # shared FF top bar grows out of the top of the U's left arm
    S['top']=stroke(P([(UL+0.02,UT-0.06),(UL+0.1,-0.02),(0.62,-0.01),(RS,0.0),(1.1,0.02),(1.38,-0.03),(1.48,0.01),(1.45,0.08),(1.38,0.07)]),wmax=15*k,wmin=h,ball=(0,9),power=2)
    # shared crossbar, starts at F1
    S['bar']=stroke(P([(RS-0.02,0.5),(1.1,0.49),(1.34,0.46),(1.42,0.44)]),wmax=12*k,wmin=max(6,h),ball=(0,7))
    cuts=[('n_dn','u_arm',8),('u_bowl','n_dn',8),('n_dn','f2',0)]
    cuts=[c for c in cuts if c[2]>0]
    return compose(S,cuts)
if __name__=='__main__':
    m=build(); open('p2r.svg','w').write(svg(f'<path d="{svgd(m)}"/>',1100,900,'#f2efe8','#141414'))
