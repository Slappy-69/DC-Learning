# Pego data centre campus: feasibility study, revision 3 (HTML -> PDF with Chromium).
import json, asyncio, pathlib, html
from playwright.async_api import async_playwright
HERE = pathlib.Path(__file__).resolve().parent
J = lambda p: json.load(open(HERE / p))
S = J('out/strategies.json'); L = J('out/lead.json'); T = J('out/tornado.json'); P = J('out/plans.json'); M = J('market.json')
RB = J('out/base-full.json'); RS = J('out/base-repDays.json'); RT = J('out/base-full-tool.json'); RTN = J('out/base-full-tool-nottp.json')
D3 = J('diagrams3.json')
CSS = open(HERE / 'css2.css').read() + """
img.shot.half { width: 49%; display:inline-block; vertical-align: top; }
.two { display:grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-items:start; }
.two img { width:100%; }
.small { font-size: 9pt; }
.tight p { margin-bottom: 2.5mm; }
.chg td:first-child { width: 22%; font-family:'Inter',Arial,sans-serif; font-weight:600; }
.chg td:nth-child(3) { width: 34%; }
.num { text-align:right; white-space:nowrap; }
.na { color:#9a978f; }
.star { color: var(--red); font-weight:600; }
.badge { font-family:'Inter',Arial,sans-serif; font-size:7.6pt; padding:0.4mm 1.8mm; border-radius:2mm; background:#e9f4ec; color:#2c6a41; white-space:nowrap; }
.badge.no { background:#fbe9e3; color:#a3381c; }
.kpis.three { grid-template-columns: repeat(3,1fr); }
.appx img.shot { margin-bottom: 1mm; }
.cards5 img { width: 100%; }
body { font-size: 10pt; line-height: 1.55; }
p { margin: 0 0 3.2mm; }
h2 { font-size: 16pt; margin-bottom: 4mm; }
h3 { margin: 4.5mm 0 1.6mm; }
table { font-size: 8.2pt; line-height: 1.38; margin: 1.5mm 0 4mm; }
th, td { padding: 1.5mm 2mm; }
.chg { font-size: 7.7pt; line-height: 1.32; } .chg td, .chg th { padding: 1.2mm 1.8mm; }
img.chart { margin: 2mm 0 1mm; }
.dia svg { max-height: 40mm; }
.card { padding: 3mm 3.5mm 1.5mm; margin-bottom: 4mm; }
.card-body { grid-template-columns: 52% 48%; }
.side p { font-size: 8.8pt; line-height: 1.42; }
.appx img.shot, img.shot.fit { max-height: 228mm; width: auto; max-width: 100%; display:block; margin: 2mm auto 1mm; }
.two img.shot { max-height: 215mm; width: auto; max-width: 100%; }
.cap { margin-bottom: 4mm; }
"""
fig = lambda n: f'<img class="chart" src="{(HERE / "fig" / (n + ".svg")).as_uri()}" alt="">'
shot = lambda n, cls='shot': f'<img class="{cls}" src="{(HERE / "shots" / n).as_uri()}" alt="">'
out_img = lambda n, cls='shot': f'<img class="{cls}" src="{(HERE / "out" / n).as_uri()}" alt="">'
def kpi(v, l): return f'<div><b>{v}</b><span>{l}</span></div>'
def e(x): return f'€{x:,.1f}'
def m(x): return f'€{x/1e6:,.0f} m'
def bn(x): return f'€{x/1e9:,.2f} bn'
def card(key, name, tag, metrics, verdict, rec=False):
    mm = ''.join(f'<div><b>{v}</b><span>{k}</span></div>' for k, v in metrics)
    return f'''<section class="card{' rec' if rec else ''}"><div class="card-head"><h3>{name}</h3><span class="tag">{tag}</span></div>
<div class="card-body"><div class="dia">{D3[key]}</div><div class="side"><div class="metrics">{mm}</div><p>{verdict}</p></div></div></section>'''
def table(head, rows, cls=''):
    h = ''.join(f'<th>{x}</th>' for x in head)
    b = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows)
    return f'<table class="{cls}"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>'
mon = lambda k: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][k % 12] + f' {2027 + k // 12}'

B = S['base']; lead = L
lcoeL = lead['eco']['lcoe']; capexL = lead['eco']['capex']; npvL = lead['eco']['npv']
rec = B['rented']
per = {p['years']: p['lcoe'] for p in lead['eco']['byPeriod']}
top5 = RB['cards']
fwd = M['omipPtBase']['cal']; fwdMean = sum(fwd[y] for y in ['2029', '2030', '2031', '2032', '2033', '2034', '2035', '2036']) / 8

# ------------------------------------------------------------------ pages
cover = f"""
<section class="cover"><div>
<div class="kicker">Concept-stage feasibility study · Revision 3</div>
<h1>Pego data centre campus:<br>feasibility study</h1>
<p class="lead">A 900 MW IT campus on the Pego power complex at Abrantes, Portugal. Revision 3 re-runs the whole study in the current
energy strategy tool, with its new ranking that puts power adequacy first, and refreshes the research on the site, the grid and the
2026 energy market.</p>
<div class="kpis">{kpi('900 MW', 'IT load, nine 100 MW buildings; eight if a 45 °C day must be met without help')}{kpi('Jan 2029', 'first building energised, on rented gas gensets')}{kpi(f'€{lcoeL:,.0f}/MWh', 'energy cost (LCOE), indicative, tool prices')}{kpi(m(capexL), 'energy-plant capex, indicative')}</div>
</div>
<div class="meta">Prepared by Zé · revision 3, 24 October 2026 (revision 2: 22 October 2026). Figures from the energy strategy tool
(development build of 24 October 2026, branch <code>feature/verification-fixes</code>, run as a study build for the existing CCGT, page §basis§) and the
public sources on the last page, opened on 23 and 24 October 2026. Every cost is an indicative default, not a quote. The tool's own PDF
report of the main run comes with this study as a separate file.</div></section>
"""

glance = f"""
<section class="page glance"><h2>At a glance</h2>
<p class="lead">The recommendation of revision 2 survives a much harder test. The new tool searched 2,000 strategies, put the
{RB['adequate']:,} that power every hour first, and still picks the same plan: rent gas gensets for 2029, take the grid in 2030, lease
both units of the existing CCGT from 2031. Two things have changed: the gas market, and the evidence that Pego gets 45 °C days.</p>
{fig('it-capacity')}
<div class="steps">
<div><span class="y">Late 2028 – 2029</span><b>Rented gas gensets</b>186 MW carry buildings 1 and 2 until the grid arrives.</div>
<div><span class="y">January 2030</span><b>Grid, 400 MW</b>A study assumption, not an offer. Carries buildings 1–3 alone.</div>
<div><span class="y">January 2031</span><b>Existing CCGT, leased</b>Both units, 855 MW, cover everything above the grid.</div>
<div><span class="y">Always</span><b>HVO standby gensets</b>441 units cover a grid failure or a CCGT unit trip.</div>
</div>
<div class="kpis small">{kpi(f'€{lcoeL:.1f}/MWh', 'LCOE over 20 years at 7 % real; €{:.0f} with a 50 % renewable PPA'.format(rec['lcoe']))}{kpi(bn(npvL), 'net cost, present value')}{kpi(f"{lead['carbon']['locationG']:.0f} g", 'CO₂e per kWh, location-based (grid 2025: 128 g)')}{kpi(f"{P['lead']['landTakeHa']:.0f} ha", f"of {P['lead']['netHa']:.0f} ha net developable land")}</div>
<h3>Decisions for the client</h3>
<ul class="decide">
<li><b>Heads of terms with Endesa.</b> Endesa owns half of the CCGT, buys all its output under a 25-year contract, holds the old coal
connection right and is building 600 MW of renewables next door. One counterparty can unlock firm power, a PPA and perhaps a private wire.</li>
<li><b>Nine buildings or eight.</b> Alvega, beside the site, reached 45.4 °C in June 2025. On such a day the CCGT gives less power
and the buildings need more. Nine buildings then need about 70 MW of extra help for the hottest hours (page §size§).</li>
<li><b>Fix the gas price, not just the plant.</b> Iberian gas trades at €89/MWh today and €34 for 2029. A gas plan is a bet on that
fall; index the lease and hedge (page §market§).</li>
<li><b>Apply to REN now.</b> The new Abrantes switching station has its environmental approval (May 2026). The two neighbouring campuses
have already asked for more capacity there.</li>
</ul></section>
"""

