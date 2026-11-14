#!/usr/bin/env python3
"""Independent hand calculation of three options of the T1 run (audit, 2026-11-14).

Built from the inputs and the default records only (out/t1_three_options.json 'ctx' block: inputs, default records,
hourly weather/price/carbon profiles in out/t1_profiles.json, hourly demand in out/t1_demand3.json).
It does NOT call the engine. It re-does: sizing, capex by item, an hour-by-hour energy balance, the yearly ledger,
LCOE, NPV, carbon, and the score; then prints each figure beside the engine's and the difference.
Run:  python3 scripts/handcalc.py            (from /home/claude/fable-audit)
"""
import json, math, sys
J = json.load(open('out/t1_three_options.json')); C = J['ctx']; O = J['options']
P = json.load(open('out/t1_profiles.json')); DM = json.load(open('out/t1_demand3.json'))
T = C['tech']; EC = C['economics']; RQ = C['requirements']; LD = C['load']
N = EC['periodYears']; r = EC['wacc']; cont = EC['contingency']
FX = 0.8377  # pounds per euro (display)
H = 8760
month_of_hour = [min(11, h // 730) for h in range(H)]
GAS_PATH = [(2026, 45.8), (2027, 36.6), (2030, 33.1), (2035, 35.3), (2040, 37.4)]
CARB_PATH = [(2026, 88.3), (2030, 97.5), (2035, 197.5), (2040, 297.5)]
def interp(path, y):
    if y <= path[0][0]: return path[0][1]
    for (y0, v0), (y1, v1) in zip(path, path[1:]):
        if y <= y1: return v0 + (v1 - v0) * (y - y0) / (y1 - y0)
    return path[-1][1]
gas_f = lambda cal: interp(GAS_PATH, cal) / 45.8
carb_f = lambda cal: interp(CARB_PATH, cal) / 88.3
BASE = C['baseYear']; DECARB2050 = 0.1
def decarb(cal):
    if cal <= BASE: return 1.0
    if cal >= 2050: return DECARB2050
    return 1 + (DECARB2050 - 1) * (cal - BASE) / (2050 - BASE)
GAS = C['gasPrice']; CO2 = C['carbonPrice']; ADDER = C['priceAdder']; EF_GAS = C['FUEL']['efGas']; EF_HVO = C['FUEL']['efHvo']; HVO = C['FUEL']['hvoPrice']
PPA_PRICE = C['PPA']['strike']['hybrid'] + C['PPA']['shapingAdder']
GRID = C['gridCap']
rows = []
def cmp(label, mine, eng, unit='', tol=0.01):
    d = (mine - eng) / eng * 100 if eng else (0 if abs(mine) < 1e-9 else float('inf'))
    mark = '' if abs(d) <= tol * 100 else '  <-- DIFFERS'
    print(f'    {label:<58} mine {mine:>16,.3f}  engine {eng:>16,.3f} {unit:<8} {d:+7.2f} %{mark}')
    rows.append((label, mine, eng, d))

def sizing(it_mw, n_build):
    pue_max = LD['pueMax']; design = it_mw * pue_max
    per_b = design / n_build
    g = T['backupHvo']['p']; n = math.ceil(per_b / g['unitMW'] - 1e-9); red = math.ceil(n / RQ['blockSize'])
    units = (n + red) * n_build
    fuel_m3 = design * 1000 * RQ['autonomyH'] * T['fuelStorage']['p']['dieselLPerKWh'] / 1000
    ups_mwh = it_mw * RQ['upsMin'] / 60
    ws = it_mw * 1000 / LD['densityKWm2']; roof = ws * LD['grossUp'] / LD['storeys']
    pv = roof * T['solarRoof']['p']['usableFraction'] / T['solarRoof']['p']['m2PerKWp'] / 1000
    return dict(design=design, units=units, gen_mw=units * g['unitMW'], n_units=n * n_build, fuel_m3=fuel_m3, ups_mwh=ups_mwh, pv=pv, roof=roof)

def dispatch(D, y, *, pv_mwp, pv_from, ppa, engines, grid_on, mc_by_year=None, smr=None):
    """One model year, hour by hour. engines: list of (mw, from_month, unit_mw, msl, eff, mc). Returns energies."""
    sol = P['solar']; wind = P['wind']; price = P['price']; carbon = P['carbon']
    tot = sum(D)
    if ppa:
        shp = [0.5 * sol[h] / C['stats']['solarYield'] * H + 0.5 * wind[h] / C['stats']['windCF'] for h in range(H)]
        ssum = sum(shp)
    out = dict(demand=tot, pv=0.0, ppa=0.0, firm=0.0, grid=0.0, unmet=0.0, grid_cost=0.0, ppa_net=0.0, grid_c=0.0, ppa_c=0.0, fuel=0.0, peak=0.0, hours=0, curt=0.0, smr=0.0, ppa_contract=tot if ppa else 0.0)
    for h in range(H):
        m = y * 12 + month_of_hour[h]
        cap = GRID[min(m, len(GRID) - 1)] if grid_on else 0.0
        d = D[h]
        pvh = pv_mwp * sol[h] if m >= pv_from else 0.0
        use = min(pvh, d); out['pv'] += use; out['curt'] += pvh - use
        R = d - use; capr = cap
        if ppa and R > 0:
            v = shp[h] / ssum * tot
            u = min(v, R, cap); out['ppa'] += u; R -= u; capr -= u
            out['ppa_net'] += u * ADDER; out['ppa_c'] += u * carbon[h] / 1000
        gp = price[h] + ADDER
        ran = False
        for (mw, frm, unit, msl, eff, mc, kind) in engines:
            if m < frm or R <= 1e-12: continue
            mcy = mc_by_year[y] if (mc_by_year and kind == 'gas') else mc
            if not grid_on: Pw = R
            elif mcy < gp: Pw = R
            else: Pw = max(0.0, R - capr)
            if Pw <= 1e-12: continue
            Pw = min(Pw, mw)
            if Pw < msl * unit: Pw = min(msl * unit, R)  # one unit at its minimum (simplified)
            out['firm'] += Pw; R -= Pw; ran = True
            if kind == 'gas': out['fuel'] += Pw / eff
            else: out['smr'] += Pw
        if ran: out['hours'] += 1
        g = min(R, capr) if grid_on else 0.0
        out['grid'] += g; out['grid_cost'] += g * gp; out['grid_c'] += g * carbon[h] / 1000
        out['peak'] = max(out['peak'], g + (out and 0))
        out['unmet'] += R - g
    return out

def ledger(name, *, capex_items, years, fom, extra=None, it_share=None, gen_units=0, starts=None):
    """capex_items: (item, year, amount, life). years: list of dispatch dicts (last repeats). fom(y) -> EUR."""
    L = [dict(capex=0.0, repl=0.0, resid=0.0, opex=0.0, mwh=0.0, s1=0.0, s2=0.0, parts={}) for _ in range(N + 1)]
    for item, y, amt, life in capex_items:
        L[y]['capex'] += amt * (1 + cont)
        last = y
        yy = y + life
        while yy < N:
            L[yy]['repl'] += amt * (1 + cont); last = yy; yy += life
        L[N]['resid'] -= amt * (1 + cont) * max(0.0, 1 - (N - last) / life)
    for y in range(N):
        d = years[min(y, len(years) - 1)]; cal = BASE + y
        p = {}
        p['fom'] = fom(y)
        p['vom'] = (d['firm'] - d['smr']) * T['gasRecip']['p']['vomPerMWh'] + d['smr'] * T['smr']['p']['vomPerMWh']
        p['fuel'] = d['fuel'] * GAS * gas_f(cal) + d['smr'] * T['smr']['p']['fuelPerMWhE']
        p['grid'] = d['grid_cost'] + d['ppa_net']          # electricity escalation is 0 % (default)
        p['ppa'] = d['ppa'] * PPA_PRICE
        s1 = d['fuel'] * EF_GAS
        sh = it_share(y) if it_share else 0.0
        if gen_units and sh > 0:
            th = gen_units * T['backupHvo']['p']['unitMW'] * RQ['testRunHours'] * RQ['testRunLoad'] / T['backupHvo']['p']['eff']
            p['test'] = sh * th * HVO; s1 += sh * th * EF_HVO
        p['carbon'] = s1 * CO2 * carb_f(cal)
        L[y]['parts'] = p; L[y]['opex'] = sum(p.values())
        L[y]['mwh'] = d['demand'] - d['unmet']; L[y]['s1'] = s1; L[y]['s2'] = (d['grid_c'] + d['ppa_c']) * decarb(cal)
        L[y]['ppa_contract'] = d['ppa_contract']; L[y]['imported'] = d['grid'] + d['ppa']
    pv_capex = sum((L[y]['capex'] + L[y]['repl'] + L[y]['resid']) / (1 + r) ** y for y in range(N + 1))
    pv_opex = sum(L[y]['opex'] / (1 + r) ** (y + 1) for y in range(N))
    pv_e = sum(L[y]['mwh'] / (1 + r) ** (y + 1) for y in range(N))
    tot_e = sum(L[y]['mwh'] for y in range(N))
    s1 = sum(L[y]['s1'] for y in range(N)); s2 = sum(L[y]['s2'] for y in range(N))
    s2m = sum(L[y]['s2'] * max(0.0, 1 - L[y]['ppa_contract'] / L[y]['imported']) if L[y].get('imported', 0) > 0 else 0.0 for y in range(N))
    return dict(L=L, npv=pv_capex + pv_opex, pv_capex=pv_capex, pv_opex=pv_opex, lcoe=(pv_capex + pv_opex) / pv_e, capex=sum(a for _, _, a, _ in capex_items) * (1 + cont),
                loc=(s1 + s2) / tot_e * 1000, mkt=(s1 + s2m) / tot_e * 1000, s1=s1, s2=s2)

def it_share_fn(itinst, it_mw):
    return lambda y: min(1.0, itinst[min(y * 12 + 6, len(itinst) - 1)] / it_mw)

def score(lcoe, carbon_g, avg_late, deliv):
    R = C['scoring']['ranges']; w = C['scoring']['weights']
    clamp = lambda x: max(0.0, min(100.0, x))
    a = dict(cost=100 * (R['cost']['hi'] - lcoe) / (R['cost']['hi'] - R['cost']['lo']), carbon=100 * (R['carbon']['hi'] - carbon_g) / (R['carbon']['hi'] - R['carbon']['lo']),
             ttp=100 * (RQ['lateAllowanceM'] - avg_late) / RQ['lateAllowanceM'], deliverability=deliv)
    return sum(w[k] * clamp(a[k]) for k in a), a

def yr(m): return m // 12
g = T['backupHvo']['p']; e = T['gasRecip']['p']; sub = T['substation']['p']
MC_BASE = GAS / e['eff'] + e['vomPerMWh'] + CO2 * EF_GAS / e['eff']

def common_capex(s, starts, it_each, with_gens=True, with_pv=True, cable=True):
    items = []
    if cable: items.append(('Grid cable route', 0, sub['cablePerKm_hv'] * 0.01, 40))
    items.append(('Substation 120 MW HV AIS', 0, 120 * sub['subCapexPerMW_hv'], 40))
    if with_pv: items.append(('Rooftop PV', yr(T['solarRoof']['p']['procM'] + T['solarRoof']['p']['buildM']), s['pv'] * 1000 * T['solarRoof']['p']['capexPerKW'], T['solarRoof']['p']['life']))
    nb = len(starts)
    for m in starts:
        items.append(('UPS reserve battery', yr(m), s['ups_mwh'] / nb * 1000 * T['upsReserve']['p']['capexPerKWh'], T['upsReserve']['p']['life']))
        if with_gens:
            items.append(('HVO gensets', yr(m), s['gen_mw'] / nb * 1000 * g['capexPerKW'], g['life']))
            items.append(('Fuel store', yr(m), s['fuel_m3'] / nb * T['fuelStorage']['p']['capexPerM3'], 30))
    return items

def show(title, o, res, s, extra_rows=()):
    print(f'\n=== {title}: {o["name"]} (rank {o["rank"]}, {o["id"]}) ===')
    z = o['sizing']
    cmp('Design load MW', s['design'], z['designMW'])
    if z['backup'].get('units'): cmp('Standby gensets, units', s['units'], z['backup']['units']); cmp('Standby gensets MW', s['gen_mw'], z['backup']['mw']); cmp('Fuel store m3', s['fuel_m3'], z['backup']['fuelM3'])
    cmp('UPS reserve MWh', s['ups_mwh'], z['reserve']['mwh'])
    if z['solarMWp']: cmp('Rooftop PV MWp', s['pv'], z['solarMWp'])
    cmp('Capex incl. contingency, EUR m', res['capex'] / 1e6, o['eco']['capex'] / 1e6)
    cmp('  the same in pounds, GBP m', res['capex'] * FX / 1e6, o['eco']['capex'] * FX / 1e6)
    cmp('PV of capex (with replacement, residual), EUR m', res['pv_capex'] / 1e6, o['eco']['pvCapex'] / 1e6)
    cmp('PV of opex, EUR m', res['pv_opex'] / 1e6, o['eco']['pvOpex'] / 1e6)
    cmp('NPV of cost, EUR m', res['npv'] / 1e6, o['eco']['npvCost'] / 1e6)
    cmp('LCOE EUR/MWh', res['lcoe'], o['eco']['lcoe'])
    cmp('  the same in pounds, GBP/MWh', res['lcoe'] * FX, o['eco']['lcoe'] * FX)
    cmp('Carbon, location based g/kWh', res['loc'], o['carbon']['locationG'])
    cmp('Carbon, market based g/kWh', res['mkt'], o['carbon']['marketG'])
    cmp('Residual value at year 20, EUR m', res['L'][N]['resid'] / 1e6, o['eco']['ledger'][N]['residual'] / 1e6)
    yS = N - 1
    cmp('Opex in the last year, EUR m', res['L'][yS]['opex'] / 1e6, o['eco']['ledger'][yS]['opex'] / 1e6)
    sc, a = score(res['lcoe'], res['loc'], z['energise']['avgLate'], o['deliv']['score'])
    cmp('Weighted score (shown)', sc, o['score'])
    for k in a: cmp(f'  axis score {k}', max(0, min(100, a[k])), o['axisScores'][k])
    for lab, m_, e_ in extra_rows: cmp(lab, m_, e_)

# ---------------------------------------------------------------- 1. the leader
o = O['leader']; s = sizing(100, 4)
starts = [27, 30, 42, 54]   # building 1 waits for its standby plant: 6 permit + 15 buy + 6 install = month 27
short = s['design'] - 120; n_eng = math.ceil(short / e['unitMW']); n_eng += math.ceil(n_eng / RQ['blockSize'])
eng_from = RQ['permitAllowanceM'] + e['procM'] + e['buildM']
items = common_capex(s, starts, 25) + [('Gas engines 4 x 10 MW', yr(eng_from), n_eng * e['unitMW'] * 1000 * e['capexPerKW'], e['life'])]
D = DM['leader']['years']; ny = len(D)
engines = [(n_eng * e['unitMW'], eng_from, e['unitMW'], e['msl'], e['eff'], MC_BASE, 'gas')]
ys = [dispatch(D[str(y)], y, pv_mwp=s['pv'], pv_from=10, ppa=True, engines=engines, grid_on=True) for y in range(ny)]
share = it_share_fn(DM['leader']['itInst'], 100)
def fom_leader(y):
    f = s['pv'] * 1000 * T['solarRoof']['p']['fomPerKW']
    f += share(y) * (s['ups_mwh'] * 1000 * T['upsReserve']['p']['capexPerKWh'] * T['upsReserve']['p']['fomPct'] + s['gen_mw'] * 1000 * g['fomPerKW'])
    if y >= yr(eng_from): f += n_eng * e['unitMW'] * 1000 * e['fomPerKW']
    return f
res = ledger('leader', capex_items=items, years=ys, fom=fom_leader, it_share=share, gen_units=s['units'])
E7 = DM['leader']['engineYears'][-1]; m7 = ys[-1]
show('LEADER', o, res, s, [('Gas engines, units', n_eng, o['sizing']['bridge']['units']), ('Engines ready, month', eng_from, o['sizing']['bridge']['availMonth']),
     ('Steady year: demand MWh', m7['demand'], E7['demand']), ('Steady year: check 100 MW x 0.8 x 8760 x PUE 1.3', 100 * 0.8 * 8760 * 1.3, E7['demand']),
     ('Steady year: PPA delivered MWh', m7['ppa'], E7['ppa']), ('Steady year: engine output MWh', m7['firm'], E7['firm']), ('Steady year: grid import MWh', m7['grid'], E7['grid']),
     ('Steady year: engine hours', m7['hours'], E7['hours'][1]), ('Steady year: gas burned MWh(th)', m7['fuel'], E7['fuel']), ('Steady year: unmet MWh', m7['unmet'], E7['unmet'])])
print('    capex by item (EUR m, before contingency):'); [print(f'      year {y}: {a/1e6:8.3f}  {i}') for i, y, a, _ in items]
print(f'    engine running cost used for dispatch: gas {GAS}/0.45 + O&M {e["vomPerMWh"]} + carbon {CO2} x {EF_GAS}/0.45 = {MC_BASE:.1f} EUR/MWh (start-year prices)')
# What if the engines were dispatched on each year's own gas and carbon price (the prices the ledger bills)?
mcy = [GAS * gas_f(BASE + y) / e['eff'] + e['vomPerMWh'] + CO2 * carb_f(BASE + y) * EF_GAS / e['eff'] for y in range(N)]
ys2 = [dispatch(D[str(min(y, ny - 1))], min(y, ny - 1), pv_mwp=s['pv'], pv_from=10, ppa=True, engines=engines, grid_on=True, mc_by_year={min(y, ny - 1): mcy[y]}) for y in range(N)]
res2 = ledger('leader2', capex_items=items, years=ys2, fom=fom_leader, it_share=share, gen_units=s['units'])
print(f'    WHAT IF engines run on each year\'s own prices: running cost {mcy[0]:.0f} (2027) -> {mcy[6]:.0f} (2033) -> {mcy[13]:.0f} EUR/MWh (2040 on); average grid price {C["stats"]["priceMean"] + ADDER:.1f}')
print(f'      LCOE {res2["lcoe"]:.2f} against {res["lcoe"]:.2f} EUR/MWh ({(res2["lcoe"]/res["lcoe"]-1)*100:+.2f} %); carbon {res2["loc"]:.1f} against {res["loc"]:.1f} g/kWh; engine hours in 2040: {ys2[13]["hours"]} against {ys[-1]["hours"]}')
LEAD2 = res2

# ---------------------------------------------------------------- 2. islanded gas engines
o = O['island']; s = sizing(100, 4)
n_eng = math.ceil(s['design'] / e['unitMW']); n_eng += math.ceil(n_eng / RQ['blockSize'])
consent = max(RQ['permitAllowanceM'], RQ['eiaAllowanceM'] if n_eng * e['unitMW'] / e['eff'] >= RQ['eiaMWth'] else 0, RQ['dcoAllowanceM'] if n_eng * e['unitMW'] > RQ['dcoMWe'] else 0)
eng_from = consent + e['procM'] + e['buildM']
starts = [eng_from] * 4
items = [('Substation 120 MW HV AIS', 0, 120 * sub['subCapexPerMW_hv'], 40), ('Rooftop PV', 0, s['pv'] * 1000 * T['solarRoof']['p']['capexPerKW'], T['solarRoof']['p']['life'])]
items += [('UPS reserve battery', yr(eng_from), s['ups_mwh'] * 1000 * T['upsReserve']['p']['capexPerKWh'], T['upsReserve']['p']['life']), (f'Gas engines {n_eng} x 10 MW', yr(eng_from), n_eng * e['unitMW'] * 1000 * e['capexPerKW'], e['life'])]
D = DM['island']['years']; ny = len(D)
engines = [(n_eng * e['unitMW'], eng_from, e['unitMW'], e['msl'], e['eff'], MC_BASE, 'gas')]
ys = [dispatch(D[str(y)], y, pv_mwp=s['pv'], pv_from=10, ppa=False, engines=engines, grid_on=False) for y in range(ny)]
share = it_share_fn(DM['island']['itInst'], 100)
def fom_isl(y):
    f = s['pv'] * 1000 * T['solarRoof']['p']['fomPerKW'] + share(y) * s['ups_mwh'] * 1000 * T['upsReserve']['p']['capexPerKWh'] * T['upsReserve']['p']['fomPct']
    if y >= yr(eng_from): f += n_eng * e['unitMW'] * 1000 * e['fomPerKW']
    return f
res = ledger('island', capex_items=items, years=ys, fom=fom_isl, it_share=share, gen_units=0)
E7 = DM['island']['engineYears'][-1]; m7 = ys[-1]
show('ISLANDED', o, res, s, [('Gas engines, units', n_eng, o['sizing']['bridge']['units']), ('Consent months (IED 6, EIA 18, DCO 30: the longest)', consent, o['sizing']['bridge']['consent']['months']), ('Engines ready, month', eng_from, o['sizing']['bridge']['availMonth']),
     ('Steady year: engine output MWh', m7['firm'], E7['firm']), ('Steady year: gas burned MWh(th)', m7['fuel'], E7['fuel']), ('Steady year: unmet MWh', m7['unmet'], E7['unmet']),
     ('Heat in running plant, MW(th)', n_eng * e['unitMW'] / e['eff'], o['sizing']['consentFacts']['runningMWth'])])
print('    capex by item (EUR m, before contingency):'); [print(f'      year {y}: {a/1e6:8.3f}  {i}') for i, y, a, _ in items]
print(f'    gas use at full load: {m7["fuel"]/8760:.0f} MW(th) average; heat rate {3600/e["eff"]:.0f} kJ/kWh (45 % efficiency, LHV basis assumed); carbon {EF_GAS/e["eff"]*1000:.0f} g/kWh at the engine')

# ---------------------------------------------------------------- 3. the "step down" SMR card
o = O['smr']; s = sizing(75, 3); s['pv'] = 0.0
starts = [27, 30, 42]; sm = T['smr']['p']
smr_from = sm['planM'] + sm['procM'] + sm['buildM']
items = common_capex(s, starts, 25, with_pv=False) + [('SMR 1 x 80 MW', yr(smr_from), sm['unitMW'] * 1000 * sm['capexPerKW'], sm['life'])]
D = DM['smr']['years']; ny = len(D)
engines = [(sm['unitMW'], smr_from, sm['unitMW'], sm['msl'], 1.0, sm['fuelPerMWhE'] + sm['vomPerMWh'], 'smr')]
ys = [dispatch(D[str(y)], y, pv_mwp=0, pv_from=999, ppa=False, engines=engines, grid_on=True) for y in range(ny)]
share = it_share_fn(DM['smr']['itInst'], 75)
def fom_smr(y):
    f = share(y) * (s['ups_mwh'] * 1000 * T['upsReserve']['p']['capexPerKWh'] * T['upsReserve']['p']['fomPct'] + s['gen_mw'] * 1000 * g['fomPerKW'])
    if y >= yr(smr_from): f += sm['unitMW'] * 1000 * sm['fomPerKW']
    return f
res = ledger('smr', capex_items=items, years=ys, fom=fom_smr, it_share=share, gen_units=s['units'])
E7 = DM['smr']['engineYears'][-1]; m7 = ys[-1]
show('STEP DOWN, SMR', o, res, s, [('SMR ready, month', smr_from, o['sizing']['prime']['availMonth']), ('Last year: SMR output MWh', m7['firm'], E7['firm']), ('Last year: grid import MWh', m7['grid'], E7['grid'])])
print('    capex by item (EUR m, before contingency):'); [print(f'      year {y}: {a/1e6:8.3f}  {i}') for i, y, a, _ in items]
smr_gross = 640e6 * 1.1; back = smr_gross * (1 - 10 / 60)
print(f'    SMR: bought year 10 for EUR {smr_gross/1e6:.0f} m with contingency; EUR {back/1e6:.0f} m ({back/smr_gross*100:.0f} %) is credited back at year 20 as value left (life 60 years).')
print(f'    SMR load factor in the model: {m7["firm"]/(80*8760)*100:.1f} % (no refuelling or outage)')
# the same option with no credit for the value left in the SMR
items_nr = [(i, y, a, (1e9 if i.startswith('SMR') else l)) for i, y, a, l in items]
# (life 1e9 would keep all the value; instead remove the credit by hand)
res_nr = dict(res); pv_e = (res['npv']) / res['lcoe']
print(f'    WHAT IF no value is credited for the SMR at year 20: LCOE {(res["npv"] + back/(1+r)**N)/pv_e:.1f} EUR/MWh against {res["lcoe"]:.1f}; the leader is {O["leader"]["eco"]["lcoe"]:.1f}')
print(f'    Grid alone can carry the three buildings (113 MW design load against 120 MW of grid): the SMR is not needed to power them.')
print(f'    SMR ready in month {smr_from}; the timeline has {C["settings"]["timelineMonths"]} months (0 to {C["settings"]["timelineMonths"]-1}). Grid 120 + SMR 80 = 200 MW >= 150 MW: building 4 could start in month {smr_from}.')

json.dump(rows, open('out/handcalc_rows.json', 'w'))
bad = [r_ for r_ in rows if abs(r_[3]) > 1]
print(f'\n{len(rows)} figures compared; {len(bad)} differ by more than 1 %:'); [print('   ', b[0], f'{b[3]:+.2f} %') for b in bad]
