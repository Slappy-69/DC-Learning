# Small power-flow diagrams, one per strategy (inline SVG). Sources left, campus right, standby below.
import html
INK='#1d1d1b'; Q='#6b6963'; EDGE='#a9a59b'; BLUE='#2563c9'; BLUEF='#e8effb'; AMBF='#fbf1dc'; AMB='#b9832a'; GR='#5f7f9f'; GRF='#eef2f6'; NEWF='#f3efe8'
KIND={'grid':(GR,GRF),'ccgt':(BLUE,BLUEF),'rent':(AMB,AMBF),'new':('#8a6d4b',NEWF),'standby':(EDGE,'#f6f5f2'),'campus':(INK,'#ffffff'),'bess':('#3f8f5a','#e9f4ec')}
def box(x,y,w,h,kind,lines):
    c,f=KIND[kind]
    out=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{f}" stroke="{c}" stroke-width="{1.8 if kind in ("ccgt","campus") else 1.2}"/>'
    ty=y+18
    for i,l in enumerate(lines):
        out+=f'<text x="{x+10}" y="{ty}" font-size="{11.5 if i==0 else 10}" font-weight="{600 if i==0 else 400}" fill="{INK if i==0 else Q}">{html.escape(l)}</text>'; ty+=14
    return out
def diagram(sources, campus, standby=None, W=390):
    n=len(sources); bh=48; gap=10; top=8
    H=max(top+n*(bh+gap), 8+70)+ (66 if standby else 8)
    out=[f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, Arial, sans-serif" role="img">',
         '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8d897f"/></marker></defs>']
    sw=168; cx=230; cw=W-cx-4; ch=70
    srcH=n*(bh+gap)-gap; cy=top+max(0,(srcH-ch)/2)
    for i,(kind,lines) in enumerate(sources):
        y=top+i*(bh+gap); out.append(box(4,y,sw,bh,kind,lines))
        out.append(f'<path d="M{4+sw} {y+bh/2} H{(4+sw+cx)/2} V{cy+ch/2} H{cx-2}" fill="none" stroke="#8d897f" stroke-width="1.2" marker-end="url(#a)"/>')
    out.append(box(cx,cy,cw,ch,'campus',campus))
    if standby:
        sy=max(top+srcH, cy+ch)+18; kind,lines=standby
        out.append(box(cx,sy,cw,46,kind,lines))
        out.append(f'<path d="M{cx+cw/2} {sy} V{cy+ch+2}" stroke="#8d897f" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#a)"/>')
        out.append(f'<text x="{cx+cw/2+6}" y="{sy-5}" font-size="9" fill="{Q}">standby</text>')
    out.append('</svg>'); return ''.join(out)
D={
 'grid3': diagram([('grid',['REN grid','400 MW from 2030'])],['3 buildings','300 MW IT, from 2030','382 MW design load'],('standby',['HVO standby gensets','N+1 per building'])),
 'rec': diagram([('rent',['Rented gas gensets','186 MW, through 2029']),('grid',['REN grid','400 MW from 2030']),('ccgt',['Existing CCGT, 2 units','leased from 2031'])],['9 buildings','900 MW IT','1,145 MW design load'],('standby',['HVO gensets, 441 units','also cover a CCGT trip'])),
 'v1': diagram([('ccgt',['Existing CCGT, 2 units','leased from mid-2028']),('grid',['REN grid','400 MW from 2030'])],['9 buildings','900 MW IT','1,145 MW design load'],('standby',['HVO gensets, 441 units','N+1 per building'])),
 'sell': diagram([('new',['New gas engines','19 × 10 MW, sold in 2030']),('grid',['REN grid','400 MW from 2030']),('ccgt',['Existing CCGT, 2 units','leased from 2031'])],['9 buildings','900 MW IT','1,145 MW design load'],('standby',['HVO gensets, 441 units','N+1 per building'])),
 'keep': diagram([('rent',['HVO-diesel gensets','bought 2028, run 2029']),('grid',['REN grid','400 MW from 2030']),('ccgt',['Existing CCGT, 2 units','leased from 2031'])],['9 buildings','900 MW IT','1,145 MW design load'],('standby',['The same gensets','431 units kept as standby'])),
 'engines': diagram([('new',['New gas engines','119 × 10 MW, from 2028']),('grid',['REN grid','400 MW from 2030'])],['9 buildings','900 MW IT','engines are also the backup']),
 'enginesTop': diagram([('rent',['Rented gas gensets','186 MW, through 2029']),('new',['New gas engines','83 × 10 MW, top-up']),('grid',['REN grid','400 MW from 2030'])],['9 buildings','900 MW IT','1,145 MW design load'],('standby',['HVO gensets, 441 units','N+1 per building'])),
 'other': diagram([('new',['Turbines, CHP or fuel cells','new plant for the top-up']),('grid',['REN grid','400 MW from 2030'])],['9 buildings','900 MW IT','1,145 MW design load'],('standby',['HVO gensets','N+1 per building'])),
}
import json; json.dump(D,open('diagrams3.json','w')); print('ok', len(D))