chg_rows = [
 ['Ranking', 'Options that fail to power any hour go to the bottom (adequacy first).', f"{RB['adequate']:,} of 2,000 strategies power every hour; grid only fails by 11 TWh over 20 years."],
 ['Bridging plant', 'Can be rented and returned, bought and sold on, or bought and kept as standby.', 'All three tested for 2029 (pages §ways§–§ways2§). Renting stays cheapest by €1–5/MWh.'],
 ['Minimum load', 'Firm plant below its minimum load is now run at its minimum, and the surplus is wasted and costed.', 'The 2029 CCGT problem of revision 2 is now in the tool’s own numbers (page §minload§).'],
 ['Grid contract', 'Contracted capacity per strategy and one grid connection charge.', 'The expected charge, €48 m for 400 MW, is entered for every option.'],
 ['Results', 'Top-five cards, Compare, a 16-driver tornado, the PDF report.', 'Used throughout; screens in the appendix.'],
 ['Defaults', 'Batch 2 of the source research: gas turbines €1,450/kW, batteries, PPA prices, grid carbon (Ember 2025).', 'Portugal’s grid is now 128 g/kWh (life-cycle) and €66/MWh.'],
 ['Map and flags', 'A map pin sets the country; every default the engineer did not enter is flagged.', '14 assumed inputs on the recommended option (page §basis§).'],
]
fact_rows = [
 ['REN’s Abrantes station', 'Environmental approval, favourable with conditions, 18 May 2026; amended 27 July 2026.', 'Revision 2 said “still in licensing”. Still no capacity figure or date.'],
 ['Neighbours', 'EDC One (300 MW, 2028) and Hyperion (200 MVA, 2029) both asked REN for more capacity; the minister said a decision is “near”.', 'The 400 MW for this campus remains an assumption.'],
 ['Gas market', 'Hormuz closed since March 2026; 17 % of Qatar’s LNG damaged. Iberian gas €89/MWh spot; €73 for 2027, €34 for 2029.', 'A new “gas crisis persists” case (page §market§).'],
 ['Power market', 'Portuguese base-load futures €117/MWh for 2027 and €53–66 for 2029–2036.', 'A new “Portuguese forwards” case.'],
 ['Network tariff', 'ERSE proposes €11.1/MWh for very high voltage in 2027, €9.0 for electro-intensive users.', 'Used in the forwards case (€15/MWh in all).'],
 ['Heat', 'Alvega 45.4 °C on 28 June 2025; Mora 46.6 °C, a June record.', 'The tool’s design day is 34.2 °C. Tested at 45 °C.'],
 ['Emissions rules', 'Decree-Law 124/2026 tightens the medium combustion plant rules: logged running hours for the 500 h exemption.', 'Limits how often standby gensets can cover a CCGT trip.'],
 ['The CCGT', '2 × Siemens SGT5-4000F, December 2010. Endesa 50 %, ENGIE 25 %, Marubeni 25 %; output sold to Endesa under a 25-year PPA.', 'Endesa must agree to any lease.'],
]
changes = f"""
<section class="page"><h2>What is new in revision 3</h2>
<p>Revision 2 asked for a re-run “with quoted prices, real climate data and the tool’s adequacy-first ranking once built”. The ranking
is now built. Quoted prices and measured climate data are still to come; revision 3 uses market prices and recorded temperatures as cases instead.</p>
<h3>The tool</h3>
{table(['Feature', 'What it does now', 'Effect on this study'], chg_rows, 'chg')}
<h3>The facts, October 2026</h3>
{table(['Topic', 'What changed', 'Effect on this study'], fact_rows, 'chg')}
</section>
"""

site = f"""
<section class="page"><h2>The site and its power</h2>
<p>The Pego complex is an industrial estate on the south bank of the Tagus at Abrantes (39.468° N, 8.109° W). It holds the closed coal
station, now being demolished, the Elecgás CCGT, still running, and REN’s 400 kV switching station.</p>
{table(['Asset', 'What it is', 'Status, October 2026'], [
 ['Former coal station (Tejo Energia)', 'Two units, about 630 MW, 1993–1995', 'Closed 2021. Demolition started March 2026 and takes about three years; the 116 m cooling towers and 225 m chimney come down last (ECO)'],
 ['Elecgás CCGT', '2 × 427.5 MW single-shaft blocks, Siemens SGT5-4000F gas turbines, commissioned December 2010', 'Running when the market calls for it. Endesa 50 %, ENGIE 25 %, Marubeni 25 %; output sold to Endesa under a 25-year PPA (Power Technology, GEM)'],
 ['400 kV switching station (REN)', 'The old coal connection point', 'To be replaced by a new Abrantes station with modified lines; environmental approval 18 May 2026, amended 27 July 2026 (APA)'],
 ['Endesa hybrid project', '600 MW of solar, wind and batteries on the old coal connection right (224 MVA)', 'About €600 m; construction from 2027. Endesa names data centres as the customers its near-baseload profile suits (RTP)'],
])}
<h3>Grid: the assumption, stated plainly</h3>
<div class="callout"><p><b>Assumption, not an offer: 400 MW of grid import from January 2030.</b> No public document gives a capacity or
a date for this campus. The new station now has its environmental approval, which removes one obstacle, but its capacity is spoken for
first by Endesa (224 MVA), EDC One (300 MW) and Hyperion (200 MVA), and both campuses have asked for more (Observador, September 2026).
Portugal allocates scarce capacity under Decree-Law 80/2023 (expressions of interest with a bond, use it or lose it, auction if needed);
connection usually takes two to five years (Slaughter and May).</p></div>
<p>The study tests the assumption three ways: the grid two years late (2032), 600 MW instead of 400, and a campus on the grid alone.</p>
<h3>The neighbours, and the water question</h3>
<p>EDC One (300 MW first phase, from 2028, up to €7 bn) sits in front of the old station; Hyperion (200 MVA, 2029, national-interest status)
is at the Alvega roundabout. Quercus estimates the two could use 4.4 TWh a year, about 29 times the town’s consumption; neither has filed an
environmental impact study yet, and local groups ask for a joint assessment of the Tagus, whose basin is under water stress (Quercus,
Mais Ribatejo). This campus uses liquid cooling with dry coolers: the tool puts its water use at about 126,000 m³ a year, mostly
for the building, far below an evaporative design. That is a planning argument worth making early.</p>
</section>
"""

