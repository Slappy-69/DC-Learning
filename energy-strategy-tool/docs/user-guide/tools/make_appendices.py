#!/usr/bin/env python3
"""Generate Appendix A (full defaults register) and Appendix B (country data) as Markdown for the guide.
Reads data/registry.json, countries.json and fx.json (from dump-registry.mjs); writes src/07-appx-registry.md and
src/08-appx-countries.md. The published figures in Appendix B (Ember 2025, ECB 21 Oct 2026, wholesale prices) are
typed into this script with their sources; update them when the research of the defaults is done."""
import json, collections

from pathlib import Path
BASE = str(Path(__file__).resolve().parents[1])  # docs/user-guide; every path below is relative to it
reg = json.load(open(BASE + "/data/registry.json"))
countries = json.load(open(BASE + "/data/countries.json"))

def fmt_num(v):
    if isinstance(v, bool):
        return "on" if v else "off"
    if isinstance(v, int):
        return f"{v:,}"
    if isinstance(v, float):
        if abs(v) >= 1000:
            return f"{v:,.0f}"
        s = f"{v:.4f}".rstrip("0").rstrip(".")
        return s
    return str(v)

def fmt_val(v):
    if v is None:
        return "none"
    if isinstance(v, (int, float, bool)):
        return fmt_num(v)
    if isinstance(v, str):
        return v if v else "(empty)"
    if isinstance(v, list):
        if not v:
            return "none"
        if all(isinstance(x, (int, float)) for x in v):
            return " / ".join(fmt_num(x) for x in v)
        return json.dumps(v)
    if isinstance(v, dict):
        if "state" in v and "values" in v:
            return f"{v['state']}: {', '.join(v['values'])}"
        parts = []
        for k, x in v.items():
            if isinstance(x, dict):
                parts.append(f"{k} " + "/".join(fmt_num(y) for y in x.values()))
            else:
                parts.append(f"{k} {fmt_num(x)}")
        return "; ".join(parts)
    return str(v)

GROUP_TITLES = collections.OrderedDict([
    ("project", "Project"), ("country", "Country data (values in Appendix B)"), ("profiles", "Country profiles"), ("site", "Site"), ("load", "Load and building"),
    ("grid", "Grid"), ("utilities", "Utilities"), ("existing", "Existing plant near the site (lease)"), ("requirements", "Requirements"), ("economics", "Economics"),
    ("weights", "Weights"), ("deliverability", "Deliverability"), ("settings", "Run settings"), ("choices", "Choice default states"),
    ("fuel", "Fuels and emission factors"), ("ppa", "PPA prices"), ("cooling", "Cooling approaches"), ("tech", "Technology library"),
    ("spatial", "Spatial library (site layout)"), ("view", "View settings"), ("sensitivity", "Sensitivity (tornado)"),
    ("uncertainty", "Uncertainty (Monte Carlo)"), ("permitting", "Permitting"),
])
TECH_NAMES = {
    "solarGround": "Solar PV ground-mount", "solarRoof": "Solar PV rooftop", "solarCarport": "Solar PV carport", "wind": "Wind onshore",
    "bess": "Battery storage (BESS)", "gasRecip": "Gas reciprocating engines", "gasTurbine": "Gas turbines", "chp": "Gas CHP / trigeneration",
    "fuelCell": "Fuel cells (SOFC)", "dieselPrime": "HVO-diesel prime gensets", "rented": "Rented temporary generation", "smr": "Small modular reactor",
    "hydrogen": "Hydrogen gensets / fuel cells", "backupDiesel": "Diesel standby gensets", "backupHvo": "HVO standby gensets", "backupGas": "Gas standby gensets",
    "bessUps": "BESS-augmented UPS", "fuelStorage": "Bulk fuel storage", "substation": "Grid connection and substation", "gasConnection": "Gas connection pipe",
    "heatRejection": "Heat rejection",
}
COOL_NAMES = {"air": "Air (chilled water + free cooling)", "evap": "Evaporative-adiabatic", "dlc": "DLC + dry coolers", "immersion": "Immersion"}

