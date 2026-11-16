from letters import *
def build(ox=170,oy=220,s=380):
    P=lambda pts: X(pts,ox,oy,s); k=s/420
    S={}
    # roof: begins as a curl left of the N, runs over N and U, becomes the FF top bar, ends in a curl
    S['roof']=stroke(P([(-0.2,0.12),(-0.24,0.04),(-0.16,-0.02),(-0.05,0.02),(0.06,0.0),(0.4,-0.06),(0.8,-0.08),(1.2,-0.07),(1.5,-0.03),(1.85,-0.05),(2.12,-0.1),(2.2,-0.05),(2.16,0.02),(2.09,0.01)]),wmax=15*k,wmin=4.5,ball=(8,9),power=2)
    # N: hairline up from the baseline, shade diagonal, hairline up into the U
    S['n_in']=stroke(P([(-0.06,1.0),(-0.02,0.6),(0.02,0.25),(0.06,0.0)]),wmax=12*k,wmin=4.5,ball=(8,0),power=3)
    S['n_dn']=stroke(P([(0.06,0.0),(0.25,0.36),(0.45,0.72),(0.6,1.0)]),wmax=42*k,wmin=4.5,taper=(0.1,0.1))
    S['n_up']=stroke(P([(0.6,1.0),(0.63,0.6),(0.67,0.2),(0.71,0.03),(0.78,0.0),(0.82,0.08)]),wmax=12*k,wmin=4.5,power=3)
    # U: shade left arm from the N's turn, bowl, hairline up, shade right arm
    S['u_l']=stroke(P([(0.82,0.08),(0.81,0.4),(0.8,0.8),(0.86,0.97),(1.0,1.01),(1.13,0.93),(1.19,0.6),(1.22,0.2),(1.24,0.02)]),wmax=42*k,wmin=4.5,taper=(0.08,0),power=1.8)
    # U's right shade ends low and turns: its exit climbs and becomes the shared crossbar of both Fs
    S['u_r']=stroke(P([(1.24,0.02),(1.22,0.45),(1.22,0.8),(1.26,0.96),(1.34,0.97),(1.4,0.85),(1.45,0.62),(1.55,0.52),(1.8,0.5),(2.0,0.47),(2.08,0.44)]),wmax=40*k,wmin=4.5,taper=(0.1,0),ball=(0,7),power=1.8)
    # F stems hang from the roof; F2 goes deeper and turns left into a curl under itself (distinguishes the pair)
    S['f1']=stroke(P([(1.62,-0.04),(1.61,0.5),(1.58,0.92),(1.52,1.04),(1.45,1.05)]),wmax=42*k,wmin=4.5,taper=(0.12,0.0),ball=(0,7))
    S['f2']=stroke(P([(1.92,-0.06),(1.91,0.5),(1.86,1.0),(1.76,1.24),(1.6,1.32),(1.47,1.27),(1.47,1.17),(1.57,1.16),(1.58,1.23)]),wmax=42*k,wmin=4.5,taper=(0.1,0.0),ball=(0,9),power=1.8)
    cuts=[('n_dn','roof',0),('f1','u_r',0)]
    return compose(S,[])
if __name__=='__main__':
    m=build(); open('p3.svg','w').write(svg(f'<path d="{svgd(m)}"/>',1200,800,'#f2efe8','#141414'))