market = f"""
<section class="page"><h2>The 2026 energy market</h2>
<p>Gas has been dear since March. The Strait of Hormuz has been effectively closed since 2 March 2026, and an attack damaged about 17 % of
Qatar’s Ras Laffan LNG plant; QatarEnergy expects repairs to take three to five years (Argus). Iberian gas (PVB) settled at
€{M['pvbGas']['spot']:.0f}/MWh for the coming days on 22 October, and Portuguese power at €{M['ptSpot']['index']:.0f}/MWh.</p>
{fig('market')}
<p class="cap">OMIP settlement prices: Portuguese base-load power futures (21 October 2026) and PVB gas futures (22 October). The tool’s defaults
are calm-year values: €66/MWh power (Electricity Maps, 2025) and €42/MWh gas.</p>
<p>The futures expect the shock to pass before the campus runs. Gas for 2029 trades at €{M['pvbGas']['yr']['2029']:.0f}/MWh and for 2030 at
€{M['pvbGas']['yr']['2030']:.0f}; power for 2029–2036 averages €{fwdMean:.0f}/MWh. Futures are not forecasts: they are what buyers will pay
today to fix a price, and they can be wrong in both directions. Portugal ran on 75 % renewable electricity in the first seven months of
2026, at an average €57/MWh (APREN).</p>
<h3>Three price cases</h3>
{table(['Case', 'Power (wholesale + network and levies)', 'Gas', 'Carbon'], [
 ['Tool prices (base)', '€66/MWh × the hourly profile + €40/MWh', '€42/MWh + transport', '€88.3/t (EU ETS, October 2026), +2 % a year'],
 ['Portuguese forwards', f'€{fwdMean:.1f}/MWh (2029–2036 futures) + €15/MWh (ERSE 2027 very-high-voltage tariff €11.1, plus levies)', '€35/MWh (2029–2030 futures plus delivery)', 'as base'],
 ['Gas crisis persists', f"€{fwd['2027']:.0f}/MWh (the 2027 future) + €15/MWh", f"€{M['pvbGas']['spot']:.0f}/MWh (today’s spot)", 'as base'],
])}
<p>The tool’s €40/MWh for network charges and levies is a European default. Portugal’s regulator proposes €11.1/MWh as the average very-high-voltage
access tariff for 2027, and €9.0/MWh after the reductions for electro-intensive users (ERSE, 15 October 2026). That is why the forwards case
lowers it to €15.</p>
</section>
"""

hot = S['base:hot45']; hotnd = S['base:hot45nd']
size = f"""
<section class="page"><h2>How big can the campus be?</h2>
<p>Each 100 MW building needs {rec['design']/9:.0f} MW at the tool’s design conditions: IT, plus liquid cooling with dry coolers at a peak PUE of
1.25, plus 2 % ancillary. Nine buildings need {rec['design']:,.0f} MW. Land is not the limit: the recommended plan takes {P['lead']['landTakeHa']:.0f} ha of
{P['lead']['netHa']:.0f} ha net developable (page §site§). The limit is firm power.</p>
{table(['Supply', 'Firm power', 'At 34.2 °C (tool)', 'At 45 °C'], [
 ['Grid only', '400 MW', '3 buildings', '2 buildings'],
 ['Grid + both CCGT units (the HVO gensets cover a unit trip)', '1,255 MW; 1,144 MW at 45 °C', '9 buildings', '<b>8 buildings</b>'],
 ['Grid 600 MW + both CCGT units', '1,455 MW; 1,344 MW at 45 °C', '9 buildings', '9 buildings'],
])}
<h3>Why 45 °C matters now</h3>
<p>The tool’s design day, 34.2 °C, is the hottest hour of its synthetic weather year for Portugal. Real summers are hotter. On 28 June 2025
the Alvega station, in Abrantes municipality and next to the site, recorded 45.4 °C; the next day Mora reached 46.6 °C, a June record for
Portugal (Observador, IPMA). Two things happen on such a day:</p>
<ul>
<li><b>The buildings need more.</b> Dry coolers work harder: at 45 °C each building needs {hot['rented']['design']/9:.0f} MW, so nine need
{hot['rented']['design']:,.0f} MW.</li>
<li><b>The CCGT gives less.</b> Gas turbines lose output as the air warms: about 5–10 % for every 10 °C above 15 °C, and an aeroderivative
loses 26 % at 45 °C (Wärtsilä). The steam cycle of a combined cycle recovers part of it. This study assumes the CCGT loses 13 % at 45 °C,
a judgement to be replaced by Elecgás’s own curves. That leaves 1,144 MW with the grid.</li>
</ul>
<div class="callout warn"><p><b>Nine buildings fall about {hot['rented']['design'] - 1144:.0f} MW short on a 45 °C day.</b> The tool marks every CCGT
strategy “not adequate” in that case: it powers every hour of the synthetic year, but not the 45 °C design day. Eight buildings pass with
{1144 - S['eight:hot45']['rented']['design']:.0f} MW to spare.</p></div>
<p>Ways to keep the ninth building, cheapest first, each to be priced: cool the CCGT’s inlet air on hot days (evaporative coolers or
chillers recover most of the loss); agree a hot-day curtailment of non-critical IT with the client; a battery that covers the hottest
hours; more grid (600 MW closes the gap); or run standby gensets in those hours, within the logged-hours limits of Decree-Law 124/2026.
Decide nine or eight only once Elecgás’s hot-day output is known.</p>
</section>
"""