groups = collections.OrderedDict((k, []) for k in GROUP_TITLES)
for r in reg:
    top = r["path"].split(".")[0]
    groups.setdefault(top, []).append(r)
# Every record must be listed (check H6, MED-6: the Monte Carlo and permitting records were silently left out).
unlisted = {k: len(v) for k, v in groups.items() if v and k not in GROUP_TITLES}
if unlisted:
    raise SystemExit(f"Appendix A would leave out records in groups with no title: {unlisted}. Add them to GROUP_TITLES.")

out = []
out.append("# Appendix A. The full defaults register {#appA}\n")
n_sourced = sum(1 for r in reg if (r.get("label") or "").startswith("sourced"))
out.append(f"Every default value in the current version: **{len(reg)} records**. Each entry gives the record's path, its value and unit, its range where one exists, its basis (source, judgement or run setting) and, where the brief names one, the source it should be checked against. **{n_sourced} records** carry a published source and the label \"sourced — not independently checked\" (work package 0, batches 1 and 2; the source, year and access date follow the entry). The other {len(reg) - n_sourced} are labelled \"indicative — unverified\" (confidence C, not verified). None is verified. Chapter 50 compares the important values with published sources.\n")
out.append("Abbreviations: **src** = basis \"source\" (should come from a published source); **judg** = judgement; **run** = run setting.\n")

def entry(r, short=None):
    name = short or r["path"]
    val = fmt_val(r["value"])
    if r["path"].startswith("site.exclusionType"):
        val = "hard" if r["value"] else "soft"
    if r.get("unit") in ("year", "integer") and isinstance(r["value"], int):
        val = str(r["value"])
    unit = r.get("unit") or ""
    if r["path"].startswith("site.exclusionType"):
        unit = ""
    if unit and isinstance(r["value"], (int, float)) and not isinstance(r["value"], bool):
        val = f"{val} {unit}"
    elif unit and isinstance(r["value"], list) and r["value"] and all(isinstance(x, (int, float)) for x in r["value"]):
        val = f"{val} {unit}"
    elif unit and not isinstance(r["value"], (int, float)):
        val = f"{val} ({unit})" if unit not in ("choice state",) else val
    rng = ""
    if r.get("low") is not None and r.get("high") is not None:
        if r.get("unit") == "year":
            rng = f"; range {r['low']}–{r['high']}"
        elif r["low"] == r["high"]:
            rng = ""
        else:
            rng = f"; range {fmt_num(r['low'])}–{fmt_num(r['high'])}"
    basis = {"source": "src", "judgement": "judg", "run setting": "run"}.get(r["basis"], r["basis"])
    s = f"- **{name}**: {val}{rng}; {basis}"
    if r.get("note"):
        s += f". {r['note'].rstrip('.')}"
    if (r.get("label") or "").startswith("sourced") and r.get("source"):
        s += f"; **sourced — not independently checked**: {r['source'].rstrip('.')} ({r.get('year') or 'n.d.'}, accessed {r.get('accessed') or 'n.d.'})"
    return s + "."

for key, title in GROUP_TITLES.items():
    rs = groups.get(key, [])
    if not rs:
        continue
    out.append(f"\n## {title}\n")
    if key == "tech":
        by = collections.OrderedDict()
        for r in rs:
            tid = r["path"].split(".")[1]
            by.setdefault(tid, []).append(r)
        for tid, items in by.items():
            out.append(f"\n### {TECH_NAMES.get(tid, tid)}\n")
            ver = items[0].get("sourceToVerify")
            if ver:
                out.append(f"Check against: {ver}.\n")
            for r in items:
                out.append(entry(r, r["path"].split(".")[-1]))
        continue
    if key == "spatial":
        by = collections.OrderedDict()
        for r in rs:
            sid = r["path"].split(".")[1]
            by.setdefault(sid, []).append(r)
        for sid, items in by.items():
            out.append(f"\n### {sid}\n")
            vers = sorted({r.get('sourceToVerify') for r in items if r.get('sourceToVerify')})
            if vers:
                out.append(f"Check against: {'; '.join(vers)}.\n")
            for r in items:
                out.append(entry(r, r["path"].split(".")[-1]))
        continue
    if key == "cooling":
        by = collections.OrderedDict()
        for r in rs:
            cid = r["path"].split(".")[1]
            by.setdefault(cid, []).append(r)
        for cid, items in by.items():
            out.append(f"\n### {COOL_NAMES.get(cid, cid)}\n")
            out.append(f"Check against: {items[0].get('sourceToVerify')}.\n")
            for r in items:
                out.append(entry(r, r["path"].split(".")[-1]))
        continue
    for r in rs:
        line = entry(r)
        if r.get("sourceToVerify") and not (r.get("label") or "").startswith("sourced"):
            line = line[:-1] + f"; check against {r['sourceToVerify'].rstrip('.')}."
        out.append(line)

