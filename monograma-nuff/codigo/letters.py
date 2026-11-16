from pen import *
import math
T=math.tan(math.radians(14))
def X(pts,ox,oy,s):
    return [(ox+s*(x+(1-y)*T), oy+s*y) for x,y in pts]
def sp(cx,cy,r,a0,turns,cw=True,shrink=0.45):
    return spiral(cx,cy,r,a0,turns,cw,shrink,n=16)
# all letters: upright local coords, cap height 1 (y: 0 top, 1 baseline)
def N(ox,oy,s,w=1.0,entry=True,exit_='hook'):
    o={}
    k=s/420*w
    if entry:
        o['N_in']=stroke(X(list(reversed(sp(-0.06,0.93,0.07,-90,1.15,cw=False)))+[(0.0,0.97),(0.03,0.6),(0.07,0.2),(0.1,0.0)],ox,oy,s),wmax=14*k,wmin=5,ball=(10,0),power=3)
    o['N_dn']=stroke(X([(0.1,0.0),(0.25,0.35),(0.43,0.75),(0.55,1.0)],ox,oy,s),wmax=44*k,wmin=5,taper=(0.1,0.12))
    up=[(0.55,1.0),(0.58,0.6),(0.62,0.2),(0.66,0.0)]
    if exit_=='hook': up+= [(0.7,-0.07),(0.8,-0.08),(0.86,-0.02),(0.83,0.04),(0.78,0.03)]
    o['N_up']=stroke(X(up,ox,oy,s),wmax=10*k,wmin=5,ball=(0,9 if exit_=='hook' else 0),power=3)
    return o
def U(ox,oy,s,w=1.0,entry=True):
    o={}; k=s/420*w
    pts=([(-0.08,0.1),(-0.05,0.0),(0.04,-0.02)] if entry else [(0.04,-0.02)])+[(0.07,0.15),(0.05,0.55),(0.07,0.85),(0.18,0.99),(0.33,0.98),(0.46,0.85),(0.52,0.5),(0.56,0.0)]
    o['U_l']=stroke(X(pts,ox,oy,s),wmax=44*k,wmin=5,taper=(0.05,0.0),ball=(8 if entry else 0,0))
    o['U_r']=stroke(X([(0.56,0.0),(0.54,0.45),(0.53,0.82),(0.57,0.98),(0.65,0.99),(0.71,0.93)],ox,oy,s),wmax=42*k,wmin=5,taper=(0.12,0.05),ball=(0,8))
    return o
def F(ox,oy,s,w=1.0,tag='F',top=True,desc=0.0,bar=0.5,barlen=(0.12,0.5),tail='curl'):
    o={}; k=s/420*w
    if top:
        o[tag+'_top']=stroke(X([(-0.12,0.08),(-0.02,-0.02),(0.2,0.02),(0.45,0.0),(0.66,-0.05),(0.74,0.0),(0.7,0.07),(0.64,0.06)],ox,oy,s),wmax=16*k,wmin=5,ball=(8,9),power=2)
    stem=[(0.36,0.0),(0.33,0.4),(0.29,0.8+desc*0.5),(0.22,1.0+desc)]
    if tail=='curl': stem+=[(0.1,1.06+desc),(0.0,1.02+desc),(-0.02,0.94+desc),(0.05,0.91+desc)]
    o[tag+'_stem']=stroke(X(stem,ox,oy,s),wmax=44*k,wmin=5,taper=(0.15,0.0),ball=(0,9 if tail=='curl' else 0))
    o[tag+'_bar']=stroke(X([(barlen[0],bar+0.02),(0.3,bar),(barlen[1],bar-0.03)],ox,oy,s),wmax=14*k,wmin=6)
    return o