# How the tool searched
rule_rows = [[r['name'], f"{r['removed']:,}" if isinstance(r.get('removed'), (int, float)) else ''] for r in RB['rules'] if r.get('removed')]
search = f"""
<section class="page"><h2>How the tool searched</h2>
<p>The tool combines its 20 choices (grid strategy, bridging plant, what happens to it when the grid arrives, firm plant, backup, cooling,
solar, battery, PPA and more) into every combination that makes sense: {RB['generated']['total'] if RB.get('generated') and RB['generated'].get('total') else '11,512'} here, after
its compatibility rules. It then screens 2,000 of them, each sized from first principles and run hour by hour for every year to full build
(2027 to 2036, ten years), then repeated to 20 years.</p>
<div class="kpis three">{kpi('2,000', 'strategies sized and run hour by hour')}{kpi(f"{RB['adequate']:,}", 'power every hour of every year (adequate)')}{kpi(f"{RB['seconds']:.0f} s", 'for the whole run on one processor')}</div>
<h3>Settings for this study</h3>
<ul>
<li><b>Standby: HVO gensets required</b>, as in revisions 1 and 2. The client’s standby specification is the backup basis; gas-fired backup is shown as an alternative, not ranked.</li>
<li><b>Time-to-power weight 0.</b> The tool scores “months until the supply could carry the whole campus”. Here every adequate strategy meets
every building’s date; the score would only reward having all 1,145 MW in place years before 2035. The other weights stay at the tool’s
defaults: cost 35, carbon 25, deliverability 15.</li>
<li><b>Fixed:</b> liquid cooling, roof solar only, no wind, no demand flexibility, a 50 % hybrid PPA offered as a choice, the expected grid charge entered.</li>
</ul>
<h3>What the tool picks under its own default settings</h3>
{table(['Settings', 'The tool’s #1', 'LCOE', 'Why'], [
 ['Tool defaults (time-to-power 25, any backup)', 'Rented gensets kept for 20 years as the backup; CCGT from 2031', f"€{RT['top'][0]['lcoe']:.1f}", 'Full capacity early (month 10) and no Seveso fuel store; renting for 20 years is dear'],
 ['Defaults without time-to-power', 'New gas engines bought for 2029, kept for grid services and as backup; CCGT from 2031', f"€{RTN['top'][0]['lcoe']:.1f}", 'No liquid fuel, so no Seveso flag: higher deliverability'],
 ['<b>This study (HVO standby, no time-to-power)</b>', '<b>Rented gensets 2029, grid 2030, CCGT from 2031</b>', f"<b>€{RB['top'][0]['lcoe']:.1f}</b>", 'Cheapest adequate option; ranked first on score too'],
])}
<p>Every one of these, and every top-five card below, uses the existing CCGT from 2031. What moves between settings is the bridge and the backup.
Gas-fired backup avoids 11,000 t of HVO and the Seveso permit, but leaves the campus dependent on the gas network in a grid failure, and costs
€{S['base']['enginesAll']['lcoe'] - rec['lcoe']:.0f}/MWh more (page §ways2§).</p>
<h3>Two checks on the run</h3>
<p><b>Screening.</b> The tool’s faster model (49 representative days, the best 20 verified hour by hour) gives the same 20 best and the same
adequacy count, within {max(abs(o['lcoe']/f['lcoe']-1) for o in RS['all'] for f in [next(x for x in RB['all'] if x['id']==o['id'])] if not o['verified'])*100:.1f} %
of the full model’s LCOE for every option, in {RS['seconds']:.0f} s instead of {RB['seconds']:.0f} s. <b>Re-run.</b> The tornado’s base re-run of the #1 option
reproduces its score exactly ({T['base']['score']:.2f}).</p>
</section>
"""

BR = {'rented': 'Rented gas gensets', 'gasRecip': 'Gas engines, bought', 'dieselPrime': 'HVO-diesel gensets, bought', 'gasTurbine': 'Gas turbines, bought', 'fuelCell': 'Fuel cells, bought', 'ccgt': 'Existing CCGT'}
top5page = f"""
<section class="page"><h2>The tool’s top five</h2>
<p>The tool shows five distinct strategies first: the best-ranked option of each, with its main pros and cons against the whole run.
All five lease the existing CCGT from 2031 and keep HVO standby gensets; they differ in how 2029 is bridged.</p>
<div class="cards5">{shot('top5.png')}</div>
<p class="cap">The top-five cards of the study run, as the tool shows them. “Main flags” are the industrial-emissions (IED) and Seveso permits that every
option with a large HVO store needs; “Assumed defaults (1)” is the design temperature, which comes from the synthetic weather year.</p>
{table(['Card', 'Bridge for 2029', 'After 2030', 'LCOE', 'Capex', 'Carbon'], [[f"#{c['rank']}", BR.get(c['summary']['v']['C2'], c['summary']['v']['C2']), ('returned' if '→ remove' in c['summary']['name'] else 'kept for grid services' if 'grid services' in c['summary']['name'] else 'kept'), f"€{c['summary']['lcoe']:.1f}", m(c['summary']['capex']), f"{c['summary']['loc']:.0f} g"] for c in top5])}
<p>The differences are small: €{min(c['summary']['lcoe'] for c in top5):.0f}–{max(c['summary']['lcoe'] for c in top5):.0f}/MWh. Renting wins because it pays
only for the months the plant is needed. The next three buy plant for 2029 and then find it a job (grid services or sale); their
case improves if the grid is late and the plant runs longer.</p>
</section>
"""

def mm(k, s='base'): return S[s][k]
def cardm(k):
    o = mm(k)
    return [('IT load', '900 MW'), ('first IT', 'Jan 2029'), ('LCOE', f"€{o['lcoe']:.1f}/MWh"), ('capex', m(o['capex'])), ('carbon', f"{o['loc']:.0f} g/kWh"), ('adequate', 'yes' if o['adequate'] else 'no')]
g3 = S['gridOnly3']['gridOnly']
strat1 = f"""
<section class="page"><h2>Ways to power the campus</h2>
<p>Each strategy below was built by the tool from the same rules and run hour by hour. To compare like with like, all have nine buildings,
a 50 % hybrid PPA and HVO standby gensets unless stated; figures at the tool’s prices. Page §cost§ shows the other price and grid cases.</p>
{card('grid3', 'Grid only', '300 MW IT', [('IT load', '300 MW'), ('first IT', 'Jan 2030'), ('LCOE', f"€{g3['lcoe']:.1f}/MWh"), ('capex', m(g3['capex'])), ('carbon', f"{g3['loc']:.0f} g/kWh"), ('adequate', 'yes')],
 f"The cheapest and cleanest per MWh, but a third of the campus and a year later. Nine buildings on the grid alone would leave {mm('gridOnly')['unmet']['mwh']/1e6:.0f} TWh unmet over 20 years.")}
{card('rec', 'Rent, then grid, then the CCGT from 2031', 'recommended', cardm('rented'), f"The tool’s #1 (without the PPA: €{lcoeL:.1f}/MWh). Rented gensets carry 2029; the grid carries 2030; the CCGT lease starts when the campus outgrows the grid. Nothing is bought that is used for a year.", rec=True)}
{card('v1', 'CCGT from mid-2028 (revision 1)', 'grid late?', cardm('v1'), f"Firm power six months before the first building, but a year below the CCGT’s minimum load (page §minload§). €{mm('v1')['lcoe']-rec['lcoe']:.1f}/MWh dearer, unless the grid is two years late: then it is the cheapest (page §cost§).")}
</section>
"""
strat2 = f"""
<section class="page">
{card('sell', 'Buy gas engines for 2029, sell them on', 'close second', cardm('enginesSell'), f"Nineteen 10 MW engines from late 2028, resold in 2030 at half their book value (a tool judgement). €{mm('enginesSell')['lcoe']-rec['lcoe']:.1f}/MWh dearer than renting, but owned plant: no rental market risk.")}
{card('keep', 'Buy HVO gensets for 2029, keep them as standby', 'new in the tool', cardm('hvoKeep'), f"The standby fleet you need anyway, bought early and run as prime in 2029. €{mm('hvoKeep')['lcoe']-rec['lcoe']:.1f}/MWh dearer because the tool buys all 431 units in 2028 instead of one building at a time; bought in step with the buildings it would be close to renting.")}
{card('engines', 'New gas engines, prime and backup', 'tool default #1 type', cardm('enginesAll'), f"119 engines carry everything above the grid and are also the backup: no HVO, no Seveso store. €{mm('enginesAll')['lcoe']-rec['lcoe']:.0f}/MWh dearer, backup depends on the gas network, and it needs {P['enginesAll']['landTakeHa']:.0f} ha.")}
</section><section class="page"><h2>Side by side</h2>
{table(['Strategy', 'Adequate', 'LCOE €/MWh', 'NPV', 'Capex', 'Carbon g/kWh (loc. / market)'],
 [[n, '<span class="badge">yes</span>' if S['base'][k]['adequate'] else '<span class="badge no">no</span>', f"{S['base'][k]['lcoe']:.1f}", bn(S['base'][k]['npv']), m(S['base'][k]['capex']), f"{S['base'][k]['loc']:.0f} / {S['base'][k]['mkt']:.0f}"] for k, n in [
  ('gridOnly', 'Grid only, nine buildings'), ('rented', 'Recommended: rent, grid, CCGT 2031'), ('enginesSell', 'Buy gas engines, sell on; CCGT 2031'), ('v1', 'CCGT from mid-2028'),
  ('hvoKeep', 'Buy HVO gensets, keep as standby; CCGT 2031'), ('enginesAll', 'New gas engines, prime and backup'), ('enginesTop', 'Rent, then new gas engines top-up'), ('chp', 'Rent, then CHP trigeneration'), ('turbines', 'New gas turbines'), ('fuelCells', 'Rent, then fuel cells top-up')]], 'sbs')}
<p class="cap">Nine buildings, 50 % hybrid PPA, tool prices, 20 years at 7 % real. Market-based carbon counts the PPA. New turbines, CHP and fuel cells cost
€{mm('chp')['lcoe']-rec['lcoe']:.0f}–{mm('fuelCells')['lcoe']-rec['lcoe']:.0f}/MWh more than the recommended plan: they buy new plant to do what the leased CCGT already does.
Turbine delivery queues also run to 2029–2030 and prices are rising (Power Engineering, Turbomachinery Magazine).</p>
</section>
"""

