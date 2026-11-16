from letters import *
import sys
def build(ox=170,oy=150,s=330):
    P=lambda pts: X(pts,ox,oy,s); k=s/420
    S={}
    # N
    S['n_in']=stroke(P(list(reversed(sp(-0.13,0.9,0.11,-90,1.15,cw=False)))+[(-0.01,0.98),(0.03,0.6),(0.07,0.2),(0.1,0.0)]),wmax=14*k,wmin=4.5,ball=(9,0),power=3)
    S['n_dn']=stroke(P([(0.1,0.0),(0.25,0.35),(0.43,0.75),(0.55,1.0)]),wmax=44*k,wmin=4.5,taper=(0.1,0.12))
    # N's last hairline rises, turns over and becomes the U's left shade (cascade: U sits 0.3 lower)
    S['nu']=stroke(P([(0.55,1.0),(0.6,0.55),(0.65,0.15),(0.72,-0.02),(0.8,0.0),(0.82,0.12),(0.79,0.5),(0.78,0.95),(0.84,1.22),(0.98,1.31),(1.14,1.26),(1.24,1.08),(1.29,0.7),(1.33,0.3)]),wmax=44*k,wmin=4.5,power=1.8)
    # U right shade, short; exit hairline climbs into the FF top bar
    S['u_r']=stroke(P([(1.33,0.3),(1.31,0.75),(1.31,1.12),(1.36,1.28),(1.46,1.29),(1.55,1.18),(1.62,0.9),(1.68,0.5),(1.74,0.18),(1.82,0.03),(1.95,-0.03)]),wmax=42*k,wmin=4.5,power=1.8,taper=(0.1,0))
    # shared FF top bar: one wave, ends in a teardrop curl
    S['ff_top']=stroke(P([(1.95,-0.03),(2.15,0.02),(2.35,0.0),(2.55,-0.05),(2.66,-0.02),(2.64,0.06),(2.57,0.06)]),wmax=16*k,wmin=4.5,ball=(0,9),power=2)
    # F1: short stem, ends on the baseline of the U with a small turn
    S['f1']=stroke(P([(2.02,0.0),(1.99,0.5),(1.95,1.0),(1.9,1.28),(1.82,1.38),(1.74,1.34)]),wmax=44*k,wmin=4.5,taper=(0.15,0),ball=(0,8))
    # F2: longer stem, descender sweeps back left under the whole word and ends in a spiral under the N
    S['f2']=stroke(P([(2.4,-0.02),(2.37,0.5),(2.3,1.1),(2.2,1.48),(2.02,1.64),(1.7,1.7),(1.3,1.66),(0.9,1.6),(0.55,1.5),(0.3,1.36),(0.24,1.22),(0.33,1.14),(0.44,1.2),(0.4,1.29),(0.33,1.27)]),wmax=44*k,wmin=4.5,taper=(0.08,0),ball=(0,10),power=1.8)
    # shared crossbar: crosses both stems, slightly rising
    S['ff_bar']=stroke(P([(1.84,0.62),(2.05,0.6),(2.3,0.57),(2.52,0.52)]),wmax=12*k,wmin=6,ball=(0,7))
    cuts=[('nu','f2',7),('u_r','f2',7)]
    return compose(S,cuts)
if __name__=='__main__':
    m=build(); open('p1.svg','w').write(svg(f'<path d="{svgd(m)}"/>',1300,900,'#f2efe8','#141414'))
