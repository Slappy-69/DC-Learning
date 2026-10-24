import json, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.rcParams.update({'font.family':'Inter','font.size':10,'axes.edgecolor':'#b9b5aa','axes.labelcolor':'#3a3936','xtick.color':'#5f5d57','ytick.color':'#5f5d57','axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none'})
INK='#1d1d1b'; Q='#6b6963'; LG='#e6e3dc'; BLUE='#2563c9'; RED='#c4512f'; AMB='#d49a2a'
M=json.load(open('market.json'))
def title(ax,t,s=None):
    ax.set_title(t,loc='left',fontsize=13,fontweight='bold',color=INK,pad=26 if s else 10)
    if s: ax.text(0,1.035,s,transform=ax.transAxes,fontsize=9.5,color=Q,va='bottom')
fig,ax=plt.subplots(figsize=(7.6,3.3))
cal=M['omipPtBase']['cal']; ys=[int(y) for y in cal]; pw=[cal[y] for y in cal]
gy=[2027,2028,2029,2030]; gp=[M['pvbGas']['yr'][str(y)] for y in gy]
ax.plot(ys,pw,color=BLUE,lw=2,marker='o',ms=4,label='Portuguese power, base load (OMIP), €/MWh')
ax.plot(gy,gp,color=RED,lw=2,marker='s',ms=4,label='Iberian gas, PVB (OMIP), €/MWh of gas')
ax.scatter([2026.8],[M['ptSpot']['index']],color=BLUE,marker='D',s=30,zorder=5); ax.text(2026.85,M['ptSpot']['index']+4,f"power spot {M['ptSpot']['index']:.0f}",fontsize=8,color=BLUE)
ax.scatter([2026.8],[M['pvbGas']['spot']],color=RED,marker='D',s=30,zorder=5); ax.text(2026.85,M['pvbGas']['spot']-12,f"gas spot {M['pvbGas']['spot']:.0f}",fontsize=8,color=RED)
ax.axhline(66,color=Q,lw=0.8,ls=':'); ax.text(2033.1,68,'tool default power 66',fontsize=8,color=Q)
ax.axhline(42,color=Q,lw=0.8,ls='--'); ax.text(2033.1,44,'tool default gas 42',fontsize=8,color=Q)
ax.axvspan(2028.95,2036.2,color='#eef3fc',zorder=0); ax.text(2029.05,150,'campus years modelled',fontsize=8,color=BLUE)
ax.set_xlim(2026.5,2036.5); ax.set_ylim(0,160); ax.yaxis.grid(True,color=LG); ax.set_axisbelow(True)
ax.legend(loc='upper right',fontsize=8,frameon=False)
title(ax,'The market expects the 2026 gas shock to pass by 2029','Forward prices settled 21–22 October 2026; diamonds are this week’s spot prices')
fig.savefig('fig/market.svg',bbox_inches='tight'); plt.close(fig)
print('ok')