v1 = mm('v1'); y29 = [y for y in v1['years'] if y['demandGWh'] > 0][0]; c29 = [p for p in y29['plants'] if p['tech'] == 'ccgt'][0]
minload = f"""
<section class="page"><h2>The CCGT’s minimum load, and when to start the lease</h2>
<p>A data centre needs power every hour; a CCGT unit cannot run steadily below about 45 % of its output, roughly 192 MW (a typical value for
this class; to confirm with Elecgás). Revision 2 had to work this out by hand. The tool now does it: when firm plant must run below its
minimum, it runs at its minimum, and the surplus is wasted and paid for.</p>
{fig('min-load-2029')}
<p>With the CCGT leased from mid-2028, 2029 needs {y29['demandGWh']:,.0f} GWh; the CCGT makes {c29['gwh']:,.0f} GWh, of which {c29['curtGWh']:,.0f} GWh is
surplus. The tool counts the gas burnt for it. This is the main reason the 2028 start costs €{v1['lcoe']-rec['lcoe']:.1f}/MWh more than renting for 2029.</p>
<h3>After 2031 the tool is cautious</h3>
<p>From 2032 the tool also runs the CCGT at its minimum when the campus needs a little more than the grid can give, and wastes the
surplus ({[p for p in rec['years'][5]['plants'] if p['tech']=='ccgtTop'][0]['curtGWh']:,.0f} GWh in 2032). In reality the campus would take that much less from
the grid. The tool cannot do that yet (known issue 11). With the minimum load set to zero, the recommended plan costs
€{S['base:msl0']['rented']['lcoe']:.1f}/MWh instead of €{rec['lcoe']:.1f}: the truth lies between.</p>
{table(['Lease start', 'How 2029 is powered', 'LCOE', 'Verdict'], [
 ['Mid-2028', 'One CCGT unit at its minimum, most of it wasted', f"€{v1['lcoe']:.1f}", 'Only if the grid is late'],
 ['2031', 'Rented gas gensets, 186 MW', f"€{rec['lcoe']:.1f}", '<b>Recommended</b>'],
 ['2031', 'Gas engines bought and sold on', f"€{mm('enginesSell')['lcoe']:.1f}", 'Fallback if rental capacity is short'],
])}
<p>One more caution in the tool’s favour of renting: it hires the gensets from the month they could first arrive (November 2027), 14 months
before the first building. Hiring them only from late 2028 saves about €24 m in present value (€0.5/MWh): renting is slightly better than shown.</p>
</section>
"""

prog = f"""
<section class="page"><h2>Programme and supply</h2>
{fig('supply-stack')}
<p class="cap">Recommended plan, month by month. The dashed line is the design load on a 45 °C day; the dotted red line is grid plus a CCGT
13 % down on such a day. They cross when the ninth building is energised (2035).</p>
<div class="gantt">
{table(['Item', '2026', '2027', '2028', '2029', '2030', '2031', '2032–2036'], [
 ['Heads of terms: Endesa / Elecgás (lease, PPA)', '■', '■', '', '', '', '', ''],
 ['Grid application to REN; national-interest status', '■', '■', '', '', '', '', ''],
 ['Permits: IED for gensets, Seveso for 11,000 t HVO', '', '■', '■', '', '', '', ''],
 ['Rented gas gensets on site (186 MW)', '', '', '■ (late)', '■', '', '', ''],
 ['Grid 400 MW (assumed)', '', '', '', '', '■', '■', '■'],
 ['400 kV link to the CCGT built', '', '', '', '■', '■', '', ''],
 ['CCGT lease (both units)', '', '', '', '', '', '■', '■'],
 ['Buildings energised (one every 9 months)', '', '', '', 'B1, B2', 'B3', 'B4', 'B5–B9 (Jan 2035)'],
 ['Coal station demolition (Tejo Energia)', '■', '■', '■', '■ (Mar)', '', '', ''],
], 'sbs')}
</div>
<p>The CCGT deal is off the critical path for the first building: it is needed only from 2031. The rented gensets and their permits are
on it. If REN cannot confirm 2030 by early 2028, sign the CCGT lease for 2029 instead.</p>
</section>
"""

sc = [('base', 'Tool prices'), ('market', 'Portuguese forwards'), ('crisis', 'Gas crisis persists'), ('gridLate', 'Grid 2 years late'), ('grid600', 'Grid 600 MW')]
cost = f"""
<section class="page"><h2>Cost and carbon</h2>
{fig('lcoe')}
<p>Three things move the answer most. <b>Gas price:</b> if today’s €89/MWh gas and €117/MWh power persisted, every gas strategy rises by
about €{S['crisis']['rented']['lcoe']-rec['lcoe']:.0f}/MWh, to €{S['crisis']['rented']['lcoe']:.0f} for the recommended plan; the forwards instead bring it down to
€{S['market']['rented']['lcoe']:.0f}. <b>The grid date:</b> two years late adds €{S['gridLate']['rented']['lcoe']-rec['lcoe']:.1f}/MWh, and then the 2028 CCGT
start is €{S['gridLate']['rented']['lcoe']-S['gridLate']['v1']['lcoe']:.1f}/MWh cheaper. <b>More grid:</b> 600 MW lowers carbon by about
{rec['loc']-S['grid600']['rented']['loc']:.0f} g/kWh and cost by €{rec['lcoe']-S['grid600']['rented']['lcoe']:.1f}/MWh.</p>
{table(['Strategy'] + [l for _, l in sc], [[n] + [f"{S[s][k]['lcoe']:.1f}" for s, _ in sc] for k, n in [('rented', 'Recommended'), ('enginesSell', 'Buy engines, sell on'), ('v1', 'CCGT from 2028'), ('hvoKeep', 'Buy HVO, keep'), ('enginesAll', 'Gas engines, prime and backup')]], 'sbs')}
</section><section class="page"><h2>Carbon</h2>
{fig('carbon')}
<p>Gas makes the campus about twice as carbon-intensive as the Portuguese grid. Four levers reduce it: run the CCGT only above what the grid can carry
(a clause in the lease; the tool runs it whenever it is cheaper than the grid at its prices); more grid when REN can give it; a larger
PPA, which lowers market-based carbon; and, in time, renewable power from Endesa’s plant next door by private wire.</p>
</section>
"""

