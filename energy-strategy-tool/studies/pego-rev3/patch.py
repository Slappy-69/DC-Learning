# Study build for the Pego report (revision 3): applies the case-specific edits to a copy of the app source.
# Nothing here goes into the product. Each edit is listed in the report's "Basis and limits".
#  1. Existing CCGT (Elecgas, 2 x 427.5 MW) as two technology records:
#     ccgt     - bridging plant leased from July 2028 (C2), kept as prime or handed back when the grid arrives (C3)
#     ccgtTop  - firm top-up leased from January 2031 (C4, permanent-shortfall sizing only)
#     Lease EUR 6/kW a month booked as fixed O&M (EUR 72/kW a year); capex = the 400 kV link and incoming bays
#     (EUR 62 m / 855 MW = EUR 72.5/kW); exactly two units, no N+1 (the HVO standby gensets cover a unit trip, as they
#     cover a grid failure); minimum stable load 45 %; own consent (operating plant); not drawn on the campus plan.
#  2. Generator rules (l) and (m) for those records.
#  3. App opens on the Pego inputs (referencePego).
import re, sys, pathlib
ROOT = pathlib.Path(sys.argv[1])
E = ROOT / 'src' / 'engine'

def edit(path, old, new, count=1):
    p = ROOT / path if not isinstance(path, pathlib.Path) else path
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'not found in {p}: {old[:80]}')
    s = s.replace(old, new, count)
    p.write_text(s)

# ---- defaults.js ----
d = E / 'defaults.js'
edit(d, "['bessSolar', 'BESS + solar only'], ['rented', 'Rented temporary generation']] },",
        "['bessSolar', 'BESS + solar only'], ['rented', 'Rented temporary generation'], ['ccgt', 'Existing CCGT (lease from mid-2028)']] },")
edit(d, "['none', 'None'], ['chp', 'Gas CHP-trigen'], ['gasRecip', 'Gas recips'], ['fuelCell', 'Fuel cells'], ['smr', 'SMR'], ['hydrogen', 'Hydrogen']] },",
        "['none', 'None'], ['chp', 'Gas CHP-trigen'], ['gasRecip', 'Gas recips'], ['fuelCell', 'Fuel cells'], ['smr', 'SMR'], ['hydrogen', 'Hydrogen'], ['ccgt', 'Existing CCGT (lease from 2031)']] },")
CCGT = """
// ---- Pego study build (revision 3): the existing Elecgas CCGT, leased. Study assumptions, not sourced quotes. ----
const CCGT_P = {
  capexPerKW: [72.5, 'EUR/kW (400 kV link and incoming bays, study estimate EUR 62 m for 855 MW)', 50, 120],
  fomPerKW: [72, 'EUR/kW/yr (lease EUR 6/kW a month, assumed)', 48, 108], vomPerMWh: [3, 'EUR/MWh', 2, 5],
  eff: [0.56, 'electrical efficiency (CCGT, part-load allowance)', 0.52, 0.58], msl: [0.45, 'min stable load fraction (one unit)', 0.4, 0.5],
  unitMW: [427.5, 'MW', 418, 427.5], life: [25, 'yr', 15, 30], m2PerMW: [0, 'm2/MW (existing plant beside the campus)', 0, 0], stackM: [0, 'm', 0, 0],
};
tech('ccgt', { name: 'Existing CCGT (Elecgas, lease from mid-2028)', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, ownConsent: true, offsite: true, fixedUnits: 2, verify: 'Elecgas / Endesa; study assumption' }, {
  ...CCGT_P, planM: [6, 'months (heads of terms)', 3, 12], procM: [3, 'months', 1, 6], buildM: [9, 'months (400 kV link)', 6, 18] });
tech('ccgtTop', { name: 'Existing CCGT (Elecgas, lease from 2031)', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, ownConsent: true, offsite: true, fixedUnits: 2, verify: 'Elecgas / Endesa; study assumption' }, {
  ...CCGT_P, planM: [6, 'months', 3, 12], procM: [3, 'months', 1, 6], buildM: [9, 'months', 6, 18], earliestYear: [2031, 'year', 2029, 2033] });
"""
edit(d, "tech('smr', {", CCGT + "tech('smr', {")
PEGO = """
// Pego study build (revision 3): the case inputs. Nine 100 MW IT buildings every nine months from January 2029; no grid
// until January 2030, then 400 MW (study assumption); gas on site; roof solar only; no wind; hybrid PPA at 50 %.
export const PEGO = { buildings: 9, itPerBuilding: 100, firstMonth: 24, everyMonths: 9, gridFullMW: 400, gridFullMonth: 36 };
export function referencePego(opts = {}) {
  const inputs = buildDefaultInputs({ analysisStart: '2027-01', ...opts });
  const s = inputs.project.analysisStart;
  const P = { ...PEGO, ...(opts.pego || {}) };
  inputs.project.name = 'Pego data centre campus (study, revision 3.1)';
  inputs.project.lat = 39.468; inputs.project.lon = -8.109;
  inputs.site.areaHa = 150;
  inputs.load.itMW = P.buildings * P.itPerBuilding;
  inputs.load.phases = Array.from({ length: P.buildings }, (_, i) => ({ itMW: P.itPerBuilding, date: addMonths(s, P.firstMonth + P.everyMonths * i) }));
  inputs.load.coolingApproach = 'dlc';
  inputs.grid.nowMW = 0; inputs.grid.fullMW = P.gridFullMW; inputs.grid.fullDate = addMonths(s, P.gridFullMonth);
  inputs.utilities.gasAvailable = 'Yes'; inputs.utilities.gasDateMonths = 0;
  inputs.utilities.ppaInclude = true; inputs.utilities.ppaType = 'hybrid'; inputs.utilities.ppaCoverage = 50;
  // Revision 3.1: the tool now dispatches every year until nothing changes (up to 15; known issue 17 fixed), so the
  // revision 3 override (ten years) is no longer needed.
  // Grid connection charge: the tool's expected figure for 400 MW at extra-high voltage (EUR 120k/MW), entered with
  // "Use the expected figure" (indicative; REN's offer will replace it).
  inputs.grid.connectionCharge = (opts.pego && opts.pego.gridFullMW ? opts.pego.gridFullMW : 400) * 120000;
  inputs.choices.C2 = { state: 'open', values: ['ccgt', 'rented', 'gasRecip', 'gasTurbine', 'fuelCell', 'dieselPrime'] };
  inputs.choices.C4 = { state: 'open', values: ['none', 'ccgt', 'gasRecip', 'chp', 'fuelCell'] };
  inputs.choices.C10 = { state: 'locked', values: ['roof'] };
  inputs.choices.C11 = { state: 'locked', values: ['none'] };
  // Study settings (report, "Settings for this study"): HVO standby gensets required, as in revision 2. Revision 3.1: the
  // time-to-power weight is back at the tool's default, because the metric now counts months late against the phasing
  // plan (known issue 14 fixed). opts.study === false gives the tool's own defaults.
  if (opts.study !== false) {
    inputs.choices.C5 = { state: 'locked', values: ['hvo'] };
  }
  return inputs;
}
"""
edit(d, "export function referenceT3(opts = {}) {", PEGO + "\nexport function referenceT3(opts = {}) {")

