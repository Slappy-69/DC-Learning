import json, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
plt.rcParams.update({'font.family':'Inter','font.size':10,'axes.edgecolor':'#b9b5aa','axes.labelcolor':'#3a3936','xtick.color':'#5f5d57','ytick.color':'#5f5d57','axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none'})
INK='#1d1d1b'; Q='#6b6963'; GREY='#c9c5bb'; LG='#e6e3dc'; BLUE='#2563c9'; RED='#c4512f'; GREEN='#3f8f5a'; AMB='#d49a2a'; GRIDC='#6f8fb3'; GAS='#c4512f'
S=json.load(open('out/strategies.json')); SER=json.load(open('out/series.json')); L=json.load(open('out/lead.json')); T=json.load(open('out/tornado.json'))
def save(fig,name): fig.savefig(f'fig/{name}.svg',bbox_inches='tight'); plt.close(fig)
def title(ax,t,s=None):
    ax.set_title(t,loc='left',fontsize=13,fontweight='bold',color=INK,pad=26 if s else 10)
    if s: ax.text(0,1.035,s,transform=ax.transAxes,fontsize=9.5,color=Q,va='bottom')

# 1. Buildings each power basis carries, at the tool's design day and at 45 °C
per34 = S['base']['rented']['design']/9; per45 = S['base:hot45']['rented']['design']/9
rows=[('Grid only (400 MW)',400,400),('Grid + both CCGT units',400+855,400+855*0.87),('Grid 600 MW + both CCGT units',600+855,600+855*0.87)]
fig,ax=plt.subplots(figsize=(7.6,3.3))
for i,(l,f34,f45) in enumerate(rows):
    y=(2-i)*1.35
    b34=int(f34//per34); b45=int(f45//per45)
    ax.barh(y+0.17,min(b34,9)*100,color=BLUE if i==1 else GREY,height=0.3)
    ax.barh(y-0.17,min(b45,9)*100,color=RED if i==1 else '#e3c9bf',height=0.3)
    ax.text(0,y+0.42,l,fontsize=10,color=INK,va='bottom')
    ax.text(min(b34,9)*100+14,y+0.17,f'{min(b34,9)} buildings at 34 °C',va='center',fontsize=9,color=INK)
    ax.text(min(b45,9)*100+14,y-0.17,f'{min(b45,9)} at 45 °C' + (', CCGT 13 % down' if i else ''),va='center',fontsize=9,color=RED if i==1 else Q)
ax.set_yticks([]); ax.set_xlim(0,1250); ax.set_ylim(-0.6,3.3); ax.set_xticks([0,300,600,900]); ax.set_xlabel('MW of IT')
ax.xaxis.grid(True,color=LG); ax.set_axisbelow(True); ax.spines['left'].set_visible(False)
title(ax,'A 45 °C day takes the ninth building away','Buildings each supply can carry at design conditions: the tool’s design day (34 °C, 127 MW a building) and 45 °C (135 MW)')
save(fig,'it-capacity')

# 2. Supply stack against design load, recommended plan
m=np.arange(120); yrs=2027+m/12
rented=np.where((m>=10)&(m<36),186,0); grid=np.where(m>=36,400,0); ccgt=np.where(m>=48,855,0)
d=np.array(SER['lead_months']['design'])[:120]
fig,ax=plt.subplots(figsize=(7.6,3.4))
ax.stackplot(yrs,rented,grid,ccgt,colors=[AMB,GRIDC,GAS],alpha=0.55,labels=['Rented gas gensets (on hire 2027–2029 in the tool)','Grid 400 MW (study assumption, from 2030)','Existing CCGT, 2 × 427.5 MW (lease from 2031)'],step='post')
ax.plot(yrs,d,color=INK,lw=2,label='Design load, 9 buildings (34 °C)')
ax.plot(yrs,d*per45/per34,color=INK,lw=1.2,ls='--',label='Design load at 45 °C')
ax.axhline(400+855*0.87,color=RED,lw=1,ls=':'); ax.text(2027.1,400+855*0.87+15,'grid + CCGT at 45 °C (13 % lower) = 1,144 MW',fontsize=8,color=RED)
ax.set_xlim(2027,2037); ax.set_ylim(0,1650); ax.set_ylabel('MW'); ax.yaxis.grid(True,color=LG); ax.set_axisbelow(True)
ax.legend(loc='upper left',fontsize=7.6,frameon=False,ncol=2,bbox_to_anchor=(0,1.0))
title(ax,'Supply stays above the design load, except on a 45 °C day from 2035','Recommended plan, month by month, from the tool’s design-load profile')
save(fig,'supply-stack')

# 3. Minimum stable load in 2029 (CCGT from mid-2028)
dd=np.array(SER['v1_2029']['demand']); ff=np.array(SER['v1_2029']['firm']); days=np.arange(365)
fig,ax=plt.subplots(figsize=(7.6,3.0))
ax.fill_between(days,dd[:,1],dd[:,2],color=BLUE,alpha=0.18,lw=0,label='campus demand, daily range')
ax.plot(days,dd[:,0],color=BLUE,lw=1.6,label='campus demand, daily average')
ax.fill_between(days,dd[:,0],ff[:,0],color=RED,alpha=0.10,lw=0,label='surplus: gas burnt, power wasted')
ax.plot(days,ff[:,0],color=RED,lw=2.2,label='CCGT output in the tool: one unit at its minimum, 192 MW')
ax.set_xlim(0,364); ax.set_ylim(0,260); ax.set_ylabel('MW')
ax.set_xticks([0,59,120,181,243,304]); ax.set_xticklabels(['Jan','Mar','May','Jul','Sep','Nov'])
ax.yaxis.grid(True,color=LG); ax.set_axisbelow(True); ax.legend(loc='upper left',bbox_to_anchor=(0,0.98),fontsize=8,frameon=False)
v1=S['base']['v1']; y29=[y for y in v1['years'] if y['demandGWh']>0][0]
c29=[p for p in y29['plants'] if p['tech']=='ccgt'][0]
title(ax,f"In 2029 the CCGT burns gas for {c29['curtGWh']:,.0f} GWh nobody uses",f"CCGT leased from mid-2028: {y29['demandGWh']:,.0f} GWh of demand in 2029, {c29['gwh']:,.0f} GWh generated at minimum load")
save(fig,'min-load-2029')

# 4. LCOE by strategy and scenario
keys=[('rented','Rent 2029, grid 2030, CCGT 2031 (rev 2)'),('enginesSell','Buy gas engines for 2029, sell on'),('v1','CCGT from mid-2028 (rev 1)'),('hvoKeep','Buy HVO gensets for 2029, keep as standby'),('enginesAll','New gas engines, prime and backup'),('enginesTop','New gas engines top-up'),('chp','CHP trigeneration'),('turbines','New gas turbines'),('fuelCells','Fuel cells top-up')]
sc=[('base','Tool prices',INK,'o'),('market','Portuguese forwards',BLUE,'s'),('crisis','Gas crisis persists',RED,'D'),('gridLate','Grid two years late',AMB,'^'),('grid600','Grid 600 MW',GREEN,'v')]
fig,ax=plt.subplots(figsize=(7.6,4.3))
for i,(k,l) in enumerate(keys):
    y=len(keys)-1-i
    vals=[S[s][k]['lcoe'] for s,_,_,_ in sc]
    ax.plot([min(vals),max(vals)],[y,y],color=LG,lw=5,solid_capstyle='round',zorder=1)
    for (s,lab,c,mk),v in zip(sc,vals): ax.scatter(v,y,color=c,marker=mk,s=34,zorder=3,label=lab if i==0 else None)
    ax.text(118,y,l,ha='right',va='center',fontsize=8.8,color=INK)
ax.set_yticks([]); ax.set_xlim(120,265); ax.spines['left'].set_visible(False); ax.xaxis.grid(True,color=LG); ax.set_axisbelow(True)
ax.set_xlabel('LCOE, €/MWh (nine buildings, 50 % PPA, HVO standby, 20 years at 7 % real)')
ax.legend(loc='lower right',fontsize=8,frameon=False)
title(ax,'The 2031 CCGT plans stay cheapest in every case but one','LCOE of nine-building strategies under five price and grid cases; with the grid late, the CCGT from 2028 wins by €1/MWh')
fig.subplots_adjust(left=0.36)
save(fig,'lcoe')

# 5. Carbon
ck=[('gridOnly3','Grid only\n3 buildings'),('rented','Recommended\n(with PPA)'),('v1','CCGT\nfrom 2028'),('enginesAll','Gas\nengines'),('fuelCells','Fuel\ncells'),('chp','CHP'),('turbines','Gas\nturbines')]
fig,ax=plt.subplots(figsize=(7.6,3.2))
xs=np.arange(len(ck))
loc=[(S['gridOnly3']['gridOnly'] if k=='gridOnly3' else S['base'][k])['loc'] for k,_ in ck]
mkt=[(S['gridOnly3']['gridOnly'] if k=='gridOnly3' else S['base'][k])['mkt'] for k,_ in ck]
ax.bar(xs-0.19,loc,0.38,color=INK,label='location-based'); ax.bar(xs+0.19,mkt,0.38,color=GREY,label='market-based (counts the PPA)')
for x,a,b in zip(xs,loc,mkt): ax.text(x-0.19,a+4,f'{a:.0f}',ha='center',fontsize=8); ax.text(x+0.19,b+4,f'{b:.0f}',ha='center',fontsize=8,color=Q)
ax.axhline(128,color=GREEN,lw=1.2,ls='--'); ax.text(6.45,133,'Portuguese grid 2025: 128 g (Ember, life-cycle)',fontsize=8,color=GREEN,ha='right')
ax.set_xticks(xs); ax.set_xticklabels([l for _,l in ck],fontsize=8.2); ax.set_ylim(0,310); ax.set_ylabel('g CO₂e per kWh'); ax.yaxis.grid(True,color=LG); ax.set_axisbelow(True)
ax.legend(loc='upper left',fontsize=8,frameon=False)
title(ax,'Any campus that leans on gas is about twice as dirty as the grid','Carbon over 20 years, tool prices')
save(fig,'carbon')

# 6. Capex, recommended
agg={}
for l in L['eco']['capexLines']: agg[l['item']]=agg.get(l['item'],0)+l['amount']
names={'HVO gensets (N+1)':'HVO standby gensets, 441 × 2.75 MW','Cooling capex delta vs air':'Extra cost of liquid cooling over air','Existing CCGT (Elecgas, lease from 2031) (prime)':'400 kV link and bays for the CCGT','Grid connection charge':'Grid connection charge, 400 MW','Resilience reserve battery (UPS)':'UPS reserve battery, 5 min','Substation (EHV, AIS)':'Campus substation','Bulk fuel storage':'HVO fuel store, 48 h','Solar PV rooftop':'Rooftop PV, 13.5 MWp'}
lines=sorted([(names.get(k,k),v/1e6) for k,v in agg.items() if v>1e5],key=lambda x:-x[1])+[('Contingency 10 %',L['eco']['contingency']/1e6)]
fig,ax=plt.subplots(figsize=(7.6,3.3))
left=0
for i,(n,v) in enumerate(lines):
    y=len(lines)-1-i
    ax.barh(y,v,left=left,color=BLUE if i==0 else GRIDC,alpha=1 if i==0 else 0.6,height=0.6)
    ax.text(left+v+8,y,f'{n}  €{v:,.0f} m',va='center',fontsize=8.6,color=INK)
    left+=v
ax.set_yticks([]); ax.set_xlim(0,1300); ax.spines['left'].set_visible(False); ax.set_xlabel('€ m, cumulative'); ax.xaxis.grid(True,color=LG); ax.set_axisbelow(True)
title(ax,f"Energy-plant capex €{L['eco']['capex']/1e6:,.0f} m; the standby gensets are more than half",'Recommended plan (the tool’s #1), energy plant only; the CCGT itself is leased, not bought')
save(fig,'capex')

# 7. Tornado (LCOE), recommended
rows=T['rows'][:10]
fig,ax=plt.subplots(figsize=(7.6,3.6))
base=T['base']['lcoe']
for i,r in enumerate(rows):
    y=len(rows)-1-i
    lo,hi=r['low']['lcoe'],r['high']['lcoe']
    ax.barh(y,lo-base,left=base,color=GREY,height=0.6); ax.barh(y,hi-base,left=base,color=INK,height=0.6)
    ax.text(min(lo,hi)-0.6,y,f"{r['label']}  ",ha='right',va='center',fontsize=8.6)
    ax.text(max(lo,hi)+0.6,y,f"{r['low']['text']} → {r['high']['text']}",va='center',fontsize=7.6,color=Q)
ax.axvline(base,color=Q,lw=0.8,ls='--')
ax.set_yticks([]); ax.spines['left'].set_visible(False); ax.set_xlim(108,168); ax.set_xlabel('LCOE, €/MWh (light: driver low; dark: driver high)')
ax.xaxis.grid(True,color=LG); ax.set_axisbelow(True)
title(ax,'Gas and carbon prices move the answer most',f"Tornado for the recommended plan, the tool’s 16 drivers at their indicative ranges; base €{base:.1f}/MWh (top 10 shown)")
save(fig,'tornado')
print('charts ok')