sens = f"""
<section class="page"><h2>Sensitivity</h2>
{fig('tornado')}
<p>Each bar is the recommended plan re-run with one input at the low and the high end of its range (the tool’s 16 drivers, each range an
indicative default). Gas and carbon prices dominate: together they can move the LCOE by about €50/MWh. Capex, the grid date and the discount rate
follow. The IT load hardly matters: a smaller campus spreads the same lease over less energy, a larger one adds standby plant.</p>
<h3>The evaluation period</h3>
<p>The LCOE is €{per[10]:.0f}/MWh over 10 years, €{per[15]:.0f} over 15 and €{per[20]:.0f} over 20: the early years carry the grid charge and the
standby fleet before the campus is full.</p>
<h3>Six, eight or nine buildings</h3>
{table(['Buildings', 'Recommended plan', 'Gas engines, prime and backup', 'Best'], [
 ['6', f"€{S['six']['rented']['lcoe']:.1f}", f"€{S['six']['enginesAll']['lcoe']:.1f}", 'New gas engines: the 855 MW CCGT is too big for 364 MW of need'],
 ['8', f"€{S['eight']['rented']['lcoe']:.1f}", f"€{S['eight']['enginesAll']['lcoe']:.1f}", 'Recommended plan'],
 ['9', f"€{rec['lcoe']:.1f}", f"€{S['base']['enginesAll']['lcoe']:.1f}", 'Recommended plan'],
], 'sbs')}
<p class="cap">50 % PPA, tool prices. The CCGT lease pays when the campus needs most of its 855 MW; at six buildings, new engines sized to the need are cheaper.</p>
</section>
"""

capex = f"""
<section class="page"><h2>What it costs to build</h2>
{fig('capex')}
<p>Energy plant only: the building shell and the IT are not included. The CCGT has no capex: it is leased at an assumed €6/kW a month (about €62 m a year
for both units), which sits in operating cost; the €62 m line is this study’s estimate for the 400 kV link and incoming bays. The grid connection
charge is the tool’s expected figure for 400 MW at extra-high voltage (€120,000/MW); REN’s offer will replace it.</p>
<p>The standby gensets are the largest item, as in revision 2. A firm and diverse main supply (grid plus two CCGT units) is the strongest argument
for asking the client whether a lower standby specification is acceptable, for example N rather than N+1, or standby for the critical IT only.</p>
</section>
"""

siteplans = f"""
<section class="page"><h2>Site layout</h2>
<p>The tool lays every block on the site: 18 data halls (two per building), substation, standby gensets, fuel store and the rented gensets
for 2029. The site is the default 150 ha rectangle at the project location, long side east–west; the real boundary, roads, the demolition
zone and REN’s new station still have to be drawn in (page §risks§). The Site tab is a Beta feature and is kept out of the ranking.</p>
{shot('site-plan.png', 'shot fit')}
<p class="cap">The Site tab’s plan of the recommended plan: {P['lead']['landTakeHa']:.0f} ha of {P['lead']['netHa']:.0f} ha net developable ({P['lead']['landTakeHa']/P['lead']['netHa']*100:.0f} %), every block placed with the default clearances.</p>
</section><section class="page"><h2>Site layout: massing</h2>{out_img('iso-lead.png')}
<p class="cap">Massing of the same layout, drawn from the tool’s placed blocks with their heights (×3 for legibility). The rented gensets (pink) leave in 2030.</p>
</section>

<div class="two"><div>{out_img('iso-enginesAll.png')}<p class="cap">New gas engines as prime and backup: {P['enginesAll']['landTakeHa']:.0f} ha. The engine halls sit beside the substation; there is no HVO store.</p></div>
<div>{out_img('iso-eight.png')}<p class="cap">Eight buildings, recommended plan: {P['eight']['landTakeHa']:.0f} ha.</p></div></div>
</section><section class="page">{shot('site.png', 'shot fit')}
<p class="cap">The full Site tab: plan, site fit, separations, roof use and the top six options at the same scale.</p>
</section>
"""

ideas = """
<section class="page"><h2>Thinking outside the box</h2>
<div class="ideas">
<div><b>1. One counterparty: Endesa</b>Endesa owns half the CCGT, buys its output until about 2035, holds the old connection right and is building 600 MW of
renewables next door. A single heads of terms could cover the lease, a PPA and a private wire.<span class="st">Commercial · start now</span></div>
<div><b>2. Inlet cooling for the CCGT</b>Evaporative coolers or chillers on the gas turbine inlets recover most of the hot-day loss and may keep the
ninth building without new plant.<span class="st">Ask Elecgás and Siemens Energy · price it</span></div>
<div><b>3. Hire the gensets late</b>Rent from late 2028, not from when they could first arrive. The tool shows about €24 m saved.<span class="st">Modelled</span></div>
<div><b>4. Buy the standby fleet early, use it first</b>Buy the first two buildings’ HVO gensets in 2028 and run them as prime in 2029: no rental, and
they become standby. Worth it if rental capacity is short.<span class="st">Modelled (the tool buys the whole fleet at once)</span></div>
<div><b>5. Hedge the gas</b>The lease should index gas to PVB and allow hedging; at today’s prices every gas plan costs about €50/MWh more.<span class="st">For the heads of terms</span></div>
<div><b>6. A grid-first lease clause</b>Run the CCGT only for the load above the grid. At Portuguese prices the tool does this already.<span class="st">Modelled</span></div>
<div><b>7. A lower standby specification</b>With a firm, diverse main supply the client may accept N rather than N+1 standby. Standby gensets are more than half the capex.<span class="st">Client decision · tens of millions</span></div>
<div><b>8. Dry cooling as a planning asset</b>The campus would use about 126,000 m³ of water a year, a small fraction of an evaporative design. Say so early in the
Tagus debate.<span class="st">Planning strategy</span></div>
</div></section>
"""

