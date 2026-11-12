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
import { DETAIL, DETAIL_SOURCES } from '../src/data/europe-detail.js';
import { decodeLine, layer, paths, places, nearest } from '../src/components/mapdetail.js';
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
    // The map's detail layers (2026-11-12): no network either. The data file names its sources (web addresses inside
    // DETAIL_SOURCES only); the code that draws it names none.
    assert.ok(!/\bfetch\(|XMLHttpRequest|https?:\/\//.test(readFileSync(new URL('../src/components/mapdetail.js', import.meta.url), 'utf8')), 'mapdetail.js reaches the network');
    const det = readFileSync(new URL('../src/data/europe-detail.js', import.meta.url), 'utf8');
    assert.ok(!/\bfetch\(|XMLHttpRequest|import\(/.test(det), 'europe-detail.js reaches the network');
    const urls = det.match(/https?:\/\/[^"'\s]+/g) || [];
    const srcLine = det.split('\n').find((l) => l.startsWith('export const DETAIL_SOURCES')) || '';
    assert.ok(urls.length > 0 && urls.every((u) => srcLine.includes(u)), 'web addresses only in the source records');
    const kb = readFileSync(new URL('../src/data/europe-map.js', import.meta.url)).length / 1024;
    assert.ok(kb < 400, `map data ${kb} kB`);
    out.push(`map data ${kb.toFixed(0)} kB bundled, ${MAP_COUNTRIES.length} outlines`);
    return out.join('; ') + '.';
  });

  await test('82. Map detail (owner, 2026-11-12: "I want to be able to see way more detail"): the bundled detail layers decode inside the map window; every layer has its source and licence; towns, the grid and substations are where they should be; the paths are thinned to the screen, and a view far from a feature draws none of it', () => {
    const out = [];
    const want = { land: 60, borders: 1000, regions: 5000, rivers: 1000, lakes: 500, urban: 3000, roads: 8000, rail: 5000, grid: 8000 };
    for (const [name, min] of Object.entries(want)) {
      const L = layer(name);
      assert.ok(L.length >= min, `${name}: ${L.length} features`);
      // Rings are cut along a one-degree margin round the window; lines keep one point either side of it, so every
      // segment has at least one end within half a degree of the window.
      const inW = (x, y, m) => x >= -32 - m && x <= 46 + m && y >= 33 - m && y <= 72 + m;
      const poly = ['land', 'lakes', 'urban'].includes(name);
      for (const f of L) for (const p of f.parts) {
        const n = p.length / 2;
        if (poly) { for (let i = 0; i < n; i++) assert.ok(inW(p[2 * i], p[2 * i + 1], 1.01), `${name} point ${p[2 * i]}, ${p[2 * i + 1]}`); continue; }
        for (let i = 1; i < n; i++) assert.ok(inW(p[2 * i - 2], p[2 * i - 1], 0.51) || inW(p[2 * i], p[2 * i + 1], 0.51), `${name} segment to ${p[2 * i]}, ${p[2 * i + 1]}`);
      }
      out.push(`${name} ${L.length}`);
    }
    // The polyline code: a round trip on a known string.
    const d = decodeLine('_ibE_seK_seK_seK');
    assert.deepEqual(Array.from(d).map((x) => Math.round(x * 1000) / 1000), [100, 200, 300, 400]);
    // Sources: Natural Earth (public domain), GeoNames (CC BY 4.0), the ENTSO-E map extract (CC BY 4.0, unofficial).
    assert.equal(DETAIL_SOURCES.length, 3);
    assert.ok(DETAIL_SOURCES.every((x) => x.name && x.licence && /^https:/.test(x.url)));
    assert.ok(/public domain/.test(DETAIL_SOURCES[0].licence) && /CC BY 4\.0/.test(DETAIL_SOURCES[1].licence) && /not approved or endorsed by ENTSO-E/.test(DETAIL_SOURCES[2].licence));
    // Towns: largest first; London is the largest in the window.
    const T = places();
    assert.ok(T.length > 20000 && T.every((t, i) => i === 0 || t.pop <= T[i - 1].pop) && T.every((t) => t.pop >= 3000));
    const lon = T.find((t) => t.name === 'London');
    assert.ok(lon && lon.cap === 2 && Math.abs(lon.lat - 51.51) < 0.05 && Math.abs(lon.lon + 0.13) < 0.05, JSON.stringify(lon));
    // Nearest town and substations: T1's pin (Leamington Spa) and Eemshaven (the HVDC converters of NorNed and COBRAcable).
    const a = nearest(52.29, -1.53), b = nearest(53.43, 6.84);
    assert.equal(a.town.name, 'Royal Leamington Spa');
    assert.ok(a.town.km < 3 && a.sub220.kv >= 220 && a.sub220.km < 20, JSON.stringify(a));
    assert.ok(b.sub220.km < 3, JSON.stringify(b.sub220));
    out.push(`T1 pin: ${a.town.name} ${a.town.km.toFixed(1)} km, a ${a.sub220.kv} kV substation ${a.sub220.km.toFixed(1)} km; Eemshaven: ${b.sub220.dc ? 'an HVDC converter' : `${b.sub220.kv} kV`} ${b.sub220.km.toFixed(1)} km`);
    // Paths: thinned with the tolerance, empty far away.
    const area = [-3, 51, 0, 53.5];
    const fine = paths('roads', area, 0.001).get('') || '', coarse = paths('roads', area, 0.05).get('') || '';
    assert.ok(fine.length > coarse.length * 1.3 && coarse.length > 0, `${fine.length} against ${coarse.length} characters`);
    assert.equal(paths('grid', [-31, 34, -30, 35], 0.01).size, 0, 'nothing in the Atlantic');
    out.push(`roads near the pin: ${fine.length.toLocaleString('en-GB')} characters of path at 0.001°, ${coarse.length.toLocaleString('en-GB')} at 0.05°`);
    const kb = JSON.stringify(DETAIL).length / 1024;
    assert.ok(kb < 4000, `detail data ${kb} kB`);
    return `${out.join('; ')}; ${kb.toFixed(0)} kB bundled.`;
  });
}