open(BASE + "/src/07-appx-registry.md", "w").write("\n".join(out) + "\n")

# ------------------------------------------------------------------ Appendix B
pub_price = {  # published annual mean day-ahead price, €/MWh, (value, basis)
    "DE": (89.6, "2025, Electricity Maps"), "FR": (61.5, "2025, Electricity Maps"), "NL": (83.0, "2025, Electricity Maps"), "BE": (82.5, "2025, Electricity Maps"),
    "IE": (116.8, "2025, Electricity Maps"), "ES": (66.3, "2025, Electricity Maps"), "PL": (105.8, "2025, Electricity Maps"), "SE": (43.4, "2025, Electricity Maps, country"),
    "NO": (44.2, "2025, Electricity Maps, country"), "DK": (80.1, "2025, Electricity Maps"), "GB": (96.9, "2025, £81.2 at ECB rate"), "IT": (117.8, "2025, PUN 12 months"),
    "AT": (100.4, "2025, Electricity Maps"), "BG": (102.7, "2024, ACER"), "HR": (94.8, "2024, ACER"), "CZ": (95.5, "2025, Electricity Maps"), "EE": (87.3, "2024, ACER"), "FI": (40.8, "2025, Electricity Maps"),
    "GR": (101.0, "2024, ACER"), "HU": (100.9, "2024, ACER"), "LV": (87.4, "2024, ACER"), "LT": (87.3, "2024, ACER"), "LU": (89.6, "2025, DE-LU zone"),
    "PT": (66.1, "2025, Electricity Maps"), "RO": (103.7, "2024, ACER"), "SK": (93.0, "2024, ACER"), "SI": (106.0, "2025, Electricity Maps"),
}
pub_carbon = {"AT": 116.91, "BE": 149.82, "BG": 275.55, "HR": 158.5, "CY": 489, "CZ": 401.46, "DK": 114.41, "EE": 319.15, "FI": 57.47, "FR": 41.44,
              "DE": 329.65, "GR": 315.09, "HU": 163.02, "IE": 256.54, "IT": 284.78, "LV": 138.76, "LT": 138.36, "LU": 123.38, "MT": 484.02, "NL": 253.56,
              "PL": 588.6, "PT": 127.91, "RO": 250.75, "SK": 94.85, "SI": 183.29, "ES": 153.6, "SE": 35.26, "GB": 217.41, "NO": 28.11, "CH": 39.22, "IS": 27.82}

def status(app, pub, tol=0.10):
    d = (app - pub) / pub
    if abs(d) <= tol:
        return f"{d * 100:+.0f} %", "consistent"
    return f"{d * 100:+.0f} %", "update"