risks = f"""
<section class="page"><h2>Risks and next steps</h2>
{table(['Risk', 'Why it matters', 'What to do'], [
 ['No CCGT lease, or a dearer one', 'Nine buildings depend on it; €6/kW a month is assumed; Endesa holds the output under a PPA to about 2035', 'Heads of terms with Endesa and its partners in 2027; fallback: eight buildings with new gas engines, or three on grid only'],
 ['Gas price', f"Today’s prices add about €{S['crisis']['rented']['lcoe']-rec['lcoe']:.0f}/MWh", 'Index to PVB, hedge, grid-first clause'],
 ['Hot-day output', f"Nine buildings are {hot['rented']['design'] - 1144:.0f} MW short at 45 °C with a 13 % CCGT loss", 'Elecgás’s output curves; inlet cooling; or plan eight buildings'],
 ['Grid late, smaller or contested', '400 MW by 2030 is an assumption; two neighbours want more of the same station', 'Apply now; national-interest status; lease option to start in 2029'],
 ['Rental capacity in 2028–2029', '186 MW of rented gas gensets in Portugal', 'Early reservation; fallback: buy engines and sell on (+€1/MWh)'],
 ['Genset running hours', 'Gensets cover CCGT trips; Decree-Law 124/2026 logs hours for the 500 h exemption', 'Get the CCGT outage record; size the hot-day help so gensets are not it'],
 ['Permits for standby plant and fuel', 'IED for the genset fleet; 11,000 t of HVO is a lower-tier Seveso site', 'Start with the planning application; consider 24 h with firm refuelling'],
 ['Carbon targets', f"{lead['carbon']['locationG']:.0f} g/kWh against the grid’s 128 g", 'PPA, grid-first operation, private wire, more grid later'],
 ['Water and local opposition', 'Tagus water stress; joint assessment requested for the neighbours', 'Dry cooling; early engagement'],
 ['Demolition and ground', 'Towers and chimney come down last, to about 2029', 'First buildings on land cleared first; confirm title; ground survey'],
])}
<h3>Next steps</h3>
<ol class="decide">
<li>Heads of terms with Endesa (and ENGIE and Marubeni): CCGT lease from 2031 with an option for 2029, grid-first clause, gas indexation, hot-day output and outage data, a PPA or private wire.</li>
<li>Grid application to REN at the new Abrantes station; national-interest status through AICEP.</li>
<li>The client’s decisions: nine or eight buildings; standby specification; gas-fired backup acceptable or not.</li>
<li>Reserve rental capacity for late 2028.</li>
<li>Real site boundary, demolition interface and REN’s station on the plan; ground survey.</li>
<li>Re-run with quoted prices and measured climate data (ASHRAE or IPMA) once available.</li>
</ol></section>
"""

assumed = [f['path'] for f in lead['flags'] if f.get('assumed') and f.get('path')]
basis = f"""
<section class="page tight"><h2>Basis and limits</h2>
<p><b>Tool.</b> Energy strategy tool for data centre campuses, development build of 24 October 2026 (branch <code>feature/verification-fixes</code>,
all Node and screen tests passing, GitHub checks green). An hour-by-hour model for every year to full build, repeated to 20 years, with synthetic
weather and price profiles for Portugal. 24 defaults now carry a published source (labelled “sourced — not independently checked”); the rest are
indicative and unverified.</p>
<p><b>Inputs set for this study.</b> 150 ha at 39.468° N, 8.109° W; nine buildings of 100 MW IT every nine months from January 2029; liquid cooling with
dry coolers; no grid until January 2030, then 400 MW (tested: 600 MW; January 2032); gas on site; roof solar only; no wind; hybrid PPA at 50 % offered;
grid connection charge €48 m (the tool’s expected figure); ten dispatch years (the default eight would stop in 2034, before the campus is full);
HVO standby required and time-to-power weight 0 (page §search§).</p>
<p><b>The study build.</b> The tool has no “existing plant” type (known issue 12), so a copy of the tool was given two records for the Elecgás CCGT:
leased from mid-2028 (as bridging plant) or from 2031 (as firm top-up); lease €6/kW a month as fixed cost; €3/MWh variable; 56 % efficiency;
45 % minimum load; exactly two 427.5 MW units, no N+1 (the HVO gensets cover a unit trip); its own consent; not drawn on the campus; the 400 kV link
€62 m as its capex. Two rules keep the records sensible. The run’s site-layout stage was skipped (site fit is outside the ranking; on this machine it took
over an hour); the best 24 options and the plans shown were laid out in full. None of the CCGT figures comes from Elecgás.</p>
<p><b>Defaults this study relies on, not entered</b> (flagged by the tool on the recommended option): {', '.join(f'<code>{a}</code>' for a in assumed)}.</p>
<p><b>Tool defects found in this study</b> (to record in the repository’s known issues for the owner’s decision): time-to-power scores months until
the whole campus could be supplied, even when no building waits; rented plant is paid from the month it could first arrive, not from when it is needed
(€24 m here); retained bridging plant is bought all at once, not per building; the eight-year dispatch default silently repeats a part-built year
for long programmes. Known issues 10 (gas-dependency flag), 11 (minimum load wastes surplus instead of backing off the grid) and 12 (no existing-plant
type) remain open.</p>
<p><b>Not modelled.</b> CCGT hot-day output (a 13 % judgement) and forced outages; gas network capacity at Pego; the private wire; buying the CCGT;
building shell and IT costs; the real site boundary.</p>
</section>
"""

appx = f"""
<section class="page appx"><h2>Appendix A: the tool’s screens for this study</h2>
<div class="two"><div>{shot('inputs-1.png')}<p class="cap">Location: the map pin puts Pego in Portugal; the country, currency and defaults follow.</p></div>
<div>{shot('inputs-4.png')}<p class="cap">Utilities and grid: no grid until 2030, then 400 MW; the expected connection charge entered.</p></div></div>
</section>
<section class="page appx">{shot('run-summary.png')}<p class="cap">Run summary: combinations, compatibility rules (including the study build’s rules l and m), values not generated and the grid shortfall analysis.</p></section>
<section class="page appx">{shot('compare.png')}<p class="cap">Compare: the first three cards side by side.</p></section>
<section class="page appx">{shot('ranked.png')}<p class="cap">The ranked list: adequate options first, with LCOE, capex, carbon, first power, full load, adequacy and resilience.</p>
{shot('tradeoffs.png')}<p class="cap">Trade-offs: cost against carbon, size and colour by resilience.</p></section>
<section class="page appx">{shot('detail-1.png')}<p class="cap">Option detail of the #1: every sizing step, power adequacy, evaluation periods, assumed defaults and flags.</p></section>
<section class="page appx">{shot('dispatch-week.png')}<p class="cap">Dispatch: supply against design load by month, and the peak-demand week of 2036 hour by hour.</p></section>
<section class="page appx">{shot('sensitivity.png')}<p class="cap">Sensitivity: all 16 drivers ticked, LCOE measured; the base re-run matches the ranking.</p></section>
<section class="page"><h2>Appendix B: the tool’s own PDF report</h2>
<p>The tool’s “Save PDF report” button writes a report of the run: inputs first (entered or default, with each default’s basis), assumptions, the top five,
the top 20, trade-offs, Compare, the energy balance, the tornado, flags and the method. The report for this study’s main run comes with this document as
a separate file: <i>energy-strategy-report-Pego-data-centre-campus-study-revision-3-2026-10-24.pdf</i>. It leaves out the Site tab, as agreed.</p>
</section>
"""