# ---- sizing.js: technology maps and fixed unit counts ----
z = E / 'sizing.js'
edit(z, "dieselPrime: 'dieselPrime', rented: 'rented' };", "dieselPrime: 'dieselPrime', rented: 'rented', ccgt: 'ccgt' };")
edit(z, "smr: 'smr', hydrogen: 'hydrogen' };", "smr: 'smr', hydrogen: 'hydrogen', ccgt: 'ccgtTop' };")
# prime, shortfall sizing
edit(z, """      const n = Math.max(1, Math.ceil(S / t.p.unitMW - 1e-9));
      const extra = Math.ceil(n / req.blockSize);
      const units = n + extra;""", """      const n = Math.max(1, Math.ceil(S / t.p.unitMW - 1e-9));
      const extra = t.fixedUnits ? 0 : Math.ceil(n / req.blockSize);
      const units = t.fixedUnits || n + extra;""")
# prime, average sizing
edit(z, "      const units = Math.max(1, Math.round(target / t.p.unitMW));",
        "      const units = t.fixedUnits || Math.max(1, Math.round(target / t.p.unitMW));")
# bridging
edit(z, """      const n = Math.ceil(S / t.p.unitMW - 1e-9);
      const extra = Math.ceil(n / req.blockSize);
      const total = n + extra;""", """      const n = Math.ceil(S / t.p.unitMW - 1e-9);
      const extra = t.fixedUnits ? 0 : Math.ceil(n / req.blockSize);
      const total = t.fixedUnits || n + extra;""")
# fixed-unit plant: the sentences say so
s = z.read_text()
s = s.replace("= ${units} units (${r1(prime.mw)} MW).`);", "= ${units} units (${r1(prime.mw)} MW)${t.fixedUnits ? ` (existing plant: exactly ${t.fixedUnits} units, no N+1; the standby gensets cover a unit trip)` : ''}.`);", 1)
s = s.replace("= ${total} units (${r1(bridge.mw)} MW).`);", "= ${total} units (${r1(bridge.mw)} MW)${t.fixedUnits ? ` (existing plant: exactly ${t.fixedUnits} units, no N+1; the standby gensets cover a unit trip)` : ''}.`);", 1)
z.write_text(s)

# ---- blocks.js: not drawn on the campus (the CCGT stands beside it) ----
b = E / 'blocks.js'
edit(b, "rented: 'gasEngine', dieselPrime: 'gasEngine', gasTurbine: 'turbine',", "rented: 'gasEngine', dieselPrime: 'gasEngine', ccgt: 'turbine', ccgtTop: 'turbine', gasTurbine: 'turbine',")
edit(b, "rented: 'gas', gasTurbine: 'gas',", "rented: 'gas', ccgt: 'gas', ccgtTop: 'gas', gasTurbine: 'gas',")
edit(b, """function plantBlocks(plant, roleLabel, sp, push) {
  const t = TECH[plant.tech];""", """function plantBlocks(plant, roleLabel, sp, push) {
  const t = TECH[plant.tech];
  if (t.offsite) return; // Pego study build: the existing CCGT stands beside the campus""")