b = []
b.append("# Appendix B. Country data {#appB}\n")
b.append("The 31 built-in countries and the annual targets their synthetic profiles are calibrated to. All values are indicative and unverified in the current version. Tables B2 and B3 compare the price and carbon targets with the latest published annual figures found on 21 October 2026 (Austria, Czechia, Finland, Portugal and Slovenia rechecked against the 2025 figures on 23 October 2026, Haiku check H2); a difference within ±10 % is marked \"consistent\".\n")
b.append("\n## B1. Calibration targets\n")
b.append("Mean temperature (°C) and seasonal swing (± °C); solar yield (kWh per kWp a year); wind capacity factor; and the 2050 grid carbon multiplier.\n")
b.append("| Country | Temp. | Solar | Wind | 2050 |\n|---|---|---|---|---|")
for code, c in countries.items():
    b.append(f"| {c['name']} ({code}) | {c['tMean']:g} ± {c['tAmp']:g} | {c['solarYield']:,} | {c['windCF']:.2f} | {c['decarb2050']:g} |")
b.append("\nPrices: mean wholesale price and non-commodity adder (€/MWh), gas commodity price (€/MWh of gas) and carbon price (€/t), with the currency used for display.\n")
b.append("| Country | Price + adder | Gas | Carbon | Currency |\n|---|---|---|---|---|")
for code, c in countries.items():
    b.append(f"| {c['name']} ({code}) | {c['price']:g} + {c['adder']:g} | {c['gas']:g} | {c['carbonPrice']:g} | {c['currency']} |")

b.append("\n## B2. Wholesale price: app target against published figures\n")
b.append("Published values: mean day-ahead price for 2025 (Electricity Maps \"Grid in review 2025\", or Italy's PUN over the 12 months to December 2025) where found, otherwise the 2024 annual average from ACER's ENTSO-E-based table. Countries with several price zones (Sweden, Norway, Denmark, Italy) have one country figure here; data centre regions may differ (for example southern Sweden is dearer than the north). No figure was found for Cyprus, Malta, Switzerland or Iceland.\n")
b.append("| Country | App | Published (basis) | Difference |\n|---|---|---|---|")
for code, c in countries.items():
    if code in pub_price:
        v, basis = pub_price[code]
        d, st = status(c["price"], v)
        b.append(f"| {code} | {c['price']:g} | {v:g} ({basis}) | {d}, {st} |")
    else:
        b.append(f"| {code} | {c['price']:g} | not found | not checked |")

b.append("\n## B3. Grid carbon intensity: app target against published figures\n")
b.append("Published values: Ember's 2025 carbon intensity of electricity generation (g CO₂e per kWh, life-cycle basis), as published by Our World in Data. The app's values are for the country's grid mix; which basis the tool should use (life-cycle or direct, generation or consumption) is part of the research.\n")
b.append("| Country | App | Ember 2025 | Difference |\n|---|---|---|---|")
for code, c in countries.items():
    v = pub_carbon[code]
    d, st = status(c["carbon"], v)
    b.append(f"| {code} | {c['carbon']:g} | {v:g} | {d}, {st} |")

b.append("\n## B4. Exchange rates\n")
b.append("| Currency | App (per euro) | ECB, 21 Oct 2026 | Difference |\n|---|---|---|---|")
fx_app = json.load(open(BASE + "/data/fx.json"))
ecb = {"GBP": 0.83825, "NOK": 10.5120, "SEK": 11.0975, "DKK": 7.4746, "CHF": 0.9256, "ISK": 136.20}
for k, v in ecb.items():
    d = (fx_app[k] - v) / v * 100
    b.append(f"| {k} | {fx_app[k]:g} | {v:g} | {d:+.1f} % |")
open(BASE + "/src/08-appx-countries.md", "w").write("\n".join(b) + "\n")

# Summary numbers for the text
cnt = collections.Counter()
for code, c in countries.items():
    if code in pub_price:
        cnt["price_" + status(c["price"], pub_price[code][0])[1]] += 1
    cnt["carbon_" + status(c["carbon"], pub_carbon[code])[1]] += 1
print(cnt)
big = sorted(((abs((c['carbon'] - pub_carbon[k]) / pub_carbon[k]), k, c['carbon'], pub_carbon[k]) for k, c in countries.items()), reverse=True)[:10]
print(big)
bigp = sorted(((abs((c['price'] - pub_price[k][0]) / pub_price[k][0]), k, c['price'], pub_price[k][0]) for k, c in countries.items() if k in pub_price), reverse=True)[:10]
print(bigp)