src = [
 ('Power Technology: Elecgás (Pego) combined cycle plant', 'https://www.power-technology.com/marketdata/elecgas-pego-combined-cycle-power-plant-portugal/'),
 ('GEM wiki: ElecGas SA', 'https://www.gem.wiki/E100000000835'),
 ('ECO: Tejo Energia starts demolishing the Pego coal plant in March (19 Feb 2026)', 'https://eco.sapo.pt/2026/02/19/tejo-energia-inicia-demolicao-da-central-a-carvao-do-pego-em-marco/'),
 ('APA, AIA 3819: public consultation report, new Abrantes switching station', 'https://siaia.apambiente.pt/AIADOC/AIA3819/rcp_aia3819202651516815.pdf'),
 ('APA, AIA 3819: amendment of the environmental impact declaration (27 Jul 2026)', 'https://siaia.apambiente.pt/AIADOC/AIA3819/aia3819-alteraçãodia_anexo_tua2026728153626.pdf'),
 ('RTP: Endesa expects to start building the Pego project in 2027 (24 Feb 2026)', 'https://www.rtp.pt/noticias/economia/endesa-preve-iniciar-construcao-de-projeto-do-pego-em-2027_n1721210'),
 ('Observador: Abrantes data centre promoters ask for more grid (15 Sep 2026)', 'https://observador.pt/2026/09/15/promotores-dos-dois-centros-de-dados-previstos-para-abrantes-pedem-mais-capacidade-de-ligacao-a-rede/'),
 ('DCD: another campus at Pego (Hyperion, 1 Jun 2026)', 'https://www.datacenterdynamics.com/br/not%C3%ADcias/portugal-ganha-mais-um-campus-digital-apoiado-na-infraestrutura-energetica-de-pego/'),
 ('Quercus: two Abrantes data centres (26 Aug 2026)', 'https://quercus.pt/blog/2026/08/26/centros-de-dados-abrantes/'),
 ('Mais Ribatejo: data centres, water, energy and the Tagus (21 Oct 2026)', 'https://maisribatejo.pt/centros-dados-abrantes-agua-energia-tejo/'),
 ('DCD: Portugal expects 44 data centre projects, 2.6 GW (14 Oct 2026)', 'https://www.datacenterdynamics.com/es/noticias/portugal-prev%C3%A9-44-proyectos-de-centros-de-datos-y-m%C3%A1s-de-26-gw/'),
 ('Portugal Digital: National Data Centre Plan', 'https://digital.gov.pt/en/noticias/plano-nacional-de-centros-de-dados'),
 ('Slaughter and May: data centre regulatory guide, Portugal', 'https://www.slaughterandmay.com/services/practices/infrastructure-and-energy/power-and-place-a-regulatory-guide-to-data-centre-developments-in-europe/portugal/'),
 ('Argus: TTF price spike spills into 2027 and beyond (19 Mar 2026)', 'https://www.argusmedia.com/en/news-and-insights/latest-market-news/2803352-ttf-gas-price-spike-spills-into-2027-and-beyond'),
 ('OMIP: market results and futures (21–22 Oct 2026)', 'https://www.omip.pt/en/plazo-hoy'),
 ('MIBGAS: PVB-TTF products (22 Oct 2026)', 'https://www.mibgas.es/en/market-results/daily-price/pvb-ttf'),
 ('Soldionline: TTF November future above €76 (2 Oct 2026)', 'https://www.soldionline.it/notizie/forex-commodities/gas-perche-e-tornato-sopra-76-euro-il-future-ttf-novembre-298'),
 ('GMK Center: European carbon prices €88/t in October (15 Oct 2026)', 'https://gmk.center/en/news/european-carbon-prices-rose-to-e88-t-in-october/amp/'),
 ('APREN: renewable electricity bulletin, July 2026', 'https://www.apren.pt/wp-content/uploads/2026/08/Jul2026_Boletim-PT.pdf'),
 ('ERSE: 2027 tariff proposal, questions and answers (15 Oct 2026)', 'https://www.erse.pt/media/tjni5wea/perguntas_e_respostas_proposta_tse_2027.pdf'),
 ('Observador: June temperature record, 46.6 °C (29 Jun 2025)', 'https://observador.pt/2025/06/29/batido-recorde-de-temperatura-em-portugal-no-mes-de-junho-impa-regista-466oc-no-alentejo/'),
 ('IPMA: climate in 2025', 'https://dataclima.ipma.pt/en/index-eventos/climate-in-2025/'),
 ('Wärtsilä: derating due to ambient temperature', 'https://wartsila.com/energy/learn-more/technology-comparison-engine-vs-aero/derating-due-to-ambient-temperature'),
 ('Diário da República: Decree-Law 124/2026 (26 Jun 2026)', 'https://files.diariodarepublica.pt/1s/2026/06/12200/0000600018.pdf'),
 ('Power Engineering: GE Vernova turbine slots tighten through 2030 (23 Apr 2026)', 'https://www.power-eng.com/gas/turbines/data-centers-drive-record-surge-in-ge-vernova-power-equipment-orders-as-turbine-slots-tighten-through-2030/'),
 ('Turbomachinery Magazine: the gas turbine bottleneck (Sep 2026)', 'https://www.turbomachinerymag.com/view/steam-turbines-gas-turbine-bottleneck-siemens-energy'),
]
sources = f"""
<section class="page"><h2>Sources</h2>
<p class="small">Pages opened for this revision on 23–24 October 2026. Revision 2’s sources still apply where cited there. The tool’s own defaults carry their
sources in its registry (Electricity Maps 2025 for prices, Ember 2025 for grid carbon, EIA, Fraunhofer ISE, BloombergNEF and others).</p>
<ol class="small">{''.join(f'<li><a href="{u}">{html.escape(t)}</a></li>' for t, u in src)}</ol>
</section>
"""

body = cover + glance + changes + site + market + size + search + top5page + strat1 + strat2 + minload + prog + cost + sens + capex + siteplans + ideas + risks + basis + appx + sources
import re, pypdf
PDF = HERE / 'Pego-data-centre-campus-feasibility-study-rev3.pdf'
async def render(html_text):
    (HERE / 'study3.html').write_text(html_text)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        pg = await b.new_page()
        await pg.goto((HERE / 'study3.html').as_uri()); await pg.wait_for_timeout(1500)
        foot = "<div style='font-family:Arial;font-size:7pt;color:#77756e;width:100%;padding:0 17mm;display:flex;justify-content:space-between'><span>Pego data centre campus: feasibility study · revision 3</span><span><span class='pageNumber'></span> / <span class='totalPages'></span></span></div>"
        await pg.pdf(path=str(PDF), format='A4', print_background=True, display_header_footer=True, header_template='<div></div>', footer_template=foot, margin={'top': '16mm', 'bottom': '18mm', 'left': '17mm', 'right': '17mm'})
        await b.close()
def page_map():
    r = pypdf.PdfReader(str(PDF)); texts = [pg.extract_text() or '' for pg in r.pages]
    keys = {'basis': 'Basis and limits', 'cost': 'Cost and carbon', 'market': 'The 2026 energy market', 'minload': 'minimum load, and when', 'risks': 'Risks and next steps',
            'search': 'How the tool searched', 'site': 'Site layout', 'size': 'How big can the campus be', 'ways': 'Ways to power the campus'}
    out = {}
    for k, h in keys.items():
        out[k] = next((i + 1 for i, t in enumerate(texts) if h in t[:150].replace('ʼ', '’')), None)
    out['ways2'] = out['ways'] + 1 if out['ways'] else None
    return out, len(texts)
def fill(text, pm): return re.sub('§(\\w+)§', lambda mo: str(pm.get(mo.group(1)) or '?'), text)
doc0 = f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Pego data centre campus: feasibility study, revision 3</title><style>{CSS}</style></head><body>{body}</body></html>'
asyncio.run(render(fill(doc0, {})))
pm, n = page_map(); print('pass 1', n, 'pages', pm)
asyncio.run(render(fill(doc0, pm)))
pm2, n2 = page_map(); print('pass 2', n2, 'pages', pm2)
assert pm == pm2, 'page numbers moved'
print('built')