# ---- generator.js: rules for the CCGT records ----
g = E / 'generator.js'
edit(g, "export const RULE_D = {", """RULES.push(
  { id: 'l', name: '(l) Existing CCGT as bridging plant (Pego study build)',
    detail: 'C2 = Existing CCGT is generated only with C3 = Remove (lease ends when the grid arrives) or Retain as prime, never with C5 = Retained bridging plant (the HVO standby gensets stay the backup), and never with C4 = Existing CCGT (the same plant).',
    fails: (v) => v.C2 === 'ccgt' && ((v.C3 !== 'remove' && v.C3 !== 'prime' && v.C3 !== NA) || v.C5 === 'retained' || v.C4 === 'ccgt') },
  { id: 'm', name: '(m) Existing CCGT as firm top-up (Pego study build)',
    detail: 'C4 = Existing CCGT is generated only with C4 sizing = Permanent shortfall: the plant is two fixed units either way.',
    fails: (v) => v.C4 === 'ccgt' && v.C4s !== 'shortfall' },
);
export const RULE_D = {""")

# ---- App opens on the Pego case ----
a = ROOT / 'src' / 'App.jsx'
edit(a, "import { referenceT1, buildDefaultInputs,", "import { referencePego, referenceT1, buildDefaultInputs,")
edit(a, "const [inputs, setInputs] = useState(() => referenceT1());", "const [inputs, setInputs] = useState(() => referencePego());")
ix = E / 'index.js'
s = ix.read_text()
if 'referencePego' not in s:
    s = s.replace('referenceT1,', 'referenceT1, referencePego,', 1)
    ix.write_text(s)
print('patched', ROOT)

# ---- run.js: the run's site-layout stage is skipped (site fit is outside the ranking; the Site tab lays out the
# options it shows on demand). On this 2-core sandbox the stage took over an hour for 1,461 distinct block sets. ----
r = E / 'run.js'
edit(r, "  let layoutSummary = null;", """  let layoutSummary = null;
  // Pego study build: site layout skipped in the run (site fit is outside the ranking; the Site tab lays out on demand).
  if (STUDY.skipLayout) {
    const netM2 = Math.round(ctx.site.areas.netM2 || 0);
    for (let i = 0; i < n; i++) {
      const r = recs[i];
      r.layoutKey = 'not laid out'; r.layout = null;
      r.siteFit = { status: 'Fits', reasons: [], flags: [], unplaced: [], unplacedM2: 0, relaxed: [], landTakeM2: 0, landTakeHa: 0, placedM2: 0, fillM2: 0, fillMWp: 0, netM2,
        budgetShortfallM2: 0, residualM2: netM2, offsite: [], offsiteHa: 0, roof: { roofM2: 0, plantM2: 0, pvM2: 0, edgeM2: 0, freeM2: 0, overAllocated: false }, expansionMW: 0,
        heightsExceeded: 0, blocks: 0, placedBlocks: 0, label: 'not laid out in the run (Pego study build); see the Site tab', skipped: true };
    }
    log.start(STAGE.layout, n, { skipped: 'Pego study build' });
    log.end(STAGE.layout, n, n, { skipped: 'Pego study build' });
  } else
  {""", 1)
s = r.read_text()
# close the extra brace: the original block starts with "  {\n    const site = ctx.site;" right after; we opened "else\n  {" so remove the original opening brace
s = s.replace("  } else\n  {\n  // ---- 5. Site layout", "  } else\n  // ---- 5. Site layout", 1)
s = s.replace("export function* runModelSteps(", "export const STUDY = { skipLayout: true };\nexport function* runModelSteps(", 1)
r.write_text(s)

# ---- run.js: real site layouts for the best-ranked options (Site tab thumbnails and the plan read them) ----
s = r.read_text()
HELPER = """
// Pego study build: real site layouts for the best-ranked options only (the Site tab reads their site fit).
function studyLayouts(options, inputs, site) {
  if (!STUDY.skipLayout) return;
  const st = site || buildSiteModelStudy(inputs);
  for (const o of options) {
    if (!(o.rank <= STUDY.layoutTop)) continue;
    const L = layoutForOption(st, inputs, o);
    o.siteFit = L.siteFit;
    o.layoutKey = blockSetKey(L.bs);
    o.flags = [...o.flags, ...L.siteFit.flags];
  }
}
"""
old = "  runFlags.push(adequacyRunFlag(options));"
assert old in s
s = s.replace(old, "  if (scoring) studyLayouts(options, inputs, ctx.site);\n" + old, 1)
old = "  merged.generation = { ...base.generation,"
assert old in s
s = s.replace(old, "  studyLayouts(options, normalizeInputs(inputs), null);\n" + old, 1)
s = s.replace("export const STUDY = { skipLayout: true };", "export const STUDY = { skipLayout: true, layoutTop: 24 };" + HELPER, 1)
s = s.replace("import { siteSummary } from './site.js';", "import { siteSummary, buildSiteModel as buildSiteModelStudy } from './site.js';", 1)
r.write_text(s)
