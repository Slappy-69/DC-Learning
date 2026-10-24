// 34. Work package 1: map pin, country from the pin, display currency (AC 17; BRIEF §5.1). Offline: the map outlines
// are bundled (Natural Earth, public domain); no network.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAP_COUNTRIES, MAP_SOURCE } from '../src/data/europe-map.js';
import { countryAtPoint } from '../src/engine/geocountry.js';
import { countryFromPin, pinCountryInfo, resolveCountry, buildContext } from '../src/engine/context.js';
import { nearestCountry } from '../src/engine/profiles.js';
import { COUNTRIES, FX, normalizeInputs, referenceT1 } from '../src/engine/defaults.js';
import { assumedBase } from '../src/engine/assumed.js';
import { setDisplayCurrency, perMWh, money, curUnit } from '../src/format.js';

export async function locationTests(test, ctxRuns) {
  await test('34. Location (work package 1, AC 17): the bundled map outlines hold all 31 built-in countries; the pin picks the country whose outline contains it (Strasbourg is France, where the nearest reference point says Luxembourg); a pin outside the built-in countries falls back to the nearest one and is flagged; results can be shown in the site currency at the release rate; the map code makes no network request', () => {
    const out = [];
    assert.equal(MAP_COUNTRIES.filter((c) => c.iso2).length, 31);
    for (const k of Object.keys(COUNTRIES)) assert.ok(MAP_COUNTRIES.some((c) => c.iso2 === k), `${k} has no outline`);
    assert.equal(MAP_SOURCE.licence, 'public domain');
    const cases = [[52.29, -1.53, 'GB'], [38.72, -9.14, 'PT'], [46.2, 6.15, 'CH'], [48.58, 7.75, 'FR'], [53.35, -6.26, 'IE'], [64.15, -21.94, 'IS'], [35.9, 14.5, 'MT'], [60.17, 24.94, 'FI']];
    for (const [la, lo, want] of cases) assert.equal(countryFromPin(la, lo), want, `${la}, ${lo}`);
    assert.equal(nearestCountry(48.58, 7.75), 'LU', 'the reference-point rule this replaces');
    assert.equal(countryAtPoint(55, 3), null, 'North Sea');
    const bel = pinCountryInfo(44.8, 20.46);
    assert.ok(!bel.inside && bel.mapName === 'Serbia' && COUNTRIES[bel.code], `Belgrade: ${JSON.stringify(bel)}`);
    out.push(`${cases.length} pins resolved by outline (Strasbourg FR; the reference-point rule said LU); North Sea none; Belgrade → Serbia, no profile, nearest ${bel.code}`);
    // The run uses the pin's country, and a pin outside the built-in countries is flagged as assumed.
    const inp = normalizeInputs(referenceT1({ analysisStart: ctxRuns.START }));
    inp.project.lat = 48.58; inp.project.lon = 7.75;
    assert.equal(resolveCountry(inp), 'FR');
    const inp2 = normalizeInputs(referenceT1({ analysisStart: ctxRuns.START }));
    inp2.project.lat = 44.8; inp2.project.lon = 20.46;
    const ctx2 = buildContext(inp2, { site: ctxRuns.runT1.ctx.site });
    const b = assumedBase(ctx2);
    assert.ok(b.list.some((x) => x.path === 'project.country' && /Serbia/.test(x.text)), 'pin outside built-in countries not flagged');
    assert.ok(b.list.some((x) => x.path === 'project.climate'), 'design temperature basis not flagged');
    // Display currency.
    setDisplayCurrency('GBP', FX.GBP);
    assert.equal(perMWh(100), `£${Number((100 * FX.GBP).toPrecision(3))}/MWh`);
    assert.equal(money(2e6), `£${Number((2 * FX.GBP).toPrecision(3))} m`);
    assert.equal(curUnit('€/MWh'), '£/MWh');
    setDisplayCurrency('EUR');
    assert.equal(perMWh(100), '€100/MWh');
    out.push(`GBP at ${FX.GBP}: €100/MWh shown as £${(100 * FX.GBP).toPrecision(3)}/MWh`);
    // Offline: map and lookup code reach no network.
    for (const f of ['../src/components/MapPicker.jsx', '../src/engine/geocountry.js', '../src/data/europe-map.js']) {
      const src = readFileSync(new URL(f, import.meta.url), 'utf8');
      assert.ok(!/\bfetch\(|XMLHttpRequest|https?:\/\/(?!naturalearthdata)/.test(src), `${f} reaches the network`);
    }
    const kb = readFileSync(new URL('../src/data/europe-map.js', import.meta.url)).length / 1024;
    assert.ok(kb < 400, `map data ${kb} kB`);
    out.push(`map data ${kb.toFixed(0)} kB bundled, ${MAP_COUNTRIES.length} outlines`);
    return out.join('; ') + '.';
  });
}
